import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useAuth } from '../contexts/AuthContext';
import './FocusDetector.css';

interface FocusDetectorProps {
  onFocusChange: (focusLevel: number) => void;
}

const FocusDetector: React.FC<FocusDetectorProps> = ({ onFocusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Load the face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Models should be in the public folder
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setIsInitialized(true);
        console.log('Face-API models loaded successfully');
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load facial recognition models. Please refresh the page.');
      }
    };

    loadModels();

    // Clean up on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Start video stream when initialized
  useEffect(() => {
    if (isInitialized && !isDetecting) {
      startVideo();
    }
  }, [isInitialized, isDetecting]);

  // Start the webcam video stream
  const startVideo = async () => {
    try {
      if (videoRef.current) {
        // Stop any existing stream
        if (videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }

        // Get new stream with current facing mode
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        
        videoRef.current.srcObject = stream;
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please check your camera permissions.');
    }
  };

  // Toggle camera facing mode (front/back)
  const toggleCameraFacing = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };

  // Initialize face detection when video starts playing
  const handleVideoPlay = () => {
    if (!isDetecting && isInitialized) {
      setIsDetecting(true);
      detectFace();
    }
  };

  // Detect faces and expressions in video feed
  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    const detectionInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) {
        clearInterval(detectionInterval);
        return;
      }

      try {
        // Detect face with expressions
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        // Clear the canvas for new drawings
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Resize detections to match display size
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Calculate focus level based on facial expressions
        let focusLevel = 0;
        if (resizedDetections.length > 0) {
          const expressions = resizedDetections[0].expressions;
          // Higher focus is based on neutral and concentrated expressions
          // Lower focus is influenced by surprised, angry, or happy expressions
          focusLevel = expressions.neutral * 0.8 + 
                       (1 - expressions.surprised) * 0.1 +
                       (1 - expressions.angry) * 0.05 +
                       (1 - expressions.happy) * 0.05;
          
          // Cap focus level between 0 and 1
          focusLevel = Math.min(1, Math.max(0, focusLevel));
          
          // Send the focus level to parent component
          onFocusChange(focusLevel);
        }

        // Draw the detections on the canvas for visual feedback
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      } catch (err) {
        console.error('Error during face detection:', err);
      }
    }, 100); // Update every 100ms

    // Clean up the interval when component unmounts
    return () => clearInterval(detectionInterval);
  };

  return (
    <div className="focus-detector">
      {error && <div className="error-message">{error}</div>}
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoPlay}
          width={640}
          height={480}
        />
        <canvas ref={canvasRef} className="face-canvas" />
        <div className="video-controls">
          <button onClick={toggleCameraFacing} className="camera-toggle">
            Switch Camera
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusDetector;