import { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Button, 
  CircularProgress,
  Card,
  CardContent,
  CardActionArea,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import UserService, { FocusSession } from '../../services/UserService';
import FocusChart from '../../components/FocusChart/FocusChart';
import SpotifyService, { SpotifyPlaylist } from '../../services/SpotifyService';

const Dashboard = () => {
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [focusPlaylists, setFocusPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [calmPlaylists, setCalmPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch recent focus sessions
        const sessions = await UserService.getFocusHistory(user.uid, 7);
        setRecentSessions(sessions);
        
        // Fetch recommended playlists
        const [focusedPlaylists, calmingPlaylists] = await Promise.all([
          SpotifyService.getFocusedPlaylists(),
          SpotifyService.getCalmPlaylists()
        ]);
        
        setFocusPlaylists(focusedPlaylists);
        setCalmPlaylists(calmingPlaylists);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get the most recent session data for the chart
  const mostRecentSession = recentSessions[0] || null;
  const focusChartData = mostRecentSession 
    ? mostRecentSession.focusPoints.map(point => ({
        timestamp: point.timestamp,
        level: point.level
      }))
    : [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Focus Level Overview */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6">Focus Overview</Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/focus')}
              >
                Start New Session
              </Button>
            </Box>
            
            {mostRecentSession ? (
              <FocusChart 
                data={focusChartData} 
                title={`Latest Session: ${new Date(mostRecentSession.startTime).toLocaleDateString()}`}
              />
            ) : (
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  bgcolor: 'background.default' 
                }}
              >
                <Typography variant="body1">
                  No recent focus sessions found. Start your first session to track your focus!
                </Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Sessions Summary */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Sessions
            </Typography>
            
            {recentSessions.length > 0 ? (
              recentSessions.slice(0, 5).map((session, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    {new Date(session.startTime).toLocaleDateString()} - {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Focus: {session.averageFocusLevel.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000).toFixed(0)} minutes
                  </Typography>
                  {index < recentSessions.slice(0, 5).length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary">
                No recent sessions found
              </Typography>
            )}
            
            {recentSessions.length > 0 && (
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => navigate('/history')}
                sx={{ mt: 2 }}
              >
                View All Sessions
              </Button>
            )}
          </Paper>
        </Grid>
        
        {/* Recommended Playlists */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recommended Playlists
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              For Focused Work
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {focusPlaylists.slice(0, 2).map((playlist) => (
                <Grid item xs={6} key={playlist.id}>
                  <Card>
                    <CardActionArea>
                      <Box 
                        component="img" 
                        sx={{ 
                          height: 140,
                          width: '100%',
                          objectFit: 'cover'
                        }}
                        src={playlist.image || '/playlist-placeholder.png'}
                        alt={playlist.name}
                      />
                      <CardContent>
                        <Typography variant="body2" noWrap>
                          {playlist.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {playlist.tracks.length} tracks
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              For Relaxation
            </Typography>
            <Grid container spacing={2}>
              {calmPlaylists.slice(0, 2).map((playlist) => (
                <Grid item xs={6} key={playlist.id}>
                  <Card>
                    <CardActionArea>
                      <Box 
                        component="img" 
                        sx={{ 
                          height: 140,
                          width: '100%',
                          objectFit: 'cover'
                        }}
                        src={playlist.image || '/playlist-placeholder.png'}
                        alt={playlist.name}
                      />
                      <CardContent>
                        <Typography variant="body2" noWrap>
                          {playlist.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {playlist.tracks.length} tracks
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;