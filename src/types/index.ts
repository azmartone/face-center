// Core interfaces and types for the Face Center application

export interface EyePosition {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
}

export interface Resolution {
  width: number;
  height: number;
}

export interface CenterOffset {
  offsetX: number;
  offsetY: number;
}

export interface FaceDetection {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: Array<{ x: number; y: number }>;
  eyePositions: EyePosition;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  originalImage: HTMLImageElement;
  faceDetection: FaceDetection;
  centerOffset: CenterOffset;
}

export enum TransitionType {
  HARD_CUT = 'hard_cut',
  OPACITY_FADE = 'opacity_fade',
  MORPHING = 'morphing'
}

export interface VideoOptions {
  resolution: Resolution;
  frameRate: number;
  duration: number;
  transitionType: TransitionType;
  transitionDuration: number; // in frames
}

export interface VideoFrame {
  canvas: HTMLCanvasElement;
  timestamp: number;
}

// Service interfaces
export interface FaceDetector {
  initialize(): Promise<void>;
  detectFaces(image: HTMLImageElement): Promise<FaceDetection[]>;
  getEyePositions(landmarks: Array<{ x: number; y: number }>): EyePosition;
}

export interface ImageProcessor {
  centerImage(image: HTMLImageElement, eyePosition: EyePosition, targetResolution: Resolution): HTMLCanvasElement;
  cropToResolution(canvas: HTMLCanvasElement, targetResolution: Resolution): HTMLCanvasElement;
  resizeImage(image: HTMLImageElement, targetResolution: Resolution): HTMLCanvasElement;
}

export interface VideoCreator {
  initialize(): Promise<void>;
  createVideo(frames: VideoFrame[], options: VideoOptions): Promise<Blob>;
  createVideoFromImages(images: ProcessedImage[], options: VideoOptions): Promise<Blob>;
}

export interface TransitionEngine {
  createTransition(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    type: TransitionType,
    steps: number
  ): HTMLCanvasElement[];
  hardCut(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement): HTMLCanvasElement[];
  opacityFade(frame1: HTMLCanvasElement, frame2: HTMLCanvasElement, steps: number): HTMLCanvasElement[];
  morphFrames(
    frame1: HTMLCanvasElement,
    frame2: HTMLCanvasElement,
    landmarks1: Array<{ x: number; y: number }>,
    landmarks2: Array<{ x: number; y: number }>,
    steps: number
  ): HTMLCanvasElement[];
}

// Main app interface
export interface FaceCenterApp {
  faceDetector: FaceDetector;
  imageProcessor: ImageProcessor;
  videoCreator: VideoCreator;
  transitionEngine: TransitionEngine;
}

// State management types
export interface AppState {
  // UI State
  isLoading: boolean;
  currentStep: 'upload' | 'processing' | 'preview' | 'generating';
  error: string | null;
  
  // Image data
  uploadedImages: File[];
  processedImages: ProcessedImage[];
  
  // Video settings
  videoOptions: VideoOptions;
  
  // Generated video
  generatedVideo: Blob | null;
  videoPreviewUrl: string | null;
}

export interface AppActions {
  // UI actions
  setLoading: (loading: boolean) => void;
  setCurrentStep: (step: AppState['currentStep']) => void;
  setError: (error: string | null) => void;
  
  // Image actions
  addImages: (images: File[]) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  setProcessedImages: (images: ProcessedImage[]) => void;
  
  // Video settings
  updateVideoOptions: (options: Partial<VideoOptions>) => void;
  
  // Video generation
  setGeneratedVideo: (video: Blob | null) => void;
  setVideoPreviewUrl: (url: string | null) => void;
  
  // Processing actions
  processImages: () => Promise<void>;
  generateVideo: () => Promise<void>;
}

// Utility types
export type Landmark = { x: number; y: number };

export interface ProcessingProgress {
  current: number;
  total: number;
  stage: 'detection' | 'processing' | 'centering' | 'video_creation';
  message: string;
}
