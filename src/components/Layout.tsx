import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box,
  IconButton, 
  Menu, 
  MenuItem,
  Avatar,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Layout = () => {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit' 
            }}
          >
            Muse
          </Typography>
          
          {user ? (
            <Box>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                {user.photoURL ? (
                  <Avatar 
                    src={user.photoURL} 
                    alt={user.displayName || user.email || 'User'} 
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </Avatar>
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem 
                  component={RouterLink} 
                  to="/dashboard" 
                  onClick={handleClose}
                >
                  Dashboard
                </MenuItem>
                <MenuItem 
                  component={RouterLink} 
                  to="/profile" 
                  onClick={handleClose}
                >
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); signOut(); }}>
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/register"
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'background.paper' 
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Muse - Personalized Music for Focus
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;