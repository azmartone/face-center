import React, { useEffect } from 'react';
import { ChakraProvider, Container, VStack, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { useAppStore } from './store/appStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ImageUpload } from './components/ImageUpload';
import { ImagePreview } from './components/ImagePreview';
import { VideoSettings } from './components/VideoSettings';
import { VideoPreview } from './components/VideoPreview';
import './App.css';

function App() {
  const {
    currentStep,
    isLoading,
    error,
    initializeServices,
    setError,
    processingProgress
  } = useAppStore();

  useEffect(() => {
    // Initialize services when the app starts
    initializeServices().catch((error) => {
      console.error('Failed to initialize app:', error);
    });
  }, [initializeServices]);

  const clearError = () => setError(null);

  return (
    <ChakraProvider>
      <ErrorBoundary>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8}>
            {/* Header */}
            <VStack spacing={2}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' }}>
                Face Center Video Creator
              </h1>
              <p style={{ textAlign: 'center', color: 'gray' }}>
                Upload portrait photos and create a video with faces perfectly centered
              </p>
            </VStack>

            {/* Error Display */}
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <VStack align="start" flex="1">
                  <AlertTitle>Error!</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </VStack>
                <button 
                  onClick={clearError}
                  style={{ 
                    marginLeft: 'auto', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    border: '1px solid #E53E3E',
                    background: 'transparent',
                    color: '#E53E3E',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </Alert>
            )}

            {/* Loading Spinner */}
            {isLoading && (
              <LoadingSpinner 
                message={processingProgress?.message || "Loading..."} 
              />
            )}

            {/* Progress Indicator */}
            {processingProgress && (
              <ProgressIndicator progress={processingProgress} />
            )}

            {/* Step-based UI */}
            {currentStep === 'upload' && <ImageUpload />}
            {currentStep === 'processing' && (
              <VStack spacing={4}>
                <h2>Processing Images...</h2>
                <p>Detecting faces and centering images</p>
              </VStack>
            )}
            {currentStep === 'preview' && (
              <VStack spacing={6} w="100%">
                <ImagePreview />
                <VideoSettings />
              </VStack>
            )}
            {currentStep === 'generating' && (
              <VStack spacing={4}>
                <h2>Generating Video...</h2>
                <p>Creating your face-centered video</p>
              </VStack>
            )}

            {/* Video Preview - Show when video is generated */}
            <VideoPreview />
          </VStack>
        </Container>
      </ErrorBoundary>
    </ChakraProvider>
  );
}

export default App;
