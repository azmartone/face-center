import { TransitionEngine, TransitionType, Landmark } from '../types';

export class TransitionEngineService implements TransitionEngine {

  createTransition(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    type: TransitionType,
    steps: number = 10
  ): HTMLCanvasElement[] {
    switch (type) {
      case TransitionType.HARD_CUT:
        return this.hardCut(frame1, frame2);
      case TransitionType.OPACITY_FADE:
        return this.opacityFade(frame1, frame2, steps);
      case TransitionType.MORPHING:
        // For morphing, we need landmarks which aren't provided here
        // Fall back to opacity fade
        console.warn('Morphing transition requires landmarks, falling back to opacity fade');
        return this.opacityFade(frame1, frame2, steps);
      default:
        return this.hardCut(frame1, frame2);
    }
  }

  hardCut(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement): HTMLCanvasElement[] {
    return [frame1, frame2];
  }

  opacityFade(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement, steps: number = 10): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    // Add the first frame
    frames.push(frame1);

    // Create transition frames
    for (let i = 1; i < steps; i++) {
      const alpha = i / steps;
      const blendedFrame = this.blendFrames(frame1, frame2, alpha);
      frames.push(blendedFrame);
    }

    // Add the last frame
    frames.push(frame2);

    return frames;
  }

  morphFrames(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    landmarks1: Landmark[],
    landmarks2: Landmark[],
    steps: number = 10
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    // Add the first frame
    frames.push(frame1);

    // Create morphed frames
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const morphedFrame = this.createMorphedFrame(frame1, frame2, landmarks1, landmarks2, t);
      frames.push(morphedFrame);
    }

    // Add the last frame
    frames.push(frame2);

    return frames;
  }

  /**
   * Blend two frames with specified alpha
   */
  private blendFrames(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement, alpha: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    canvas.width = Math.max(frame1.width, frame2.width);
    canvas.height = Math.max(frame1.height, frame2.height);

    // Draw first frame
    ctx.globalAlpha = 1 - alpha;
    ctx.drawImage(frame1, 0, 0);

    // Draw second frame with alpha blending
    ctx.globalAlpha = alpha;
    ctx.drawImage(frame2, 0, 0);

    // Reset alpha
    ctx.globalAlpha = 1;

    return canvas;
  }

  /**
   * Create a morphed frame between two images using facial landmarks
   */
  private createMorphedFrame(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    landmarks1: Landmark[],
    landmarks2: Landmark[],
    t: number
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }

    canvas.width = Math.max(frame1.width, frame2.width);
    canvas.height = Math.max(frame1.height, frame2.height);

    // For now, implement a simple blend with landmark-based warping
    // This is a simplified version - a full implementation would use Delaunay triangulation
    
    // Interpolate landmarks
    const interpolatedLandmarks = landmarks1.map((landmark1, index) => {
      const landmark2 = landmarks2[index];
      return {
        x: landmark1.x + (landmark2.x - landmark1.x) * t,
        y: landmark1.y + (landmark2.y - landmark1.y) * t,
      };
    });

    // For simplicity, we'll blend the images and apply a simple transformation
    // A full morphing implementation would require triangle warping
    
    // Blend the frames
    ctx.globalAlpha = 1 - t;
    ctx.drawImage(frame1, 0, 0);
    
    ctx.globalAlpha = t;
    ctx.drawImage(frame2, 0, 0);
    
    ctx.globalAlpha = 1;

    return canvas;
  }

  /**
   * Create a slide transition (left to right)
   */
  slideTransition(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    steps: number = 10,
    direction: 'left' | 'right' | 'up' | 'down' = 'left'
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      canvas.width = frame1.width;
      canvas.height = frame1.height;

      const progress = i / steps;
      
      let offset1X = 0, offset1Y = 0, offset2X = 0, offset2Y = 0;

      switch (direction) {
        case 'left':
          offset1X = -progress * canvas.width;
          offset2X = canvas.width - progress * canvas.width;
          break;
        case 'right':
          offset1X = progress * canvas.width;
          offset2X = -canvas.width + progress * canvas.width;
          break;
        case 'up':
          offset1Y = -progress * canvas.height;
          offset2Y = canvas.height - progress * canvas.height;
          break;
        case 'down':
          offset1Y = progress * canvas.height;
          offset2Y = -canvas.height + progress * canvas.height;
          break;
      }

      // Draw frames with offsets
      ctx.drawImage(frame1, offset1X, offset1Y);
      ctx.drawImage(frame2, offset2X, offset2Y);

      frames.push(canvas);
    }

    return frames;
  }

  /**
   * Create a zoom transition
   */
  zoomTransition(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    steps: number = 10,
    zoomOut: boolean = true
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      canvas.width = frame1.width;
      canvas.height = frame1.height;

      const progress = i / steps;
      const scale1 = zoomOut ? 1 - progress : 1 + progress;
      const scale2 = zoomOut ? progress : 1 - progress;
      const alpha1 = 1 - progress;
      const alpha2 = progress;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw first frame (scaled)
      ctx.save();
      ctx.globalAlpha = alpha1;
      ctx.translate(centerX, centerY);
      ctx.scale(scale1, scale1);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(frame1, 0, 0);
      ctx.restore();

      // Draw second frame (scaled)
      ctx.save();
      ctx.globalAlpha = alpha2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale2, scale2);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(frame2, 0, 0);
      ctx.restore();

      frames.push(canvas);
    }

    return frames;
  }

  /**
   * Create a rotation transition
   */
  rotateTransition(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    steps: number = 10,
    angle: number = Math.PI * 2 // Full rotation by default
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas 2D context');
      }

      canvas.width = frame1.width;
      canvas.height = frame1.height;

      const progress = i / steps;
      const currentAngle = angle * progress;
      const alpha1 = Math.cos(currentAngle / 2) ** 2;
      const alpha2 = Math.sin(currentAngle / 2) ** 2;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw first frame
      ctx.save();
      ctx.globalAlpha = alpha1;
      ctx.translate(centerX, centerY);
      ctx.rotate(-currentAngle / 2);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(frame1, 0, 0);
      ctx.restore();

      // Draw second frame
      ctx.save();
      ctx.globalAlpha = alpha2;
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle / 2);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(frame2, 0, 0);
      ctx.restore();

      frames.push(canvas);
    }

    return frames;
  }

  /**
   * Create a cross-dissolve transition with custom easing
   */
  crossDissolve(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    steps: number = 10,
    easingFunction: (t: number) => number = (t) => t // Linear by default
  ): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easedT = easingFunction(t);
      const blendedFrame = this.blendFrames(frame1, frame2, easedT);
      frames.push(blendedFrame);
    }

    return frames;
  }

  /**
   * Easing functions for smooth transitions
   */
  static easingFunctions = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  };
}
