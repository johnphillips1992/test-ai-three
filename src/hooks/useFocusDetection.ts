import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

// Load the face-api.js models
const loadModels = async () => {
  const MODEL_URL = '/models';
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
};

interface UseFocusDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  interval?: number;
  enabled?: boolean;
}

export const useFocusDetection = ({ 
  videoRef, 
  interval = 1000, 
  enabled = true 
}: UseFocusDetectionProps) => {
  const [focusLevel, setFocusLevel] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  // Load models on component mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeModels = async () => {
      try {
        const loaded = await loadModels();
        if (isMounted) {
          setModelsLoaded(loaded);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      }
    };
    
    initializeModels();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Start/stop detection based on enabled prop
  useEffect(() => {
    if (modelsLoaded && enabled && videoRef.current) {
      startDetection();
    } else {
      stopDetection();
    }
    
    return () => {
      stopDetection();
    };
  }, [modelsLoaded, enabled, videoRef]);

  const analyzeExpression = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    
    try {
      setIsAnalyzing(true);
      
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections) {
        // Calculate focus level based on expressions
        // Higher neutral, happy expressions indicate focus
        // Higher surprised, angry, sad expressions indicate distraction
        const { neutral, happy, surprised, angry, sad, fearful, disgusted } = detections.expressions;
        
        // Weighted calculation of focus
        const focus = (neutral * 0.6) + (happy * 0.4) - (surprised * 0.2) - (angry * 0.2) - (sad * 0.2) - (fearful * 0.2) - (disgusted * 0.2);
        
        // Normalize to 0-100 range
        const normalizedFocus = Math.max(0, Math.min(100, focus * 100));
        
        setFocusLevel(normalizedFocus);
      } else {
        // No face detected, assume neutral focus
        setFocusLevel(50);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startDetection = () => {
    if (detectionIntervalRef.current) return;
    
    analyzeExpression();
    detectionIntervalRef.current = window.setInterval(() => {
      analyzeExpression();
    }, interval);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  return {
    focusLevel,
    isAnalyzing,
    modelsLoaded,
    error,
    startDetection,
    stopDetection
  };
};