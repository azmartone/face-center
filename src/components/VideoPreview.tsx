import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
import { useVideoGeneration, useAppState } from '../store/appStore';

export const VideoPreview: React.FC = () => {
  const { generatedVideo, videoPreviewUrl, generateVideo } = useVideoGeneration();
  const { setCurrentStep } = useAppState();
  const toast = useToast();

  const handleDownload = () => {
    if (!generatedVideo) return;

    const url = URL.createObjectURL(generatedVideo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `face-centered-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download started',
      description: 'Your video is being downloaded',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRegenerateVideo = async () => {
    await generateVideo();
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
  };

  if (!generatedVideo || !videoPreviewUrl) {
    return null;
  }

  return (
    <Box w="100%" maxW="2xl" mx="auto">
      <VStack spacing={6}>
        <VStack spacing={2} textAlign="center">
          <Text fontSize="xl" fontWeight="semibold">
            Your Video is Ready! 🎉
          </Text>
          <Text color="gray.600">
            Preview your face-centered video below and download when ready
          </Text>
        </VStack>

        {/* Video Player */}
        <Box
          borderWidth={2}
          borderRadius="lg"
          borderColor="green.200"
          p={4}
          bg="green.50"
          w="100%"
        >
          <video
            src={videoPreviewUrl}
            controls
            loop
            style={{
              width: '100%',
              maxHeight: '500px',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
          />
        </Box>

        {/* Action Buttons */}
        <HStack spacing={4} justify="center">
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="green"
            size="lg"
            onClick={handleDownload}
          >
            Download Video
          </Button>

          <Button
            leftIcon={<RepeatIcon />}
            variant="outline"
            size="lg"
            onClick={handleRegenerateVideo}
          >
            Regenerate
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </HStack>

        {/* Video Info */}
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.500">
            Video format: MP4 • Ready for social media sharing
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
