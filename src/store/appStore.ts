import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { AppState, AppActions, VideoOptions, ProcessedImage, TransitionType, ProcessingProgress } from '../types';
import { FaceDetectorService } from '../services/FaceDetectorService';
import { ImageProcessorService } from '../services/ImageProcessorService';
import { VideoCreatorService } from '../services/VideoCreatorService';
import { TransitionEngineService } from '../services/TransitionEngineService';

// Default video options
const defaultVideoOptions: VideoOptions = {
  resolution: { width: 1080, height: 1080 },
  frameRate: 30,
  duration: 10,
  transitionType: TransitionType.OPACITY_FADE,
  transitionDuration: 10, // frames
};

interface AppStore extends AppState, AppActions {
  // Service instances
  faceDetector: FaceDetectorService;
  imageProcessor: ImageProcessorService;
  videoCreator: VideoCreatorService;
  transitionEngine: TransitionEngineService;
  
  // Processing progress
  processingProgress: ProcessingProgress | null;
  setProcessingProgress: (progress: ProcessingProgress | null) => void;
  
  // Service initialization
  initializeServices: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      isLoading: false,
      currentStep: 'upload',
      error: null,
      uploadedImages: [],
      processedImages: [],
      videoOptions: defaultVideoOptions,
      generatedVideo: null,
      videoPreviewUrl: null,
      processingProgress: null,

      // Service instances
      faceDetector: new FaceDetectorService(),
      imageProcessor: new ImageProcessorService(),
      videoCreator: new VideoCreatorService(),
      transitionEngine: new TransitionEngineService(),

