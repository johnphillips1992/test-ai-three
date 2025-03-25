import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useUser } from '../contexts/UserContext';
import MusicPlayer from '../components/music/MusicPlayer';
import FocusLevelIndicator from '../components/focus/FocusLevelIndicator';
import CameraFeed from '../components/focus/CameraFeed';
import SpotifyService from '../services/SpotifyService';

import '../styles/FocusDetection.css';

const FocusDetection: React.FC = () => {
  const { user } = useUser();
  const [focusLevel, setFocusLevel] = useState<number>(0);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [musicRecommendation, setMusicRecommendation] = useState<any>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionInterval = useRef<number | null>(null);

  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log('Face API models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setDetectionError('Failed to load facial detection models. Please refresh and try again.');
      }
    };

    loadModels();

    // Fetch user preferences
    const fetchUserPreferences = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserPreferences(userDoc.data().preferences || {});
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      }
    };

    fetchUserPreferences();

    // Clean up on component unmount
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      
      // Stop webcam if active
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  // Start face detection
  const startDetection = async () => {
    if (!videoRef.current) return;
    
    try {
      // Access webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      
      setIsDetecting(true);
      setDetectionError(null);
      
      // Start detection loop
      detectionInterval.current = window.setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();
          
          // Calculate focus level from face expressions
          let newFocusLevel = 0;
          
          if (detections.length > 0) {
            // Average the neutral and focused expressions across all faces
            const neutral = detections.reduce((sum, detection) => 
              sum + detection.expressions.neutral, 0) / detections.length;
            
            // Implement custom focus level algorithm
            newFocusLevel = calculateFocusLevel(detections);
            
            // Update focus level state
            setFocusLevel(newFocusLevel);
            
            // Get music recommendations based on focus level
            getMusicRecommendation(newFocusLevel);
            
            // Draw detection results on canvas if needed
            if (canvasRef.current) {
              const displaySize = { 
                width: videoRef.current.width, 
                height: videoRef.current.height 
              };
              
              faceapi.matchDimensions(canvasRef.current, displaySize);
              
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              
              canvasRef.current.getContext('2d')?.clearRect(
                0, 0, canvasRef.current.width, canvasRef.current.height
              );
              
              faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
              faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
            }
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error starting detection:', error);
      setDetectionError('Failed to access webcam. Please make sure it is connected and permissions are granted.');
      setIsDetecting(false);
    }
  };

  // Stop face detection
  const stopDetection = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsDetecting(false);
  };

  // Calculate focus level based on facial expressions
  const calculateFocusLevel = (detections: any[]): number => {
    if (detections.length === 0) return 0;
    
    // Compute average of relevant expressions
    const avgNeutral = detections.reduce((sum, d) => sum + d.expressions.neutral, 0) / detections.length;
    const avgHappy = detections.reduce((sum, d) => sum + d.expressions.happy, 0) / detections.length;
    const avgSurprised = detections.reduce((sum, d) => sum + d.expressions.surprised, 0) / detections.length;
    const avgAngry = detections.reduce((sum, d) => sum + d.expressions.angry, 0) / detections.length;
    const avgSad = detections.reduce((sum, d) => sum + d.expressions.sad, 0) / detections.length;
    
    // Focus is higher when neutral and happy, lower when surprised, angry or sad
    const focusScore = (avgNeutral * 0.6) + (avgHappy * 0.4) - (avgSurprised * 0.3) - (avgAngry * 0.4) - (avgSad * 0.3);
    
    // Ensure the result is between 0 and 1
    return Math.max(0, Math.min(1, focusScore));
  };

  // Get music recommendation based on focus level
  const getMusicRecommendation = async (level: number) => {
    try {
      // Different music parameters based on focus level
      const params = level < 0.5 
        ? { 
            energy: 0.2, 
            tempo: 70, 
            valence: 0.3, 
            limit: 1, 
            genre: userPreferences?.calmGenre || 'ambient' 
          }
        : { 
            energy: 0.8, 
            tempo: 120, 
            valence: 0.7, 
            limit: 1, 
            genre: userPreferences?.focusedGenre || 'electronic' 
          };
      
      const recommendation = await SpotifyService.getRecommendations(params);
      
      if (recommendation && recommendation.tracks) {
        setMusicRecommendation(recommendation.tracks[0]);
      }
    } catch (error) {
      console.error('Error getting music recommendation:', error);
    }
  };

  // Save focus session data
  const saveFocusSession = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const sessions = userDoc.data().focusSessions || [];
        
        // Add new session data
        await updateDoc(userDocRef, {
          focusSessions: [
            ...sessions,
            {
              timestamp: new Date(),
              duration: detectionInterval.current ? 
                Math.floor((Date.now() - (sessions.startTime || Date.now())) / 1000) : 0,
              averageFocusLevel: focusLevel,
              music: musicRecommendation ? musicRecommendation.name : 'None'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  };

  return (
    <div className="focus-detection">
      <h1>Focus Detection</h1>
      
      <div className="detection-controls">
        {!isDetecting ? (
          <button onClick={startDetection} className="btn btn-primary">
            Start Detection
          </button>
        ) : (
          <button onClick={stopDetection} className="btn btn-danger">
            Stop Detection
          </button>
        )}
      </div>
      
      {detectionError && (
        <div className="error-message">
          {detectionError}
        </div>
      )}
      
      <div className="detection-container">
        <div className="video-container">
          <CameraFeed videoRef={videoRef} canvasRef={canvasRef} />
        </div>
        
        <div className="metrics-container">
          <FocusLevelIndicator level={focusLevel} />
          
          <div className="music-recommendation">
            <h3>Recommended Music</h3>
            {musicRecommendation ? (
              <MusicPlayer track={musicRecommendation} />
            ) : (
              <p>Start detection to get music recommendations</p>
            )}
          </div>
        </div>
      </div>
      
      {isDetecting && (
        <button onClick={saveFocusSession} className="btn btn-secondary">
          Save Session
        </button>
      )}
    </div>
  );
};

export default FocusDetection;