import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';
import './App.css';

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    // Simulate checking for facial recognition libraries and other dependencies
    setTimeout(() => {
      setAppLoaded(true);
    }, 1500);
  }, []);

  if (loading || !appLoaded) {
    return <Loading />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;