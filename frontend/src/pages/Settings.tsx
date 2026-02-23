import { useState } from 'react';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '16px',
  outline: 'none',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
} as const;

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
    alert('Password reset functionality would be implemented here');
  };

  const handleAccountTypeChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Account type changed to ${accountType}`);
  };

  const handlePrivacyChange = (setting: keyof typeof privacySettings, value: string | boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-[800px] mx-auto w-full flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-white/90 mb-2 text-center">Account Settings</h1>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-white/90 m-0 mb-5">Reset Password</h2>
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} required />
            </div>
            <button type="submit" className="w-fit py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer">
              Reset Password
            </button>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-white/90 m-0 mb-5">Account Type</h2>
          <form onSubmit={handleAccountTypeChange} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium">Current Account Type: <strong className="text-white/90">{accountType}</strong></label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={inputStyle} className="cursor-pointer">
                <option value="Researcher">Researcher</option>
                <option value="Contributor">Contributor</option>
                <option value="Institution">Institution</option>
              </select>
            </div>
            <button type="submit" className="w-fit py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer">
              Change Account Type
            </button>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-white/90 m-0 mb-5">Privacy Settings</h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-white/80 text-sm font-medium">Profile Visibility</label>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                style={inputStyle}
                className="cursor-pointer"
              >
                <option value="public">Public</option>
                <option value="researchers">Researchers Only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <label className="flex items-center gap-3 text-white/80 cursor-pointer">
              <input type="checkbox" checked={privacySettings.dataSharing} onChange={(e) => handlePrivacyChange('dataSharing', e.target.checked)} className="accent-purple-400 w-[18px] h-[18px] cursor-pointer" />
              Allow anonymous data sharing for research insights
            </label>
            <label className="flex items-center gap-3 text-white/80 cursor-pointer">
              <input type="checkbox" checked={privacySettings.emailNotifications} onChange={(e) => handlePrivacyChange('emailNotifications', e.target.checked)} className="accent-purple-400 w-[18px] h-[18px] cursor-pointer" />
              Receive email notifications
            </label>
            <label className="flex items-center gap-3 text-white/80 cursor-pointer">
              <input type="checkbox" checked={privacySettings.projectUpdates} onChange={(e) => handlePrivacyChange('projectUpdates', e.target.checked)} className="accent-purple-400 w-[18px] h-[18px] cursor-pointer" />
              Receive project update notifications
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold text-white/90 m-0 mb-5">Additional Settings</h2>
          <div className="flex gap-4 flex-wrap">
            <button type="button" className="py-3 px-6 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer">
              Download Account Data
            </button>
            <button type="button" className="py-3 px-6 rounded-xl font-medium text-white bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-colors cursor-pointer">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
