import axios from 'axios';

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RecommendationParams {
  energy?: number;
  tempo?: number;
  valence?: number;
  limit?: number;
  genre?: string;
}

class SpotifyService {
  private static clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  private static clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;
  
  /**
   * Get or refresh the Spotify access token
   */
  private static async getAccessToken(): Promise<string> {
    // Check if we already have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    try {
      // Request new token using client credentials flow
      const authOptions = {
        method: 'POST',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: 'grant_type=client_credentials'
      };
      
      const response = await axios(authOptions);
      const data: SpotifyAuthResponse = response.data;
      
      // Store token and set expiry time (slightly earlier than actual expiry)
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }
  
  /**
   * Get music recommendations based on parameters
   */
  public static async getRecommendations(params: RecommendationParams) {
    try {
      const token = await this.getAccessToken();
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      
      if (params.energy !== undefined) queryParams.append('target_energy', params.energy.toString());
      if (params.tempo !== undefined) queryParams.append('target_tempo', params.tempo.toString());
      if (params.valence !== undefined) queryParams.append('target_valence', params.valence.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.genre !== undefined) queryParams.append('seed_genres', params.genre);
      
      const response = await axios.get(`https://api.spotify.com/v1/recommendations?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error);
      throw new Error('Failed to get music recommendations');
    }
  }
  
  /**
   * Search for tracks by query
   */
  public static async searchTracks(query: string, limit: number = 10) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: query,
          type: 'track',
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error searching Spotify tracks:', error);
      throw new Error('Failed to search for tracks');
    }
  }
}

export default SpotifyService;