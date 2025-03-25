import axios from 'axios';

const API_URL = '/api/spotify';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  previewUrl: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  tracks: SpotifyTrack[];
  image: string;
}

class SpotifyService {
  async getRecommendationsForFocus(focusLevel: number): Promise<SpotifyTrack[]> {
    try {
      // Determine music parameters based on focus level
      const params = this.getFocusParameters(focusLevel);
      
      const response = await axios.get(`${API_URL}/recommendations`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Spotify recommendations:', error);
      throw error;
    }
  }

  async getFocusedPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const response = await axios.get(`${API_URL}/playlists/focused`);
      return response.data;
    } catch (error) {
      console.error('Error fetching focused playlists:', error);
      throw error;
    }
  }

  async getCalmPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const response = await axios.get(`${API_URL}/playlists/calm`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calm playlists:', error);
      throw error;
    }
  }

  private getFocusParameters(focusLevel: number) {
    // Higher focus: more energetic, higher tempo music
    // Lower focus: calmer, lower tempo music
    if (focusLevel >= 70) {
      return {
        min_energy: 0.7,
        min_tempo: 120,
        target_valence: 0.7 // More positive/upbeat
      };
    } else if (focusLevel >= 40) {
      return {
        target_energy: 0.5,
        target_tempo: 100,
        target_valence: 0.5
      };
    } else {
      return {
        max_energy: 0.4,
        max_tempo: 90,
        target_valence: 0.4 // More relaxed/calm
      };
    }
  }
}

export default new SpotifyService();