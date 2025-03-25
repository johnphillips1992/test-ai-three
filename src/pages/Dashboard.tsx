import React, { useState, useEffect } from 'react';
import FocusDetector from '../components/FocusDetector';
import MusicPlayer from '../components/MusicPlayer';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [focusLevel, setFocusLevel] = useState(0.5);
  const [focusHistory, setFocusHistory] = useState<{ timestamp: number; level: number }[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { currentUser } = useAuth();

  // Update focus history when focus level changes
  useEffect(() => {
    if (isDetecting) {
      // Add current focus level to history
      setFocusHistory(prev => [
        ...prev, 
        { timestamp: Date.now(), level: focusLevel }
      ]);
      
      // Keep only the last 30 minutes of data
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      setFocusHistory(prev => 
        prev.filter(item => item.timestamp >= thirtyMinutesAgo)
      );
    }
  }, [focusLevel, isDetecting]);

  // Handle focus level changes from the FocusDetector
  const handleFocusChange = (level: number) => {
    setFocusLevel(level);
    if (!isDetecting) {
      setIsDetecting(true);
    }
  };

  // Calculate average focus level for the session
  const averageFocusLevel = focusHistory.length > 0
    ? focusHistory.reduce((sum, item) => sum + item.level, 0) / focusHistory.length
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Music Dashboard</h1>
        <p>Welcome back, {currentUser?.displayName}!</p>
      </div>
      
      <div className="dashboard-content">
        <div className="webcam-section">
          <h2>Focus Detection</h2>
          <FocusDetector onFocusChange={handleFocusChange} />
        </div>
        
        <div className="music-section">
          <h2>Music Player</h2>
          <MusicPlayer focusLevel={focusLevel} />
        </div>
      </div>
      
      <div className="focus-stats">
        <h2>Focus Statistics</h2>
        {isDetecting ? (
          <>
            <p>Current Session Duration: {Math.round(focusHistory.length / 60)} minutes</p>
            <p>Average Focus Level: {Math.round(averageFocusLevel * 100)}%</p>
          </>
        ) : (
          <p>Start the focus detection to see your statistics.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;