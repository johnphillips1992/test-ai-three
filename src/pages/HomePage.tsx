import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  LinearProgress, 
  Container,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { useSpotify } from '../hooks/useSpotify';
import MusicPlayer from '../components/MusicPlayer';
import FocusLevelIndicator from '../components/FocusLevelIndicator';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([]);

  // Initialize face detection hook
  const { 
    isModelLoading, 
    isCameraReady, 
    focusLevel, 
    startDetection, 
    stopDetection, 
    error: faceDetectionError 
  } = useFaceDetection({
    videoRef,
    onFocusLevelChange: handleFocusLevelChange,
    detectionInterval: 1000
  });

  // Initialize Spotify hook
  const { 
    isLoading: isSpotifyLoading, 
    error: spotifyError, 
    getRecommendedTracks, 
    playTrack 
  } = useSpotify();

  // Handle changes in focus level
  async function handleFocusLevelChange(newFocusLevel: number) {
    if (!isAnalyzing) return;
    
    try {
      // Get recommended tracks based on focus level
      const userGenres = user?.preferences?.preferredGenre?.split(',');
      const userTempo = user?.preferences?.preferredTempo;
      
      const tracks = await getRecommendedTracks(
        newFocusLevel,
        userGenres,
        userTempo
      );
      
      if (tracks.length > 0) {
        setRecommendedTracks(tracks);
        
        // Play a track if none is currently playing
        if (!currentTrack) {
          setCurrentTrack(tracks[0]);
          await playTrack(tracks[0].uri);
        }
      }
    } catch (err) {
      console.error('Error handling focus level change:', err);
    }
  }

  // Start analyzing focus
  const handleStartAnalyzing = async () => {
    await startDetection();
    setIsAnalyzing(true);
  };

  // Stop analyzing focus
  const handleStopAnalyzing = () => {
    stopDetection();
    setIsAnalyzing(false);
  };

  // Play a specific track
  const handlePlayTrack = async (track: any) => {
    try {
      await playTrack(track.uri);
      setCurrentTrack(track);
    } catch (err) {
      console.error('Error playing track:', err);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Display loading state
  if (isModelLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading facial recognition models...
        </Typography>
      </Container>
    );
  }

  // Display errors
  if (faceDetectionError || spotifyError) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {faceDetectionError || spotifyError}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Muse
      </Typography>
      
      <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
        Personalized music based on your focus level
      </Typography>
      
      <Box sx={{ my: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Focus Detection
              </Typography>
              
              <Box
                sx={{
                  width: '100%',
                  position: 'relative',
                  aspectRatio: '4/3',
                  backgroundColor: '#000'
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>
              
              <Box sx={{ width: '100%', mt: 2 }}>
                <FocusLevelIndicator focusLevel={focusLevel} />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {!isAnalyzing ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartAnalyzing}
                    disabled={isModelLoading || isSpotifyLoading}
                  >
                    Start Analyzing
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleStopAnalyzing}
                  >
                    Stop Analyzing
                  </Button>
                )}
                
                {!user && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                  >
                    Log in for personalized music
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Music Player
              </Typography>
              
              {currentTrack ? (
                <MusicPlayer
                  track={currentTrack}
                  recommendedTracks={recommendedTracks}
                  onPlayTrack={handlePlayTrack}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1
                  }}
                >
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Start analyzing your focus level to get personalized music recommendations.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;