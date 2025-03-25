import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Avatar,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';

interface MusicPlayerProps {
  track: any; // Track object from Spotify API
  recommendedTracks: any[]; // Array of track objects
  onPlayTrack: (track: any) => void;
}

const MusicPlayer = ({ track, recommendedTracks, onPlayTrack }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize audio player on track change
  useEffect(() => {
    if (!track) return;

    // Create an audio element to play the preview
    const audio = new Audio(track.preview_url);
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      
      // Play next track
      const currentIndex = recommendedTracks.findIndex(t => t.id === track.id);
      if (currentIndex < recommendedTracks.length - 1) {
        onPlayTrack(recommendedTracks[currentIndex + 1]);
      }
    });
    
    // Play the track
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    });
    
    // Clean up on unmount or track change
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [track, recommendedTracks, onPlayTrack]);

  // Play or pause the current track
  const togglePlay = () => {
    const audio = document.querySelector('audio');
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Play the previous track
  const playPrevTrack = () => {
    if (!track || recommendedTracks.length === 0) return;
    
    const currentIndex = recommendedTracks.findIndex(t => t.id === track.id);
    if (currentIndex > 0) {
      onPlayTrack(recommendedTracks[currentIndex - 1]);
    }
  };

  // Play the next track
  const playNextTrack = () => {
    if (!track || recommendedTracks.length === 0) return;
    
    const currentIndex = recommendedTracks.findIndex(t => t.id === track.id);
    if (currentIndex < recommendedTracks.length - 1) {
      onPlayTrack(recommendedTracks[currentIndex + 1]);
    }
  };

  // Format time in seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!track) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No track selected</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Avatar
          src={track.album.images[0]?.url}
          alt={track.name}
          sx={{ width: 150, height: 150, margin: '0 auto', mb: 2 }}
        />
        <Typography variant="h6" noWrap>{track.name}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {track.artists.map((artist: any) => artist.name).join(', ')}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" sx={{ mr: 1 }}>
          {formatTime(progress)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(progress / duration) * 100}
          sx={{ flexGrow: 1 }}
        />
        <Typography variant="caption" sx={{ ml: 1 }}>
          {formatTime(duration)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IconButton onClick={playPrevTrack}>
          <SkipPreviousIcon />
        </IconButton>
        <IconButton onClick={togglePlay}>
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton onClick={playNextTrack}>
          <SkipNextIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Recommended Tracks
      </Typography>
      
      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
        {recommendedTracks.map((recommendedTrack) => (
          <ListItem
            key={recommendedTrack.id}
            button
            selected={recommendedTrack.id === track.id}
            onClick={() => onPlayTrack(recommendedTrack)}
          >
            <Avatar
              src={recommendedTrack.album.images[2]?.url}
              alt={recommendedTrack.name}
              sx={{ width: 30, height: 30, mr: 2 }}
            />
            <ListItemText
              primary={recommendedTrack.name}
              secondary={recommendedTrack.artists.map((artist: any) => artist.name).join(', ')}
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MusicPlayer;