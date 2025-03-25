import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Get Spotify access token
async function getSpotifyToken() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
}

// Get music recommendations based on focus level
async function getMusicRecommendations(focusLevel: number, preferences: any = {}) {
  try {
    const token = await getSpotifyToken();
    
    // Set parameters based on focus level
    let params: any = {};
    
    if (focusLevel < 0.5) {
      // Low focus - calming music
      params = {
        seed_genres: preferences.calmGenre || 'ambient,classical,chill',
        target_energy: 0.3,
        target_tempo: 80,
        target_valence: 0.4,
        limit: 5
      };
    } else {
      // High focus - upbeat, energetic music
      params = {
        seed_genres: preferences.focusedGenre || 'electronic,focus,work',
        target_energy: 0.7,
        target_tempo: 120,
        target_valence: 0.6,
        limit: 5
      };
    }
    
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw new Error('Failed to get music recommendations');
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { focusLevel, preferences } = req.body;
    
    if (focusLevel === undefined) {
      return res.status(400).json({ error: 'Focus level is required' });
    }
    
    const recommendations = await getMusicRecommendations(focusLevel, preferences);
    
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};