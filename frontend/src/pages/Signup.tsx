import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, role, reasons }),
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
      setMessage('Signup successful! Redirecting...');
      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'researcher') {
          navigate('/researcher-profile');
        } else {
          navigate('/profile');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Signup error:', error);
      // Check if it's a network error (backend not running)
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setMessage('Cannot connect to server. Please make sure the backend is running on http://localhost:5001');
      } else {
        setMessage(`Signup failed: ${error.message || 'Please try again'}`);
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
      {/* Top bar - logo and Log In */}
      <div className="absolute top-8 left-8 z-20">
        <Link to="/" className="block w-[60px] h-[60px] opacity-90 hover:opacity-100 transition-opacity">
          <img src="/src/assets/logo.png" alt="Constellation Home" className="w-full h-full object-contain" />
        </Link>
      </div>
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
        <Link
          to="/login"
          className="text-white/60 hover:text-white/90 transition-colors text-lg"
          title="Log in"
        >
          Log In
        </Link>
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/src/assets/logo.png" alt="Constellation Logo" className="h-10 w-auto" />
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-24">
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
            <label htmlFor="role" className="text-white/80 text-sm font-medium">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{ ...inputStyle, color: role ? 'white' : 'rgba(255,255,255,0.5)' }}
            >
              <option value="">Select your role</option>
              <option value="researcher">Researcher</option>
              <option value="contributor">Contributor</option>
            </select>
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
