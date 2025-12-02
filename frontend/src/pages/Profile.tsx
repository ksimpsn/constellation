import React from 'react';
import { useNavigate } from 'react-router-dom';
import GradientBackground from '../components/GradientBackground';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // For now, just navigate to home or login
    navigate('/');
  };

  return (
    <GradientBackground>
      <h1 style={pageTitle}>My Profile</h1>

      <div style={content}>
        <div style={profileSection}>
          <div style={avatarContainer}>
            <div style={avatar}>
              <svg viewBox="0 0 24 24" style={userIcon}>
                <circle cx="12" cy="9" r="4" />
                <path d="M5 19c0-3.2 3-6 7-6s7 2.8 7 6" />
              </svg>
            </div>
            <h2 style={name}>John Doe</h2>
            <p style={username}>@johndoe</p>
          </div>

          <div style={detailsSection}>
            <div style={detailCard}>
              <h3 style={detailTitle}>Account Information</h3>
              <div style={detailItem}>
                <span style={detailLabel}>Name:</span>
                <span style={detailValue}>John Doe</span>
              </div>
              <div style={detailItem}>
                <span style={detailLabel}>Username:</span>
                <span style={detailValue}>@johndoe</span>
              </div>
              <div style={detailItem}>
                <span style={detailLabel}>Account Type:</span>
                <span style={detailValue}>Researcher</span>
              </div>
              <div style={detailItem}>
                <span style={detailLabel}>Member Since:</span>
                <span style={detailValue}>January 2024</span>
              </div>
            </div>

            <div style={statsSection}>
              <div style={statCard}>
                <div style={statNumber}>12</div>
                <div style={statLabel}>Projects Contributed</div>
              </div>
              <div style={statCard}>
                <div style={statNumber}>47</div>
                <div style={statLabel}>Sessions Logged</div>
              </div>
              <div style={statCard}>
                <div style={statNumber}>3</div>
                <div style={statLabel}>Publications</div>
              </div>
            </div>
          </div>
        </div>

        <div style={actionsSection}>
          <button style={editButton}>Edit Profile</button>
          <button style={settingsButton}>Account Settings</button>
          <button style={logoutButton} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}

const pageTitle: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 20px 0',
  textAlign: 'center',
};



const content: React.CSSProperties = {
  flex: 1,
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '40px',
};

const profileSection: React.CSSProperties = {
  display: 'flex',
  gap: '60px',
  alignItems: 'flex-start',
  width: '100%',
  maxWidth: '1200px',
};

const avatarContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '15px',
};

const avatar: React.CSSProperties = {
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
};

const userIcon: React.CSSProperties = {
  width: '70px',
  height: '70px',
  fill: '#666',
};

const name: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  margin: 0,
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
};

const username: React.CSSProperties = {
  fontSize: '18px',
  color: 'rgba(255, 255, 255, 0.8)',
  margin: 0,
  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
};

const detailsSection: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '30px',
};

const detailCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '15px',
  padding: '30px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const detailTitle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 20px 0',
};

const detailItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #eee',
};

const detailLabel: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#666',
};

const detailValue: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#333',
};

const statsSection: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
};

const statCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '15px',
  padding: '25px',
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  flex: 1,
};

const statNumber: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#667eea',
  marginBottom: '5px',
};

const statLabel: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const actionsSection: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
};

const editButton: React.CSSProperties = {
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  padding: '15px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
};

const settingsButton: React.CSSProperties = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '15px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
};

const logoutButton: React.CSSProperties = {
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '15px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
};
