import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '../../contexts/UserContext';

import '../../styles/MusicPlayer.css';

interface MusicPlayerProps {
  track: any;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useUser();
  
  // Initialize audio player when track changes
  useEffect(() => {
    if (audioRef.current && track?.preview_url) {
      audioRef.current.src = track.preview_url;
      audioRef.current.volume = volume;
      
      // Auto-play new track
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
    }
    
    // Save track to user history
    const saveTrackToHistory = async () => {
      if (user && track) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          
          // Check if track already exists in history
          const userDoc = await getDoc(userDocRef);
          const history = userDoc.data()?.musicHistory || [];
          
          // Only add if not already in recent history (last 20 tracks)
          const recentHistory = history.slice(-20);
          const trackExists = recentHistory.some((t: any) => t.id === track.id);
          
          if (!trackExists) {
            await updateDoc(userDocRef, {
              musicHistory: arrayUnion({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                playedAt: new Date(),
                albumArt: track.album?.images[0]?.url || ''
              })
            });
          }
        } catch (error) {
          console.error('Error saving track to history:', error);
        }
      }
    };
    
    if (track) {
      saveTrackToHistory();
    }
  }, [track, user, volume]);
  
  // Update current time display
  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateTimeDisplay = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
      setDuration(audioRef.current?.duration || 0);
    };
    
    audioRef.current.addEventListener('timeupdate', updateTimeDisplay);
    audioRef.current.addEventListener('loadedmetadata', updateTimeDisplay);
    
    return () => {
      audioRef.current?.removeEventListener('timeupdate', updateTimeDisplay);
      audioRef.current?.removeEventListener('loadedmetadata', updateTimeDisplay);
    };
  }, []);
  
  // Format time for display (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Play/pause toggle
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Seek to position in track
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = parseFloat(e.target.value);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  // Adjust volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  return (
    <div className="music-player">
      <audio ref={audioRef} />
      
      {track ? (
        <>
          <div className="track-info">
            <img 
              src={track.album?.images[0]?.url || '/placeholder-album.jpg'} 
              alt={`${track.name} album art`} 
              className="album-art"
            />
            <div className="track-details">
              <h4 className="track-name">{track.name}</h4>
              <p className="track-artist">{track.artists[0].name}</p>
            </div>
          </div>
          
          <div className="player-controls">
            <button 
              className="play-pause-btn" 
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            
            <div className="time-controls">
              <span className="current-time">{formatTime(currentTime)}</span>
              <input
                type="range"
                className="seek-slider"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
              />
              <span className="duration">{formatTime(duration)}</span>
            </div>
            
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="no-track">
          <p>No track available</p>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;