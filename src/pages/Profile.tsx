import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

interface UserProfile {
  name: string;
  email: string;
  preferredGenre: string;
  preferredTempo: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { currentUser, getUserData, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    preferredGenre: '',
    preferredTempo: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        setProfile(data as UserProfile);
        setFormData({
          name: data.name || '',
          preferredGenre: data.preferredGenre || 'classical',
          preferredTempo: data.preferredTempo || 'medium'
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({
          text: 'Failed to load profile data. Please try again.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, getUserData]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateUserProfile({
        name: formData.name,
        preferredGenre: formData.preferredGenre,
        preferredTempo: formData.preferredTempo
      });
      
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      });
      setIsEditing(false);
      
      // Update the profile state with new data
      const updatedData = await getUserData();
      setProfile(updatedData as UserProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        text: 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile data...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button 
            onClick={() => setMessage({ text: '', type: '' })}
            className="close-btn"
          >
            ×
          </button>
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="preferredGenre">Preferred Music Genre</label>
            <select
              id="preferredGenre"
              name="preferredGenre"
              value={formData.preferredGenre}
              onChange={handleChange}
              required
            >
              <option value="classical">Classical</option>
              <option value="jazz">Jazz</option>
              <option value="ambient">Ambient</option>
              <option value="electronic">Electronic</option>
              <option value="lo-fi">Lo-Fi</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="preferredTempo">Preferred Tempo</label>
            <select
              id="preferredTempo"
              name="preferredTempo"
              value={formData.preferredTempo}
              onChange={handleChange}
              required
            >
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{profile?.email}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{profile?.name}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Preferred Genre:</span>
            <span className="value">{profile?.preferredGenre}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Preferred Tempo:</span>
            <span className="value">{profile?.preferredTempo}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Member Since:</span>
            <span className="value">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsEditing(true)} 
            className="edit-btn"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;