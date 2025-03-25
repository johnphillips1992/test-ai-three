import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface UseFaceDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFocusLevelChange?: (focusLevel: number) => void;
  detectionInterval?: number;
  modelPath?: string;
}

interface UseFaceDetectionReturn {
  isModelLoading: boolean;
  isCameraReady: boolean;
  focusLevel: number;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  error: string | null;
}

/**
 * Custom hook for face detection and focus level estimation
 */
export const useFaceDetection = ({
  videoRef,
  onFocusLevelChange,
  detectionInterval = 1000,
  modelPath = '/models'
}: UseFaceDetectionOptions): UseFaceDetectionReturn => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [focusLevel, setFocusLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsModelLoading(true);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
        ]);
        
        setIsModelLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load face detection models';
        setError(errorMessage);
        setIsModelLoading(false);
      }
    };
    
    loadModels();
    
    // Clean up
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelPath]);

  // Initialize webcam stream
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsCameraReady(true);
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
    }
  }, [videoRef]);

  // Start face detection process
  const startDetection = useCallback(async () => {
    if (isModelLoading) return;
    
    if (!isCameraReady) {
      await startCamera();
    }
    
    if (!videoRef.current) return;
    
    // Clear existing interval if any
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
    }
    
    // Set up detection interval
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      
      try {
        // Detect faces and expressions
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        
        if (detections.length > 0) {
          // Calculate focus level based on facial expressions
          // Higher neutral, happy, and surprised indicate higher focus
          // Higher sad, angry, disgusted, and fearful indicate lower focus
          const expressions = detections[0].expressions;
          
          const focusFactors = {
            neutral: 0.6,
            happy: 0.3,
            surprised: 0.1
          };
          
          const distractionFactors = {
            sad: 0.3,
            angry: 0.3,
            disgusted: 0.2,
            fearful: 0.2
          };
          
          let newFocusLevel = 
            (expressions.neutral * focusFactors.neutral) +
            (expressions.happy * focusFactors.happy) +
            (expressions.surprised * focusFactors.surprised);
          
          const distractionLevel = 
            (expressions.sad * distractionFactors.sad) +
            (expressions.angry * distractionFactors.angry) +
            (expressions.disgusted * distractionFactors.disgusted) +
            (expressions.fearful * distractionFactors.fearful);
          
          // Calculate final focus level (0-1)
          newFocusLevel = Math.max(0, Math.min(1, newFocusLevel - distractionLevel));
          
          // Apply smoothing to avoid abrupt changes
          const smoothingFactor = 0.7;
          const smoothedFocusLevel = 
            (focusLevel * smoothingFactor) + (newFocusLevel * (1 - smoothingFactor));
          
          setFocusLevel(smoothedFocusLevel);
          
          if (onFocusLevelChange) {
            onFocusLevelChange(smoothedFocusLevel);
          }
        }
      } catch (err) {
        console.error('Error detecting faces:', err);
      }
    }, detectionInterval);
  }, [
    isModelLoading, 
    isCameraReady, 
    videoRef, 
    detectionInterval, 
    startCamera, 
    focusLevel, 
    onFocusLevelChange
  ]);

  // Stop detection and camera
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraReady(false);
    }
  }, []);

  return {
    isModelLoading,
    isCameraReady,
    focusLevel,
    startDetection,
    stopDetection,
    error
  };
};