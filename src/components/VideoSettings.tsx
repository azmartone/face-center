import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Divider,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { useVideoGeneration, useProcessing, useImages } from '../store/appStore';
import { TransitionType } from '../types';

export const VideoSettings: React.FC = () => {
  const { videoOptions, updateVideoOptions, generateVideo } = useVideoGeneration();
  const { isLoading } = useProcessing();
  const { processedImages } = useImages();
  const toast = useToast();

  const handleGenerateVideo = async () => {
    if (processedImages.length === 0) {
      toast({
        title: 'No images to process',
        description: 'Please process some images first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await generateVideo();
  };

  const presetResolutions = [
    { label: 'Square (1080×1080)', width: 1080, height: 1080 },
    { label: 'Square (720×720)', width: 720, height: 720 },
    { label: 'HD (1920×1080)', width: 1920, height: 1080 },
    { label: 'HD (1280×720)', width: 1280, height: 720 },
    { label: 'Portrait (1080×1920)', width: 1080, height: 1920 },
    { label: 'Portrait (720×1280)', width: 720, height: 1280 },
  ];

  const transitionOptions = [
    { value: TransitionType.HARD_CUT, label: 'Hard Cut (No Transition)' },
    { value: TransitionType.OPACITY_FADE, label: 'Fade Transition' },
    { value: TransitionType.MORPHING, label: 'Morphing (Experimental)' },
  ];

  return (
    <Box w="100%" maxW="2xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} textAlign="center">
          <Text fontSize="xl" fontWeight="semibold">
            Video Settings
          </Text>
          <Text color="gray.600">
            Configure your video output settings
          </Text>
        </VStack>

        <Box borderWidth={1} borderRadius="lg" p={6}>
          <VStack spacing={6} align="stretch">
            
            {/* Resolution Settings */}
            <FormControl>
              <FormLabel fontWeight="semibold">Resolution</FormLabel>
              <VStack spacing={3} align="stretch">
                <Select
                  value={`${videoOptions.resolution.width}x${videoOptions.resolution.height}`}
                  onChange={(e) => {
                    const [width, height] = e.target.value.split('x').map(Number);
                    updateVideoOptions({ resolution: { width, height } });
                  }}
                >
                  {presetResolutions.map((preset) => (
                    <option 
                      key={`${preset.width}x${preset.height}`}
                      value={`${preset.width}x${preset.height}`}
                    >
                      {preset.label}
                    </option>
                  ))}
                </Select>

                <HStack>
                  <NumberInput
                    value={videoOptions.resolution.width}
                    min={240}
                    max={4096}
                    onChange={(_, value) => 
                      updateVideoOptions({ 
                        resolution: { ...videoOptions.resolution, width: value } 
                      })
                    }
                  >
                    <NumberInputField placeholder="Width" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>

                  <Text>×</Text>

                  <NumberInput
                    value={videoOptions.resolution.height}
                    min={240}
                    max={4096}
                    onChange={(_, value) => 
                      updateVideoOptions({ 
                        resolution: { ...videoOptions.resolution, height: value } 
                      })
                    }
                  >
                    <NumberInputField placeholder="Height" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </HStack>
              </VStack>
            </FormControl>

            <Divider />

            {/* Frame Rate */}
            <FormControl>
              <FormLabel fontWeight="semibold">Frame Rate: {videoOptions.frameRate} FPS</FormLabel>
              <Slider
                value={videoOptions.frameRate}
                min={15}
                max={60}
                step={5}
                onChange={(value) => updateVideoOptions({ frameRate: value })}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <HStack justify="space-between" mt={1}>
                <Text fontSize="sm" color="gray.500">15 FPS</Text>
                <Text fontSize="sm" color="gray.500">60 FPS</Text>
              </HStack>
            </FormControl>

            {/* Duration */}
            <FormControl>
              <FormLabel fontWeight="semibold">Total Duration: {videoOptions.duration} seconds</FormLabel>
              <Slider
                value={videoOptions.duration}
                min={1}
                max={30}
                step={0.5}
                onChange={(value) => updateVideoOptions({ duration: value })}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <HStack justify="space-between" mt={1}>
                <Text fontSize="sm" color="gray.500">1s</Text>
                <Text fontSize="sm" color="gray.500">30s</Text>
              </HStack>
            </FormControl>

            <Divider />

            {/* Transition Settings */}
            <FormControl>
              <FormLabel fontWeight="semibold">Transition Type</FormLabel>
              <Select
                value={videoOptions.transitionType}
                onChange={(e) => 
                  updateVideoOptions({ transitionType: e.target.value as TransitionType })
                }
              >
                {transitionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {videoOptions.transitionType !== TransitionType.HARD_CUT && (
              <FormControl>
                <FormLabel fontWeight="semibold">
                  Transition Duration: {videoOptions.transitionDuration} frames
                </FormLabel>
                <Slider
                  value={videoOptions.transitionDuration}
                  min={5}
                  max={30}
                  step={1}
                  onChange={(value) => updateVideoOptions({ transitionDuration: value })}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                <HStack justify="space-between" mt={1}>
                  <Text fontSize="sm" color="gray.500">5 frames</Text>
                  <Text fontSize="sm" color="gray.500">30 frames</Text>
                </HStack>
              </FormControl>
            )}

            <Divider />

            {/* Video Info */}
            <VStack spacing={2} align="stretch">
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Video Information:
              </Text>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Images:</Text>
                <Badge colorScheme="blue">{processedImages.length}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Time per image:</Text>
                <Text fontSize="sm">{(videoOptions.duration / processedImages.length).toFixed(1)}s</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Estimated file size:</Text>
                <Text fontSize="sm">
                  ~{Math.round((videoOptions.resolution.width * videoOptions.resolution.height * videoOptions.duration * videoOptions.frameRate) / 1000000)}MB
                </Text>
              </HStack>
            </VStack>

            {/* Generate Button */}
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleGenerateVideo}
              isLoading={isLoading}
              loadingText="Generating Video..."
              w="100%"
            >
              Generate Video
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};
