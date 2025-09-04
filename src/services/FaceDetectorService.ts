import * as faceapi from 'face-api.js';
import { FaceDetector, FaceDetection, EyePosition } from '../types';

const MODEL_URL = '/models';

// Face landmark indices for eyes (68-point model)
const LEFT_EYE_IDS = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE_IDS = [42, 43, 44, 45, 46, 47];

export class FaceDetectorService implements FaceDetector {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.mtcnn.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);
      
      this.isInitialized = true;
      console.log('Face detection models loaded successfully');
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      throw new Error('Failed to initialize face detection models');
    }
  }

  async detectFaces(image: HTMLImageElement): Promise<FaceDetection[]> {
    if (!this.isInitialized) {
      throw new Error('FaceDetector not initialized. Call initialize() first.');
    }

    try {
      const detections = await faceapi
        .detectAllFaces(image)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        throw new Error('No faces detected in the image');
      }

      return detections.map((detection) => {
        const box = detection.detection.box;
        const landmarks = detection.landmarks.positions;
        const eyePositions = this.getEyePositions(landmarks);

        return {
          box: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          landmarks: landmarks.map(point => ({ x: point.x, y: point.y })),
          eyePositions,
        };
      });
    } catch (error) {
      console.error('Face detection failed:', error);
      throw new Error(`Face detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getEyePositions(landmarks: Array<{ x: number; y: number }>): EyePosition {
    if (landmarks.length < 68) {
      throw new Error('Invalid landmarks data. Expected 68 points.');
    }

    // Calculate center of left eye
    const leftEyePoints = LEFT_EYE_IDS.map(id => landmarks[id]);
    const leftEye = this.calculateCenter(leftEyePoints);

    // Calculate center of right eye
    const rightEyePoints = RIGHT_EYE_IDS.map(id => landmarks[id]);
    const rightEye = this.calculateCenter(rightEyePoints);

    return {
      leftEye,
      rightEye,
    };
  }

  private calculateCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    const sum = points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  /**
   * Get the angle of inclination between the eyes for face rotation correction
   */
  getEyeAngle(eyePositions: EyePosition): number {
    const deltaX = eyePositions.rightEye.x - eyePositions.leftEye.x;
    const deltaY = eyePositions.rightEye.y - eyePositions.leftEye.y;
    return Math.atan2(deltaY, deltaX);
  }

  /**
   * Get the center point between the eyes
   */
  getEyeCenter(eyePositions: EyePosition): { x: number; y: number } {
    return {
      x: (eyePositions.leftEye.x + eyePositions.rightEye.x) / 2,
      y: (eyePositions.leftEye.y + eyePositions.rightEye.y) / 2,
    };
  }

  /**
   * Validate if the detected face is suitable for processing
   */
  validateFaceDetection(detection: FaceDetection): boolean {
    // Check if face is large enough
    const minFaceSize = 100; // minimum face width/height in pixels
    if (detection.box.width < minFaceSize || detection.box.height < minFaceSize) {
      return false;
    }

    // Check if eyes are detected properly
    const eyeDistance = Math.sqrt(
      Math.pow(detection.eyePositions.rightEye.x - detection.eyePositions.leftEye.x, 2) +
      Math.pow(detection.eyePositions.rightEye.y - detection.eyePositions.leftEye.y, 2)
    );

    // Eyes should be at least 30 pixels apart
    return eyeDistance > 30;
  }

  /**
   * Select the best face from multiple detections
   * Prioritizes by face size and confidence
   */
  selectBestFace(detections: FaceDetection[]): FaceDetection {
    if (detections.length === 0) {
      throw new Error('No face detections provided');
    }

    if (detections.length === 1) {
      return detections[0];
    }

    // Sort by face area (larger faces are likely better)
    return detections.sort((a, b) => {
      const areaA = a.box.width * a.box.height;
      const areaB = b.box.width * b.box.height;
      return areaB - areaA;
    })[0];
  }
}
