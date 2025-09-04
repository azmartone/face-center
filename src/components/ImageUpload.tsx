import React, { useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  SimpleGrid,
  Image,
  IconButton,
  useToast,
  Input,
  HStack,
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useImages, useProcessing, useAppState } from '../store/appStore';

export const ImageUpload: React.FC = () => {
  const { uploadedImages, addImages, removeImage, clearImages } = useImages();
  const { processImages } = useProcessing();
  const { setCurrentStep } = useAppState();
  const toast = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast({
        title: 'No valid images',
        description: 'Please select valid image files (JPG, PNG, etc.)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (imageFiles.length !== files.length) {
      toast({
        title: 'Some files ignored',
        description: 'Only image files were added',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }

    addImages(imageFiles);
    
    // Clear the input so the same files can be selected again if needed
    event.target.value = '';
  }, [addImages, toast]);

  const handleProcessImages = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: 'No images to process',
        description: 'Please upload some images first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    await processImages();
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  return (
    <VStack spacing={6} w="100%">
      <VStack spacing={2} textAlign="center">
        <Text fontSize="xl" fontWeight="semibold">
          Upload Portrait Images
        </Text>
        <Text color="gray.600">
          Upload multiple portrait photos of the same person to create a face-centered video
        </Text>
      </VStack>

      {/* Drag & Drop Area */}
      <Box
        w="100%"
        maxW="md"
        h="200px"
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        position="relative"
        overflow="hidden"
      >
        <Input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          position="absolute"
          inset={0}
          opacity={0}
          cursor="pointer"
        />
        <VStack spacing={2}>
          <AddIcon color="gray.400" boxSize={8} />
          <Text color="gray.600" textAlign="center">
            Drag & drop images here or click to select
          </Text>
          <Text fontSize="sm" color="gray.500">
            Supports JPG, PNG, and other image formats
          </Text>
        </VStack>
      </Box>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <VStack spacing={4} w="100%">
          <HStack justify="space-between" w="100%">
            <Text fontSize="lg" fontWeight="semibold">
              Uploaded Images ({uploadedImages.length})
            </Text>
            <Button size="sm" variant="outline" onClick={clearImages}>
              Clear All
            </Button>
          </HStack>

          <SimpleGrid columns={[2, 3, 4]} spacing={4} w="100%">
            {uploadedImages.map((file, index) => (
              <Box key={`${file.name}-${index}`} position="relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  borderRadius="md"
                  objectFit="cover"
                  w="100%"
                  h="150px"
                  border="1px solid"
                  borderColor="gray.200"
                />
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  colorScheme="red"
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                />
                <Text fontSize="xs" color="gray.500" mt={1} noOfLines={1}>
                  {file.name}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          {/* Process Button */}
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleProcessImages}
            w="200px"
          >
            Process Images
          </Button>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            This will detect faces and center them for video creation
          </Text>
        </VStack>
      )}
    </VStack>
  );
};
