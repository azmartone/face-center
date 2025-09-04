import React, { useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  HStack,
  Button,
  Badge,
} from '@chakra-ui/react';
import { useImages, useAppState } from '../store/appStore';

export const ImagePreview: React.FC = () => {
  const { processedImages, uploadedImages, clearImages } = useImages();
  const { setCurrentStep } = useAppState();
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    // Render processed images to canvas elements
    processedImages.forEach((processedImage, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas && processedImage.canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = processedImage.canvas.width;
          canvas.height = processedImage.canvas.height;
          ctx.drawImage(processedImage.canvas, 0, 0);
        }
      }
    });
  }, [processedImages]);

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  if (processedImages.length === 0) {
    return null;
  }

  return (
    <VStack spacing={6} w="100%">
      <VStack spacing={2} textAlign="center">
        <Text fontSize="xl" fontWeight="semibold">
          Processed Images Preview
        </Text>
        <Text color="gray.600">
          Faces have been detected and centered. Review the results below.
        </Text>
      </VStack>

      <HStack justify="space-between" w="100%">
        <Text fontSize="lg" fontWeight="semibold">
          {processedImages.length} Images Processed
        </Text>
        <HStack spacing={2}>
          <Button variant="outline" onClick={handleBackToUpload}>
            Add More Images
          </Button>
          <Button variant="outline" onClick={clearImages}>
            Start Over
          </Button>
        </HStack>
      </HStack>

      <SimpleGrid columns={[1, 2, 3]} spacing={6} w="100%">
        {processedImages.map((processedImage, index) => (
          <Box key={index} borderWidth={1} borderRadius="lg" p={4}>
            <VStack spacing={3}>
              {/* Original Image */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Original
                </Text>
                <img
                  src={processedImage.originalImage.src}
                  alt={`Original ${index + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0'
                  }}
                />
              </Box>

              {/* Processed Image */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Face Centered
                </Text>
                <canvas
                  ref={(el) => (canvasRefs.current[index] = el)}
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0'
                  }}
                />
              </Box>

              {/* Face Detection Info */}
              <VStack spacing={1} align="start" w="100%">
                <HStack justify="space-between" w="100%">
                  <Text fontSize="xs" color="gray.500">
                    Face Size:
                  </Text>
                  <Text fontSize="xs">
                    {Math.round(processedImage.faceDetection.box.width)} × {Math.round(processedImage.faceDetection.box.height)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" w="100%">
                  <Text fontSize="xs" color="gray.500">
                    Center Offset:
                  </Text>
                  <Text fontSize="xs">
                    ({Math.round(processedImage.centerOffset.offsetX)}, {Math.round(processedImage.centerOffset.offsetY)})
                  </Text>
                </HStack>

                <Badge colorScheme="green" size="sm">
                  Face Detected ✓
                </Badge>
              </VStack>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

      <Box textAlign="center">
        <Text fontSize="sm" color="gray.600">
          All images have been processed and are ready for video creation.
          Configure your video settings below.
        </Text>
      </Box>
    </VStack>
  );
};
