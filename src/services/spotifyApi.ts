import axios from 'axios';

// Base URL for Spotify API
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

// Spotify API client instance
const spotifyApiClient = axios.create({
  baseURL: SPOTIFY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set the access token for API requests
export const setSpotifyAccessToken = (token: string) => {
  spotifyApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Function to search for playlists based on focus level
export const searchPlaylists = async (query: string) => {
  try {
    const response = await spotifyApiClient.get('/search', {
      params: {
        q: query,
        type: 'playlist',
        limit: 5,
      },
    });
    return response.data.playlists.items;
  } catch (error) {
    console.error('Error searching playlists:', error);
    throw error;
  }
};

// Function to get recommended tracks based on focus level and user preferences
export const getRecommendations = async (
  focusLevel: number,
  genres?: string[],
  tempo?: number
) => {
  // Calculate target values based on focus level
  const targetEnergy = focusLevel;
  const targetTempo = tempo || (focusLevel < 0.5 ? 80 : 120);
  
  try {
    const response = await spotifyApiClient.get('/recommendations', {
      params: {
        seed_genres: genres?.join(',') || 'classical,electronic,ambient',
        target_energy: targetEnergy,
        target_tempo: targetTempo,
        limit: 10,
      },
    });
    return response.data.tracks;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

// Function to get a track's audio features
export const getTrackAudioFeatures = async (trackId: string) => {
  try {
    const response = await spotifyApiClient.get(`/audio-features/${trackId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting track audio features:', error);
    throw error;
  }
};

// Function to get the currently playing track
export const getCurrentlyPlayingTrack = async () => {
  try {
    const response = await spotifyApiClient.get('/me/player/currently-playing');
    return response.data;
  } catch (error) {
    console.error('Error getting currently playing track:', error);
    throw error;
  }
};

// Function to play a track or playlist
export const playTrack = async (
  trackUri?: string,
  deviceId?: string,
  positionMs = 0
) => {
  try {
    await spotifyApiClient.put(
      `/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`,
      trackUri
        ? {
            uris: [trackUri],
            position_ms: positionMs,
          }
        : {}
    );
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};

export default {
  setSpotifyAccessToken,
  searchPlaylists,
  getRecommendations,
  getTrackAudioFeatures,
  getCurrentlyPlayingTrack,
  playTrack,
};