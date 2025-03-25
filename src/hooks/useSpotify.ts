import { useState, useEffect, useCallback } from 'react';
import spotifyApi, { setSpotifyAccessToken } from '../services/spotifyApi';

interface UseSpotifyOptions {
  onTokenRefresh?: () => void;
}

interface UseSpotifyReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  getRecommendedTracks: (focusLevel: number, genres?: string[], tempo?: number) => Promise<any[]>;
  playTrack: (trackUri: string) => Promise<void>;
}

/**
 * Custom hook for Spotify API integration
 */
export const useSpotify = ({ onTokenRefresh }: UseSpotifyOptions = {}): UseSpotifyReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Spotify token from API
  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/spotify-token');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Spotify token');
      }
      
      const newToken = data.access_token;
      setToken(newToken);
      setSpotifyAccessToken(newToken);
      
      if (onTokenRefresh) {
        onTokenRefresh();
      }
      
      return newToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onTokenRefresh]);

  // Initialize token on mount
  useEffect(() => {
    fetchToken();
    
    // Refresh token periodically (Spotify tokens last for an hour)
    const intervalId = setInterval(() => {
      fetchToken();
    }, 3000000); // Refresh every 50 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchToken]);

  // Get recommended tracks based on focus level
  const getRecommendedTracks = useCallback(
    async (focusLevel: number, genres?: string[], tempo?: number) => {
      if (!token) {
        const newToken = await fetchToken();
        if (!newToken) {
          return [];
        }
      }
      
      try {
        setIsLoading(true);
        const tracks = await spotifyApi.getRecommendations(focusLevel, genres, tempo);
        return tracks;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [token, fetchToken]
  );

  // Play a Spotify track
  const playTrack = useCallback(
    async (trackUri: string) => {
      if (!token) {
        const newToken = await fetchToken();
        if (!newToken) {
          throw new Error('No Spotify token available');
        }
      }
      
      try {
        setIsLoading(true);
        await spotifyApi.playTrack(trackUri);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to play track';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [token, fetchToken]
  );

  return {
    token,
    isLoading,
    error,
    getRecommendedTracks,
    playTrack
  };
};