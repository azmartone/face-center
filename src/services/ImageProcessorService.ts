import { ImageProcessor, EyePosition, Resolution, CenterOffset } from '../types';

export class ImageProcessorService implements ImageProcessor {
  
  /**
   * Center an image based on eye positions
   */
  centerImage(image: HTMLImageElement, eyePosition: EyePosition, targetResolution: Resolution): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    canvas.width = targetResolution.width;
    canvas.height = targetResolution.height;

    // Calculate eye center
    const eyeCenter = {
      x: (eyePosition.leftEye.x + eyePosition.rightEye.x) / 2,
      y: (eyePosition.leftEye.y + eyePosition.rightEye.y) / 2,
    };

    // Calculate the offset needed to center the eyes
    const targetCenter = {
      x: targetResolution.width / 2,
      y: targetResolution.height / 2,
    };

    const offset = {
      x: targetCenter.x - eyeCenter.x,
      y: targetCenter.y - eyeCenter.y,
    };

    // Calculate rotation angle to align eyes horizontally
    const eyeAngle = Math.atan2(
      eyePosition.rightEye.y - eyePosition.leftEye.y,
      eyePosition.rightEye.x - eyePosition.leftEye.x
    );

    // Apply transformations
    ctx.save();
    
    // Translate to center point
    ctx.translate(targetCenter.x, targetCenter.y);
    
    // Rotate to align eyes
    ctx.rotate(-eyeAngle);
    
    // Translate back and apply centering offset
    ctx.translate(-targetCenter.x + offset.x, -targetCenter.y + offset.y);
    
    // Draw the image
    ctx.drawImage(image, 0, 0);
    
    ctx.restore();

    return canvas;
  }

  /**
   * Crop canvas to fit target resolution while maintaining aspect ratio
   */
  cropToResolution(canvas: HTMLCanvasElement, targetResolution: Resolution): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    outputCanvas.width = targetResolution.width;
    outputCanvas.height = targetResolution.height;

    // Calculate scaling factor to fit the target resolution
    const scaleX = targetResolution.width / canvas.width;
    const scaleY = targetResolution.height / canvas.height;
    const scale = Math.max(scaleX, scaleY); // Use max to ensure full coverage

    // Calculate the scaled dimensions
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    // Calculate centering offsets
    const offsetX = (targetResolution.width - scaledWidth) / 2;
    const offsetY = (targetResolution.height - scaledHeight) / 2;

    // Draw the scaled and centered image
    ctx.drawImage(
      canvas,
      0, 0, canvas.width, canvas.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    return outputCanvas;
  }

  /**
   * Resize image to target resolution
   */
  resizeImage(image: HTMLImageElement, targetResolution: Resolution): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    canvas.width = targetResolution.width;
    canvas.height = targetResolution.height;

    // Use smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(image, 0, 0, targetResolution.width, targetResolution.height);

    return canvas;
  }

  /**
   * Calculate the offset needed to center eyes in target resolution
   */
  calculateCenterOffset(eyePosition: EyePosition, targetResolution: Resolution): CenterOffset {
    const eyeCenter = {
      x: (eyePosition.leftEye.x + eyePosition.rightEye.x) / 2,
      y: (eyePosition.leftEye.y + eyePosition.rightEye.y) / 2,
    };

    return {
      offsetX: targetResolution.width / 2 - eyeCenter.x,
      offsetY: targetResolution.height / 2 - eyeCenter.y,
    };
  }

  /**
   * Apply a zoom factor to the image while keeping eyes centered
   */
  zoomImage(
    image: HTMLImageElement,
    eyePosition: EyePosition,
    targetResolution: Resolution,
    zoomFactor: number = 1.0
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    canvas.width = targetResolution.width;
    canvas.height = targetResolution.height;

    // Calculate eye center
    const eyeCenter = {
      x: (eyePosition.leftEye.x + eyePosition.rightEye.x) / 2,
      y: (eyePosition.leftEye.y + eyePosition.rightEye.y) / 2,
    };

    // Calculate target center
    const targetCenter = {
      x: targetResolution.width / 2,
      y: targetResolution.height / 2,
    };

    // Apply transformations
    ctx.save();
    
    // Translate to target center
    ctx.translate(targetCenter.x, targetCenter.y);
    
    // Apply zoom
    ctx.scale(zoomFactor, zoomFactor);
    
    // Translate to center eyes at origin
    ctx.translate(-eyeCenter.x, -eyeCenter.y);
    
    // Draw the image
    ctx.drawImage(image, 0, 0);
    
    ctx.restore();

    return canvas;
  }

  /**
   * Apply brightness and contrast adjustments
   */
  adjustImageLighting(canvas: HTMLCanvasElement, brightness: number = 0, contrast: number = 0): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    // Draw the original image
    ctx.drawImage(canvas, 0, 0);

    // Apply brightness and contrast if needed
    if (brightness !== 0 || contrast !== 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast
        data[i] = contrastFactor * (data[i] - 128) + 128;     // Red
        data[i + 1] = contrastFactor * (data[i + 1] - 128) + 128; // Green
        data[i + 2] = contrastFactor * (data[i + 2] - 128) + 128; // Blue

        // Apply brightness
        data[i] = Math.min(255, Math.max(0, data[i] + brightness));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
      }

      ctx.putImageData(imageData, 0, 0);
    }

    return outputCanvas;
  }

  /**
   * Create a preview thumbnail
   */
  createThumbnail(canvas: HTMLCanvasElement, maxSize: number = 200): HTMLCanvasElement {
    const thumbnailCanvas = document.createElement('canvas');
    const ctx = thumbnailCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Calculate thumbnail dimensions maintaining aspect ratio
    const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    thumbnailCanvas.width = canvas.width * scale;
    thumbnailCanvas.height = canvas.height * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

    return thumbnailCanvas;
  }

  /**
   * Convert canvas to blob for download or further processing
   */
  async canvasToBlob(canvas: HTMLCanvasElement, mimeType: string = 'image/png', quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, mimeType, quality);
    });
  }

  /**
   * Load image from file
   */
  async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
