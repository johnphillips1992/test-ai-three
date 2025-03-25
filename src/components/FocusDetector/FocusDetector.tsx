import { Box, Typography, Paper, LinearProgress, CircularProgress } from '@mui/material';
import { useWebcam } from '../../hooks/useWebcam';
import { useFocusDetection } from '../../hooks/useFocusDetection';
import { useEffect } from 'react';

interface FocusDetectorProps {
  onFocusChange?: (focusLevel: number) => void;
  width?: number;
  height?: number;
}

const FocusDetector = ({ onFocusChange, width = 640, height = 480 }: FocusDetectorProps) => {
  const { videoRef, error: webcamError, handleCanPlay, isReady } = useWebcam({
    width,
    height,
    facingMode: 'user'
  });

  const { 
    focusLevel, 
    isAnalyzing, 
    modelsLoaded, 
    error: detectionError 
  } = useFocusDetection({
    videoRef,
    interval: 1000,
    enabled: isReady
  });

  useEffect(() => {
    if (onFocusChange) {
      onFocusChange(focusLevel);
    }
  }, [focusLevel, onFocusChange]);

  if (webcamError) {
    return (
      <Paper 
        elevation={3} 
        sx={{ p: 3, textAlign: 'center', backgroundColor: '#ffebee' }}
      >
        <Typography variant="h6" color="error">
          Camera Error
        </Typography>
        <Typography variant="body2" color="error">
          {webcamError.message}. Please ensure your camera is connected and you've granted permission.
        </Typography>
      </Paper>
    );
  }

  if (detectionError) {
    return (
      <Paper 
        elevation={3} 
        sx={{ p: 3, textAlign: 'center', backgroundColor: '#ffebee' }}
      >
        <Typography variant="h6" color="error">
          Focus Detection Error
        </Typography>
        <Typography variant="body2" color="error">
          {detectionError.message}. Please refresh the page and try again.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper elevation={3} 
        sx={{ 
          overflow: 'hidden', 
          borderRadius: 2,
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: 'auto',
            maxWidth: width,
            margin: '0 auto'
          }}
        >
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleCanPlay}
            style={{ 
              width: '100%', 
              height: 'auto',
              transform: 'scaleX(-1)', // Mirror effect
              display: isReady ? 'block' : 'none'
            }}
          />
          
          {!isReady && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: height,
                bgcolor: 'background.paper'
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {!modelsLoaded && isReady && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                zIndex: 2
              }}
            >
              <CircularProgress color="secondary" />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading focus detection models...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mt: 2, 
          borderRadius: 2,
          opacity: isReady && modelsLoaded ? 1 : 0.5
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Focus Level: {Math.round(focusLevel)}%
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={focusLevel} 
          color={
            focusLevel >= 70 ? 'success' : 
            focusLevel >= 40 ? 'primary' : 'warning'
          }
          sx={{ 
            height: 10, 
            borderRadius: 5,
            mb: 1
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {isAnalyzing ? 'Analyzing your focus...' : 'Looking at your expressions'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default FocusDetector;