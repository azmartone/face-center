// Import service classes
import { FaceDetectorService } from './FaceDetectorService';
import { ImageProcessorService } from './ImageProcessorService';
import { VideoCreatorService } from './VideoCreatorService';
import { TransitionEngineService } from './TransitionEngineService';

// Service exports for easy importing
export { FaceDetectorService } from './FaceDetectorService';
export { ImageProcessorService } from './ImageProcessorService';
export { VideoCreatorService } from './VideoCreatorService';
export { TransitionEngineService } from './TransitionEngineService';

// Service instances (singleton pattern)
export const faceDetectorService = new FaceDetectorService();
export const imageProcessorService = new ImageProcessorService();
export const videoCreatorService = new VideoCreatorService();
export const transitionEngineService = new TransitionEngineService();
