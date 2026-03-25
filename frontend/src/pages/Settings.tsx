import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';
import PageBackButton from '../components/PageBackButton';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';
import { hasResearcherRole, hasVolunteerRole } from '../auth/session';

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
  const location = useLocation();
  const submitRequiresResearcher = Boolean(
    (location.state as { submitRequiresResearcher?: boolean } | null)?.submitRequiresResearcher,
  );
  const { user, login } = useAuth();
  const [wantResearcher, setWantResearcher] = useState(false);
  const [wantVolunteer, setWantVolunteer] = useState(false);
  const [rolesMessage, setRolesMessage] = useState('');
  const [rolesSaving, setRolesSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setWantResearcher(hasResearcherRole(user.role));
    setWantVolunteer(hasVolunteerRole(user.role));
  }, [user?.user_id, user?.role]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleRolesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!wantResearcher && !wantVolunteer) {
      setRolesMessage('Select at least one role.');
      return;
    }
    setRolesSaving(true);
    setRolesMessage('');
    const roles: string[] = [];
    if (wantResearcher) roles.push('researcher');
    if (wantVolunteer) roles.push('volunteer');
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, roles }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setRolesMessage(data.error || `Update failed (${response.status})`);
        return;
      }
      login({
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role,
      });
      setRolesMessage('Roles updated.');
    } catch {
      setRolesMessage(`Could not reach server at ${API_BASE_URL}`);
    } finally {
      setRolesSaving(false);
    }
  };

  const handlePrivacyChange = (setting: keyof typeof privacySettings, value: string | boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-[800px] mx-auto w-full flex flex-col gap-8">
        <div>
          <PageBackButton />
        </div>
        <h1 className="text-4xl font-bold text-white/90 mb-2 text-center">Account Settings</h1>

        {submitRequiresResearcher && user && (
          <p className="text-amber-200/90 text-sm text-center m-0 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400/25">
            Submitting projects requires the researcher role. Enable <strong className="text-white/95">Researcher</strong> below, save, then open Submit a project from the menu (researcher view).
          </p>
        )}

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
          <h2 className="text-xl font-bold text-white/90 m-0 mb-5">Account roles</h2>
          {!user ? (
            <p className="text-white/60 m-0">Sign in to change your roles.</p>
          ) : (
            <form onSubmit={handleRolesSave} className="flex flex-col gap-5">
              <p className="text-white/55 text-sm m-0">
                Choose every role you want on this account. You need at least one. If you have both, use the menu to switch between researcher and volunteer experiences.
              </p>
              <label className="flex items-center gap-3 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantResearcher}
                  onChange={() => setWantResearcher((v) => !v)}
                  className="accent-purple-400 w-[18px] h-[18px] cursor-pointer"
                />
                Researcher
              </label>
              <label className="flex items-center gap-3 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantVolunteer}
                  onChange={() => setWantVolunteer((v) => !v)}
                  className="accent-purple-400 w-[18px] h-[18px] cursor-pointer"
                />
                Volunteer
              </label>
              <button
                type="submit"
                disabled={rolesSaving}
                className="w-fit py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {rolesSaving ? 'Saving…' : 'Save roles'}
              </button>
              {rolesMessage && (
                <p className={`text-sm m-0 ${rolesMessage.includes('failed') || rolesMessage.includes('Select') || rolesMessage.includes('Could not') ? 'text-red-300' : 'text-emerald-300'}`}>
                  {rolesMessage}
                </p>
              )}
            </form>
          )}
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
