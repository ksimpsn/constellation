import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // Try to parse error message
        let errorMsg = 'Login failed';
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
      setMessage('Login successful! Redirecting...');
      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'researcher') {
          navigate('/researcher-profile');
        } else {
          navigate('/profile');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Login error:', error);
      // Check if it's a network error (backend not running)
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setMessage(`Cannot connect to server. Please make sure the backend is running on ${API_BASE_URL}`);
      } else {
        setMessage(`Login failed: ${error.message || 'Please try again'}`);
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-white/90 mb-8">Log In to Constellation</h1>
        <form onSubmit={handleSubmit} className="w-full max-w-[600px] p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="mb-5">
            <label htmlFor="username" className="text-white/80 text-sm font-medium">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
              placeholder="Enter your username"
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
              style={inputStyle}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-white/20 hover:bg-white/30 border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging In...' : 'Log In'}
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
          Don't have an account?{' '}
          <Link to="/signup" className="text-white/90 hover:text-white font-medium underline">
            Sign Up
          </Link>
        </p>
      </div>
    </ConstellationStarfieldBackground>
  );
};

export default Login;
