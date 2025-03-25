import React from 'react';

interface FocusLevelIndicatorProps {
  level: number;
}

const FocusLevelIndicator: React.FC<FocusLevelIndicatorProps> = ({ level }) => {
  // Calculate the width of the progress bar based on focus level (0-1)
  const progressWidth = `${Math.round(level * 100)}%`;
  
  // Determine the color of the progress bar based on focus level
  const getProgressColor = (focusLevel: number) => {
    if (focusLevel < 0.3) return '#ff6b6b'; // Red for low focus
    if (focusLevel < 0.7) return '#ffd166'; // Yellow for medium focus
    return '#06d6a0'; // Green for high focus
  };
  
  const progressColor = getProgressColor(level);
  
  // Determine the focus status text
  const getFocusStatus = (focusLevel: number) => {
    if (focusLevel < 0.3) return 'Low Focus';
    if (focusLevel < 0.7) return 'Moderate Focus';
    return 'High Focus';
  };
  
  const focusStatus = getFocusStatus(level);
  
  return (
    <div className="focus-level-indicator">
      <h3>Current Focus Level</h3>
      
      <div className="focus-value">
        {Math.round(level * 100)}%
      </div>
      
      <div className="focus-status">
        {focusStatus}
      </div>
      
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ 
            width: progressWidth,
            backgroundColor: progressColor 
          }}
        ></div>
      </div>
    </div>
  );
};

export default FocusLevelIndicator;