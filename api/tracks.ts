import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check request method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { genre = 'classical' } = req.query;
    
    // Query the database for tracks matching the genre
    const tracksCollection = collection(db, 'tracks');
    const trackQuery = query(
      tracksCollection,
      where('genre', '==', genre)
    );
    
    const querySnapshot = await getDocs(trackQuery);
    
    // Transform the data
    const tracks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If no tracks are found, return default tracks
    if (tracks.length === 0) {
      return res.status(200).json({
        tracks: getDefaultTracks(genre as string)
      });
    }
    
    // Return the tracks
    res.status(200).json({ tracks });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tracks',
      tracks: getDefaultTracks() // Fallback to default tracks
    });
  }
};

// Fallback default tracks in case the database query fails
function getDefaultTracks(genre = 'classical') {
  return [
    {
      id: 'track-1',
      name: 'Deep Focus',
      artist: 'Focus Academy',
      url: 'https://example.com/music/deep-focus.mp3',
      coverUrl: 'https://example.com/covers/deep-focus.jpg',
      tempo: 'medium',
      genre
    },
    {
      id: 'track-2',
      name: 'Calm Waters',
      artist: 'Relaxation Master',
      url: 'https://example.com/music/calm-waters.mp3',
      coverUrl: 'https://example.com/covers/calm-waters.jpg',
      tempo: 'slow',
      genre
    },
    {
      id: 'track-3',
      name: 'Energy Boost',
      artist: 'Productivity Beats',
      url: 'https://example.com/music/energy-boost.mp3',
      coverUrl: 'https://example.com/covers/energy-boost.jpg',
      tempo: 'fast',
      genre
    }
  ];
}