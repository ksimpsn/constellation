import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GradientBackground from '../components/GradientBackground';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email }),
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
        setMessage('Cannot connect to server. Please make sure the backend is running on http://localhost:5001');
      } else {
        setMessage(`Login failed: ${error.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <h1 style={{ fontSize: '48px', marginTop: '40px' }}>Log In to Constellation</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', width: '100%', marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ fontSize: '18px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.8)', color: '#555' }}
            placeholder="Enter your email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 28px',
            background: loading ? '#999' : 'black',
            color: 'white',
            fontSize: '18px',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '20px',
            width: '100%'
          }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>

        {message && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: message.includes('Error') ? '#fee' : '#efe',
            color: message.includes('Error') ? '#c33' : '#3c3',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </form>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#667eea', fontWeight: 'bold', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </GradientBackground>
  );
};

export default Login;
