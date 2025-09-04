import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { VideoCreator, VideoFrame, VideoOptions, ProcessedImage } from '../types';

export class VideoCreatorService implements VideoCreator {
  private ffmpeg: FFmpeg;
  private isInitialized = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize FFmpeg with core files
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      this.ffmpeg.on('progress', ({ progress }) => {
        console.log('[FFmpeg] Progress:', `${Math.round(progress * 100)}%`);
      });

      await this.ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });

      this.isInitialized = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error('Failed to initialize video creator');
    }
  }

  async createVideo(frames: VideoFrame[], options: VideoOptions): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('VideoCreator not initialized. Call initialize() first.');
    }

    if (frames.length === 0) {
      throw new Error('No frames provided for video creation');
    }

    try {
      // Convert frames to PNG files
      for (let i = 0; i < frames.length; i++) {
        const frameBlob = await this.canvasToBlob(frames[i].canvas);
        const frameData = await fetchFile(frameBlob);
        await this.ffmpeg.writeFile(`frame_${String(i).padStart(6, '0')}.png`, frameData);
      }

      // Calculate frame duration based on frame rate (for future use)
      // const frameDuration = 1 / options.frameRate;
      
      // FFmpeg command to create video
      const outputFilename = 'output.mp4';
      
      await this.ffmpeg.exec([
        '-framerate', options.frameRate.toString(),
        '-i', 'frame_%06d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', options.frameRate.toString(),
        '-s', `${options.resolution.width}x${options.resolution.height}`,
        '-t', options.duration.toString(),
        outputFilename
      ]);

      // Read the output video
      const videoData = await this.ffmpeg.readFile(outputFilename);
      
      // Clean up temporary files
      await this.cleanupTempFiles(frames.length);
      await this.ffmpeg.deleteFile(outputFilename);

      // Convert to blob
      return new Blob([videoData], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video creation failed:', error);
      throw new Error(`Video creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createVideoFromImages(images: ProcessedImage[], options: VideoOptions): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('VideoCreator not initialized. Call initialize() first.');
    }

    if (images.length === 0) {
      throw new Error('No images provided for video creation');
    }

    try {
      // Calculate frame duration for each image
      const totalDuration = options.duration;
      const frameDuration = totalDuration / images.length;
      const framesPerImage = Math.max(1, Math.floor(options.frameRate * frameDuration));

      let frameIndex = 0;

      // Convert each image to multiple frames based on duration
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Create frames for this image (for duration)
        for (let j = 0; j < framesPerImage; j++) {
          const frameBlob = await this.canvasToBlob(image.canvas);
          const frameData = await fetchFile(frameBlob);
          await this.ffmpeg.writeFile(`frame_${String(frameIndex).padStart(6, '0')}.png`, frameData);
          frameIndex++;
        }
      }

      // Create video from frames
      const outputFilename = 'output.mp4';
      
      await this.ffmpeg.exec([
        '-framerate', options.frameRate.toString(),
        '-i', 'frame_%06d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', options.frameRate.toString(),
        '-s', `${options.resolution.width}x${options.resolution.height}`,
        outputFilename
      ]);

      // Read the output video
      const videoData = await this.ffmpeg.readFile(outputFilename);
      
      // Clean up temporary files
      await this.cleanupTempFiles(frameIndex);
      await this.ffmpeg.deleteFile(outputFilename);

      return new Blob([videoData], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video creation from images failed:', error);
      throw new Error(`Video creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a video with custom transitions between images
   */
  async createVideoWithTransitions(
    images: ProcessedImage[],
    transitionFrames: HTMLCanvasElement[][],
    options: VideoOptions
  ): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('VideoCreator not initialized. Call initialize() first.');
    }

    try {
      let frameIndex = 0;

      // Calculate timing
      const imageDisplayTime = (options.duration - (images.length - 1) * (options.transitionDuration / options.frameRate)) / images.length;
      const framesPerImage = Math.max(1, Math.floor(options.frameRate * imageDisplayTime));

      for (let i = 0; i < images.length; i++) {
        // Add frames for the main image
        for (let j = 0; j < framesPerImage; j++) {
          const frameBlob = await this.canvasToBlob(images[i].canvas);
          const frameData = await fetchFile(frameBlob);
          await this.ffmpeg.writeFile(`frame_${String(frameIndex).padStart(6, '0')}.png`, frameData);
          frameIndex++;
        }

        // Add transition frames (if not the last image)
        if (i < images.length - 1 && transitionFrames[i]) {
          for (const transitionFrame of transitionFrames[i]) {
            const frameBlob = await this.canvasToBlob(transitionFrame);
            const frameData = await fetchFile(frameBlob);
            await this.ffmpeg.writeFile(`frame_${String(frameIndex).padStart(6, '0')}.png`, frameData);
            frameIndex++;
          }
        }
      }

      // Create video
      const outputFilename = 'output.mp4';
      
      await this.ffmpeg.exec([
        '-framerate', options.frameRate.toString(),
        '-i', 'frame_%06d.png',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', options.frameRate.toString(),
        '-s', `${options.resolution.width}x${options.resolution.height}`,
        outputFilename
      ]);

      const videoData = await this.ffmpeg.readFile(outputFilename);
      
      // Clean up
      await this.cleanupTempFiles(frameIndex);
      await this.ffmpeg.deleteFile(outputFilename);

      return new Blob([videoData], { type: 'video/mp4' });
    } catch (error) {
      console.error('Video creation with transitions failed:', error);
      throw new Error(`Video creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a preview video (lower quality, shorter duration)
   */
  async createPreview(images: ProcessedImage[], options: Partial<VideoOptions> = {}): Promise<Blob> {
    const previewOptions: VideoOptions = {
      resolution: { width: 480, height: 480 },
      frameRate: 15,
      duration: Math.min(10, images.length * 0.5), // Max 10 seconds or 0.5s per image
      transitionType: options.transitionType || options.transitionType!,
      transitionDuration: 5, // 5 frames
    };

    return this.createVideoFromImages(images, previewOptions);
  }

  /**
   * Add audio to an existing video
   */
  async addAudioToVideo(videoBlob: Blob, audioBlob: Blob): Promise<Blob> {
    if (!this.isInitialized) {
      throw new Error('VideoCreator not initialized. Call initialize() first.');
    }

    try {
      // Write video and audio files
      const videoData = await fetchFile(videoBlob);
      const audioData = await fetchFile(audioBlob);
      
      await this.ffmpeg.writeFile('input_video.mp4', videoData);
      await this.ffmpeg.writeFile('input_audio.mp3', audioData);

      // Merge video and audio
      await this.ffmpeg.exec([
        '-i', 'input_video.mp4',
        '-i', 'input_audio.mp3',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        'output_with_audio.mp4'
      ]);

      const outputData = await this.ffmpeg.readFile('output_with_audio.mp4');

      // Clean up
      await this.ffmpeg.deleteFile('input_video.mp4');
      await this.ffmpeg.deleteFile('input_audio.mp3');
      await this.ffmpeg.deleteFile('output_with_audio.mp4');

      return new Blob([outputData], { type: 'video/mp4' });
    } catch (error) {
      console.error('Adding audio to video failed:', error);
      throw new Error(`Adding audio failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
  }

  private async cleanupTempFiles(frameCount: number): Promise<void> {
    try {
      for (let i = 0; i < frameCount; i++) {
        const filename = `frame_${String(i).padStart(6, '0')}.png`;
        try {
          await this.ffmpeg.deleteFile(filename);
        } catch (error) {
          // Ignore errors for files that don't exist
          console.warn(`Failed to delete ${filename}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  /**
   * Get video duration from blob
   */
  async getVideoDuration(videoBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(videoBlob);
    });
  }

  /**
   * Extract frames from existing video
   */
  async extractFrames(videoBlob: Blob, frameCount: number): Promise<HTMLCanvasElement[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const frames: HTMLCanvasElement[] = [];
      let currentFrame = 0;

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const interval = duration / frameCount;

        const extractFrame = () => {
          if (currentFrame >= frameCount) {
            resolve(frames);
            URL.revokeObjectURL(video.src);
            return;
          }

          video.currentTime = currentFrame * interval;
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.drawImage(video, 0, 0);
          frames.push(canvas);
          
          currentFrame++;
          extractFrame();
        };

        extractFrame();
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(videoBlob);
    });
  }
}
