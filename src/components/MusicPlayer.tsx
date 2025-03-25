import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MusicPlayer.css';

interface MusicPlayerProps {
  focusLevel: number;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  tempo: 'slow' | 'medium' | 'fast';
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ focusLevel }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentUser, getUserData } = useAuth();

  // Load tracks on component mount
  useEffect(() => {
    fetchTracks();
  }, []);

  // Fetch tracks from the API
  const fetchTracks = async () => {
    try {
      // Get user preferences if available
      let preferredGenre = 'classical';
      if (currentUser) {
        const userData = await getUserData();
        if (userData && userData.preferredGenre) {
          preferredGenre = userData.preferredGenre;
        }
      }

      // Fetch tracks from API
      const response = await fetch(`/api/tracks?genre=${preferredGenre}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      
      const data = await response.json();
      setTracks(data.tracks);
      
      // Set initial track based on focus level
      selectTrackBasedOnFocus(data.tracks, focusLevel);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  // Select track based on focus level
  const selectTrackBasedOnFocus = (availableTracks: Track[], level: number) => {
    if (!availableTracks || availableTracks.length === 0) return;
    
    let tempoCategory: 'slow' | 'medium' | 'fast';
    
    if (level < 0.3) {
      tempoCategory = 'slow';
    } else if (level < 0.7) {
      tempoCategory = 'medium';
    } else {
      tempoCategory = 'fast';
    }
    
    // Filter tracks by tempo category
    const matchingTracks = availableTracks.filter(track => track.tempo === tempoCategory);
    
    if (matchingTracks.length > 0) {
      // Select a random track from matching tempo category
      const randomIndex = Math.floor(Math.random() * matchingTracks.length);
      setCurrentTrack(matchingTracks[randomIndex]);
      
      // Start playing the selected track
      setIsPlaying(true);
    }
  };
  
  // Update track when focus level changes significantly
  useEffect(() => {
    if (tracks.length === 0) return;
    
    // Only change music if focus level changes by more than 0.3
    if (!currentTrack) {
      selectTrackBasedOnFocus(tracks, focusLevel);
      return;
    }
    
    let newTempoCategory: 'slow' | 'medium' | 'fast';
    
    if (focusLevel < 0.3) {
      newTempoCategory = 'slow';
    } else if (focusLevel < 0.7) {
      newTempoCategory = 'medium';
    } else {
      newTempoCategory = 'fast';
    }
    
    // Only change if the tempo category is different
    if (currentTrack.tempo !== newTempoCategory) {
      selectTrackBasedOnFocus(tracks, focusLevel);
    }
  }, [focusLevel, tracks]);

  // Handle play state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Skip to next track
  const nextTrack = () => {
    if (tracks.length === 0) return;
    
    const currentIndex = currentTrack ? tracks.findIndex(t => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  // Handle track end
  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="music-player">
      {currentTrack ? (
        <>
          <div className="track-info">
            <div className="album-cover">
              <img src={currentTrack.coverUrl} alt={currentTrack.name} />
            </div>
            <div className="track-details">
              <h3>{currentTrack.name}</h3>
              <p>{currentTrack.artist}</p>
              <p className="tempo-indicator">Tempo: {currentTrack.tempo}</p>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={currentTrack.url}
            onEnded={handleTrackEnd}
          />
          <div className="player-controls">
            <button onClick={togglePlay} className="play-pause-btn">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button onClick={nextTrack} className="next-btn">
              ⏭️
            </button>
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </div>
          <div className="focus-indicator">
            <p>Current Focus Level: {Math.round(focusLevel * 100)}%</p>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${focusLevel * 100}%` }}
              ></div>
            </div>
          </div>
        </>
      ) : (
        <div className="loading-tracks">
          <p>Loading music tracks...</p>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;