import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';
import PageBackButton from '../components/PageBackButton';

import { API_BASE_URL } from "../api/config";
import { useAuth } from '../context/AuthContext';
import { getPostAuthRedirectPath } from '../auth/session';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wantResearcher, setWantResearcher] = useState(false);
  const [wantVolunteer, setWantVolunteer] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const reasonOptions = [
    'Collaborate on research projects',
    'Share knowledge and insights',
    'Find contributors for my work',
    'Discover new research opportunities',
    'Network with other researchers'
  ];

  const handleReasonChange = (reason: string) => {
    setReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wantResearcher && !wantVolunteer) {
      setMessage('Error: Select at least one role (Researcher and/or Volunteer).');
      return;
    }
    if (password.length < 8) {
      setMessage('Error: Password should be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Error: Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');

    const roles: string[] = [];
    if (wantResearcher) roles.push('researcher');
    if (wantVolunteer) roles.push('volunteer');

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, roles, reasons, password }),
      });

      if (!response.ok) {
        // Try to parse error message
        let errorMsg = 'Signup failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = `Server error (${response.status})`;
        }
        setMessage(`Error: ${errorMsg}`);
        return;
      }

      const data = await response.json();
      login({
        user_id: data.user_id,
        email: data.email,
        name,
        role: data.role,
      });
      setMessage('Signup successful! Redirecting...');
      setTimeout(() => {
        navigate(getPostAuthRedirectPath(data.role));
      }, 1500);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      const err = error as { message?: string; name?: string };
      // Check if it's a network error (backend not running)
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        setMessage(`Cannot connect to server. Please make sure the backend is running on ${API_BASE_URL}`);
      } else {
        setMessage(`Error: ${err.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '6px',
    fontSize: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
  } as const;

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24 w-full">
        <div className="w-full max-w-[600px] mb-6 self-center">
          <PageBackButton />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white/90 mb-8">Sign Up for Constellation</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-[600px] p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="mb-5">
            <label htmlFor="name" className="text-white/80 text-sm font-medium">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="Your name"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="text-white/80 text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="password" className="text-white/80 text-sm font-medium">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <p className="text-white/50 text-xs mt-2 m-0">
              Choose a password you’ll use to sign in. Use at least 8 characters.
            </p>
          </div>
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </div>
          <div className="mb-5">
            <span className="text-white/80 text-sm font-medium block mb-2">Roles (select all that apply)</span>
            <p className="text-white/50 text-xs m-0 mb-3">
              You can post projects as a researcher, contribute compute as a volunteer, or both. You can add another role later in Settings.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantResearcher}
                  onChange={() => setWantResearcher((v) => !v)}
                  className="accent-purple-400"
                />
                <span>Researcher — submit and manage projects</span>
              </label>
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantVolunteer}
                  onChange={() => setWantVolunteer((v) => !v)}
                  className="accent-purple-400"
                />
                <span>Volunteer — browse and run tasks for projects</span>
              </label>
            </div>
          </div>
          <div className="mb-6">
            <label className="text-white/80 text-sm font-medium block mb-2">Why are you using Constellation? (Select all that apply)</label>
            <div className="space-y-2">
              {reasonOptions.map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reasons.includes(reason)}
                    onChange={() => handleReasonChange(reason)}
                    className="accent-purple-400"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>

          {message && (
            <div
              className="mt-4 p-3 rounded-lg text-center text-sm"
              style={{
                backgroundColor: message.includes('Error') ? 'rgba(254, 226, 226, 0.2)' : 'rgba(236, 253, 245, 0.2)',
                color: message.includes('Error') ? '#fca5a5' : '#86efac',
              }}
            >
              {message}
            </div>
          )}
        </form>

        <p className="mt-8 text-white/60 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-white/90 hover:text-white font-medium underline">
            Log In
          </Link>
        </p>
      </div>
    </ConstellationStarfieldBackground>
  );
};

export default Signup;
