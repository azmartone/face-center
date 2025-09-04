import React from 'react';
import { Box, Progress, Text, VStack } from '@chakra-ui/react';
import { ProcessingProgress } from '../types';

interface ProgressIndicatorProps {
  progress: ProcessingProgress;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  const percentage = (progress.current / progress.total) * 100;

  const getStageLabel = (stage: ProcessingProgress['stage']) => {
    switch (stage) {
      case 'detection':
        return 'Face Detection';
      case 'processing':
        return 'Image Processing';
      case 'centering':
        return 'Face Centering';
      case 'video_creation':
        return 'Video Creation';
      default:
        return 'Processing';
    }
  };

  return (
    <Box w="100%" maxW="md">
      <VStack spacing={3}>
        <Text fontSize="lg" fontWeight="semibold">
          {getStageLabel(progress.stage)}
        </Text>
        
        <Progress 
          value={percentage} 
          w="100%" 
          colorScheme="blue" 
          size="lg"
          borderRadius="md"
        />
        
        <Text fontSize="sm" color="gray.600" textAlign="center">
          {progress.message}
        </Text>
        
        <Text fontSize="sm" color="gray.500">
          {progress.current} of {progress.total} ({Math.round(percentage)}%)
        </Text>
      </VStack>
    </Box>
  );
};
