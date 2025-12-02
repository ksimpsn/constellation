import React, { useState } from 'react';
import GradientBackground from '../components/GradientBackground';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Researcher');
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    dataSharing: true,
    emailNotifications: true,
    projectUpdates: false,
  });

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // Handle password reset logic here
    alert('Password reset functionality would be implemented here');
  };

  const handleAccountTypeChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle account type change logic here
    alert(`Account type changed to ${accountType}`);
  };

  const handlePrivacyChange = (setting: keyof typeof privacySettings, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <GradientBackground>
      <h1 style={pageTitle}>Account Settings</h1>

      <div style={settingsContainer}>
        {/* Password Reset Section */}
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Reset Password</h2>
          <form onSubmit={handlePasswordReset} style={form}>
            <div style={formGroup}>
              <label style={label}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={input}
                required
              />
            </div>
            <div style={formGroup}>
              <label style={label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={input}
                required
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={input}
                required
              />
            </div>
            <button type="submit" style={primaryButton}>Reset Password</button>
          </form>
        </div>

        {/* Account Type Section */}
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Account Type</h2>
          <form onSubmit={handleAccountTypeChange} style={form}>
            <div style={formGroup}>
              <label style={label}>Current Account Type: <strong>{accountType}</strong></label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                style={select}
              >
                <option value="Researcher">Researcher</option>
                <option value="Contributor">Contributor</option>
                <option value="Institution">Institution</option>
              </select>
            </div>
            <button type="submit" style={primaryButton}>Change Account Type</button>
          </form>
        </div>

        {/* Privacy Settings Section */}
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Privacy Settings</h2>
          <div style={privacySection}>
            <div style={privacyItem}>
              <label style={label}>Profile Visibility</label>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                style={select}
              >
                <option value="public">Public</option>
                <option value="researchers">Researchers Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div style={privacyItem}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={privacySettings.dataSharing}
                  onChange={(e) => handlePrivacyChange('dataSharing', e.target.checked)}
                  style={checkbox}
                />
                Allow anonymous data sharing for research insights
              </label>
            </div>

            <div style={privacyItem}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={privacySettings.emailNotifications}
                  onChange={(e) => handlePrivacyChange('emailNotifications', e.target.checked)}
                  style={checkbox}
                />
                Receive email notifications
              </label>
            </div>

            <div style={privacyItem}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={privacySettings.projectUpdates}
                  onChange={(e) => handlePrivacyChange('projectUpdates', e.target.checked)}
                  style={checkbox}
                />
                Receive project update notifications
              </label>
            </div>
          </div>
        </div>

        {/* Additional Settings Section */}
        <div style={sectionCard}>
          <h2 style={sectionTitle}>Additional Settings</h2>
          <div style={additionalSection}>
            <button style={secondaryButton}>Download Account Data</button>
            <button style={dangerButton}>Delete Account</button>
          </div>
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

const settingsContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px',
  maxWidth: '800px',
  width: '100%',
};

const sectionCard: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '15px',
  padding: '30px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 20px 0',
};

const form: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const formGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const label: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
};

const input: React.CSSProperties = {
  padding: '12px 16px',
  border: '2px solid #e1e5e9',
  borderRadius: '8px',
  fontSize: '16px',
  transition: 'border-color 0.3s ease',
  outline: 'none',
  backgroundColor: 'white',
  color: 'black',
};

const select: React.CSSProperties = {
  padding: '12px 16px',
  border: '2px solid #e1e5e9',
  borderRadius: '8px',
  fontSize: '16px',
  backgroundColor: 'white',
  color: 'black',
  cursor: 'pointer',
};

const primaryButton: React.CSSProperties = {
  backgroundColor: '#667eea',
  color: 'white',
  border: 'none',
  padding: '15px 30px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  alignSelf: 'flex-start',
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  marginRight: '15px',
};

const dangerButton: React.CSSProperties = {
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
};

const privacySection: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const privacyItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const checkboxLabel: React.CSSProperties = {
  fontSize: '16px',
  color: '#333',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const checkbox: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
};

const additionalSection: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap',
};
