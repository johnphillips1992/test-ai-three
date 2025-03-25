import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  IconButton, 
  Slider,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  SkipPrevious, 
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import { SpotifyTrack } from '../../services/SpotifyService';

interface MusicPlayerProps {
  tracks: SpotifyTrack[];
  focusLevel: number;
  isLoading?: boolean;
}

const MusicPlayer = ({ tracks, focusLevel, isLoading = false }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const currentTrack = tracks[currentTrackIndex];

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    const handleEnded = () => {
      handleNext();
    };
    
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Update track when currentTrackIndex changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    
    const audioEl = audioRef.current;
    audioEl.src = currentTrack.previewUrl || '';
    audioEl.volume = volume / 100;
    
    if (isPlaying) {
      audioEl.play().catch(error => {
        console.error('Error playing track:', error);
        setIsPlaying(false);
      });
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentTrack, currentTrackIndex]);

  // Update progress
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      progressIntervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime);
        }
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing track:', error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIndex);
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    setIsMuted(false);
  };

  const handleProgressChange = (_event: Event, newValue: number | number[]) => {
    if (!audioRef.current) return;
    
    const newProgress = newValue as number;
    setProgress(newProgress);
    audioRef.current.currentTime = newProgress;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!currentTrack) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="subtitle1">
          No tracks available. Please check your music preferences.
        </Typography>
      </Paper>
    );
  }

  return (
    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 2 }}>
      <CardMedia
        component="img"
        sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 140, sm: 140 } }}
        image={currentTrack.albumArt || '/album-placeholder.png'}
        alt={currentTrack.album}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Typography component="div" variant="h6">
            {currentTrack.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="div">
            {currentTrack.artist}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTrack.album}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              {formatTime(progress)}
            </Typography>
            <Slider
              size="small"
              value={progress}
              max={duration || 0}
              onChange={handleProgressChange}
              aria-label="Progress"
              sx={{ mx: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </CardContent>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
          <Box>
            <IconButton aria-label="previous song" onClick={handlePrevious}>
              <SkipPrevious />
            </IconButton>
            <IconButton aria-label="play/pause" onClick={handlePlayPause}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <IconButton aria-label="next song" onClick={handleNext}>
              <SkipNext />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', width: 150 }}>
            <IconButton aria-label="toggle mute" onClick={toggleMute}>
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <Slider
              size="small"
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
            />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default MusicPlayer;