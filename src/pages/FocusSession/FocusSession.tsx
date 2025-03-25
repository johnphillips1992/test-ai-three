import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import FocusDetector from '../../components/FocusDetector/FocusDetector';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';
import FocusChart from '../../components/FocusChart/FocusChart';
import SpotifyService, { SpotifyTrack } from '../../services/SpotifyService';
import UserService from '../../services/UserService';
import { v4 as uuidv4 } from 'uuid';

interface FocusPoint {
  timestamp: Date;
  level: number;
}

const FocusSession = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentFocusLevel, setCurrentFocusLevel] = useState(0);
  const [focusHistory, setFocusHistory] = useState<FocusPoint[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Initialize session
  useEffect(() => {
    if (isSessionActive && !sessionId) {
      setSessionId(uuidv4());
      setStartTime(new Date());
    }
  }, [isSessionActive, sessionId]);
  
  // Timer for elapsed time
  useEffect(() => {
    let interval: number | null = null;
    
    if (isSessionActive && startTime) {
      interval = window.setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSessionActive, startTime]);
  
  // Fetch music based on focus level
  useEffect(() => {
    if (!isSessionActive) return;
    
    const fetchMusic = async () => {
      try {
        setIsLoadingTracks(true);
        const recommendedTracks = await SpotifyService.getRecommendationsForFocus(currentFocusLevel);
        setTracks(recommendedTracks);
      } catch (err) {
        console.error('Error fetching music recommendations:', err);
        setError('Failed to load music recommendations. Please try again.');
      } finally {
        setIsLoadingTracks(false);
      }
    };
    
    // Update music if focus level changes significantly or on initial session start
    if (focusHistory.length === 0 || Math.abs(currentFocusLevel - focusHistory[focusHistory.length - 1].level) > 15) {
      fetchMusic();
    }
  }, [isSessionActive, currentFocusLevel, focusHistory]);
  
  // Save focus point to history
  useEffect(() => {
    if (!isSessionActive || !user || !sessionId) return;
    
    const saveFocusPoint = async () => {
      try {
        // Save to local state
        const focusPoint = {
          timestamp: new Date(),
          level: currentFocusLevel
        };
        
        setFocusHistory(prev => [...prev, focusPoint]);
        
        // Save to database
        await UserService.saveFocusPoint(user.uid, sessionId, currentFocusLevel);
      } catch (err) {
        console.error('Error saving focus point:', err);
      }
    };
    
    saveFocusPoint();
  }, [isSessionActive, currentFocusLevel, user, sessionId]);
  
  const handleFocusChange = (focusLevel: number) => {
    setCurrentFocusLevel(focusLevel);
  };
  
  const handleStartSession = () => {
    setIsSessionActive(true);
  };
  
  const handleOpenEndDialog = () => {
    setEndSessionDialogOpen(true);
  };
  
  const handleCloseEndDialog = () => {
    setEndSessionDialogOpen(false);
  };
  
  const handleEndSession = async () => {
    try {
      setEndSessionDialogOpen(false);
      
      if (user && sessionId && startTime) {
        const endTime = new Date();
        
        // Calculate average focus level
        const averageFocusLevel = focusHistory.reduce((sum, point) => sum + point.level, 0) / focusHistory.length;
        
        // Create session object
        const session = {
          id: sessionId,
          startTime,
          endTime,
          averageFocusLevel,
          focusPoints: focusHistory
        };
        
        // Save session to database
        await UserService.saveFocusSession(user.uid, session);
        
        // Reset session state
        setIsSessionActive(false);
        setSessionId('');
        setStartTime(null);
        setElapsedTime(0);
        setFocusHistory([]);
        
        // Navigate to results or dashboard
        navigate('/history');
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to save session. Please try again.');
    }
  };
  
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Focus Session
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {!isSessionActive ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <Typography variant="h5" gutterBottom>
            Ready to focus?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Start a focus session to track your concentration and get personalized music based on your focus level.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleStartSession}
          >
            Start Session
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FocusDetector onFocusChange={handleFocusChange} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Session in Progress
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatElapsedTime(elapsedTime)}
                </Typography>
              </Box>
              
              <Button 
                variant="contained" 
                color="error" 
                fullWidth
                onClick={handleOpenEndDialog}
              >
                End Session
              </Button>
            </Paper>
            
            <MusicPlayer 
              tracks={tracks} 
              focusLevel={currentFocusLevel} 
              isLoading={isLoadingTracks} 
            />
            
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Focus History
              </Typography>
              {focusHistory.length > 0 ? (
                <FocusChart data={focusHistory} height={200} />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* End Session Dialog */}
      <Dialog
        open={endSessionDialogOpen}
        onClose={handleCloseEndDialog}
      >
        <DialogTitle>End Focus Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to end this focus session? Your progress will be saved to your history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEndDialog}>Cancel</Button>
          <Button onClick={handleEndSession} variant="contained" color="error">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FocusSession;