      // Service initialization
      initializeServices: async () => {
        const { faceDetector, videoCreator, setLoading, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          console.log('Initializing services...');
          
          // Initialize face detector
          await faceDetector.initialize();
          console.log('Face detector initialized');
          
          // Initialize video creator
          await videoCreator.initialize();
          console.log('Video creator initialized');
          
          console.log('All services initialized successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize services';
          console.error('Service initialization failed:', error);
          setError(errorMessage);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      // UI actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setCurrentStep: (step: AppState['currentStep']) => set({ currentStep: step }),
      
      setError: (error: string | null) => set({ error }),
      
      setProcessingProgress: (progress: ProcessingProgress | null) => 
        set({ processingProgress: progress }),

      // Image actions
      addImages: (images: File[]) => {
        const { uploadedImages } = get();
        const newImages = [...uploadedImages, ...images];
        set({ uploadedImages: newImages });
        
        // Clear processed images when new images are added
        set({ processedImages: [], generatedVideo: null, videoPreviewUrl: null });
      },

      removeImage: (index: number) => {
        const { uploadedImages, processedImages } = get();
        const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
        const newProcessedImages = processedImages.filter((_, i) => i !== index);
        
        set({ 
          uploadedImages: newUploadedImages, 
          processedImages: newProcessedImages,
          generatedVideo: null,
          videoPreviewUrl: null
        });
      },

      clearImages: () => {
        set({ 
          uploadedImages: [], 
          processedImages: [], 
          generatedVideo: null, 
          videoPreviewUrl: null,
          currentStep: 'upload'
        });
      },

      setProcessedImages: (images: ProcessedImage[]) => set({ processedImages: images }),

      // Video settings
      updateVideoOptions: (options: Partial<VideoOptions>) => {
        const { videoOptions } = get();
        set({ videoOptions: { ...videoOptions, ...options } });
      },

      // Video generation
      setGeneratedVideo: (video: Blob | null) => {
        const { videoPreviewUrl } = get();
        
        // Cleanup old URL
        if (videoPreviewUrl) {
          URL.revokeObjectURL(videoPreviewUrl);
        }
        
        const newVideoPreviewUrl = video ? URL.createObjectURL(video) : null;
        
        set({ 
          generatedVideo: video, 
          videoPreviewUrl: newVideoPreviewUrl 
        });
      },

      setVideoPreviewUrl: (url: string | null) => set({ videoPreviewUrl: url }),

      // Processing actions
      processImages: async () => {
        const { 
          uploadedImages, 
          faceDetector, 
          imageProcessor, 
          videoOptions,
          setLoading, 
          setError, 
          setProcessedImages,
          setCurrentStep,
          setProcessingProgress
        } = get();

        if (uploadedImages.length === 0) {
          setError('No images to process');
          return;
        }

        try {
          setLoading(true);
          setError(null);
          setCurrentStep('processing');
          
          const processedImages: ProcessedImage[] = [];

          for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];
            
            setProcessingProgress({
              current: i + 1,
              total: uploadedImages.length,
              stage: 'detection',
              message: `Processing image ${i + 1} of ${uploadedImages.length}...`
            });

            // Load image
            const image = await imageProcessor.loadImageFromFile(file);
            
            setProcessingProgress({
              current: i + 1,
              total: uploadedImages.length,
              stage: 'detection',
              message: `Detecting faces in image ${i + 1}...`
            });

            // Detect faces
            const detections = await faceDetector.detectFaces(image);
            
            if (detections.length === 0) {
              throw new Error(`No faces detected in image ${i + 1}`);
            }

            // Select the best face if multiple are detected
            const bestFace = faceDetector.selectBestFace(detections);
            
            if (!faceDetector.validateFaceDetection(bestFace)) {
              throw new Error(`Face in image ${i + 1} is not suitable for processing`);
            }

            setProcessingProgress({
              current: i + 1,
              total: uploadedImages.length,
              stage: 'centering',
              message: `Centering face in image ${i + 1}...`
            });

            // Process the image (center and crop)
            const centeredCanvas = imageProcessor.centerImage(
              image, 
              bestFace.eyePositions, 
              videoOptions.resolution
            );

            const processedImage: ProcessedImage = {
              canvas: centeredCanvas,
              originalImage: image,
              faceDetection: bestFace,
              centerOffset: imageProcessor.calculateCenterOffset(
                bestFace.eyePositions, 
                videoOptions.resolution
              )
            };

            processedImages.push(processedImage);
          }

          setProcessedImages(processedImages);
          setCurrentStep('preview');
          setProcessingProgress(null);
          
          console.log(`Successfully processed ${processedImages.length} images`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Image processing failed';
          console.error('Image processing failed:', error);
          setError(errorMessage);
          setCurrentStep('upload');
          setProcessingProgress(null);
        } finally {
          setLoading(false);
        }
      },

      generateVideo: async () => {
        const { 
          processedImages, 
          videoOptions,
          videoCreator,
          transitionEngine,
          setLoading, 
          setError, 
          setGeneratedVideo,
          setCurrentStep,
          setProcessingProgress
        } = get();

        if (processedImages.length === 0) {
          setError('No processed images available for video generation');
          return;
        }

        try {
          setLoading(true);
          setError(null);
          setCurrentStep('generating');
          
          setProcessingProgress({
            current: 0,
            total: 100,
            stage: 'video_creation',
            message: 'Preparing video frames...'
          });

          let videoBlob: Blob;

          if (videoOptions.transitionType === TransitionType.HARD_CUT) {
            // Simple video creation without transitions
            videoBlob = await videoCreator.createVideoFromImages(processedImages, videoOptions);
          } else {
            // Create video with transitions
            const transitionFrames: HTMLCanvasElement[][] = [];

            setProcessingProgress({
              current: 25,
              total: 100,
              stage: 'video_creation',
              message: 'Creating transitions...'
            });

            // Generate transition frames between images
            for (let i = 0; i < processedImages.length - 1; i++) {
              const frame1 = processedImages[i].canvas;
              const frame2 = processedImages[i + 1].canvas;
              
              const transitions = transitionEngine.createTransition(
                frame1,
                frame2,
                videoOptions.transitionType,
                videoOptions.transitionDuration
              );
              
              // Remove the first and last frames to avoid duplication
              transitionFrames.push(transitions.slice(1, -1));
            }

            setProcessingProgress({
              current: 75,
              total: 100,
              stage: 'video_creation',
              message: 'Generating video...'
            });

            videoBlob = await videoCreator.createVideoWithTransitions(
              processedImages,
              transitionFrames,
              videoOptions
            );
          }

          setProcessingProgress({
            current: 100,
            total: 100,
            stage: 'video_creation',
            message: 'Video generation complete!'
          });

          setGeneratedVideo(videoBlob);
          setCurrentStep('preview');
          setProcessingProgress(null);
          
          console.log('Video generated successfully');
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
          console.error('Video generation failed:', error);
          setError(errorMessage);
          setProcessingProgress(null);
        } finally {
          setLoading(false);
        }
      },
    })),
    {
      name: 'face-center-app-store',
    }
  )
);

// Selector hooks for optimized re-renders
export const useImages = () => useAppStore((state) => ({
  uploadedImages: state.uploadedImages,
  processedImages: state.processedImages,
  addImages: state.addImages,
  removeImage: state.removeImage,
  clearImages: state.clearImages,
}));

export const useVideoGeneration = () => useAppStore((state) => ({
  generatedVideo: state.generatedVideo,
  videoPreviewUrl: state.videoPreviewUrl,
  videoOptions: state.videoOptions,
  updateVideoOptions: state.updateVideoOptions,
  generateVideo: state.generateVideo,
}));

export const useProcessing = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  processingProgress: state.processingProgress,
  processImages: state.processImages,
  generateVideo: state.generateVideo,
}));

export const useAppState = () => useAppStore((state) => ({
  currentStep: state.currentStep,
  error: state.error,
  isLoading: state.isLoading,
  setCurrentStep: state.setCurrentStep,
  setError: state.setError,
}));
