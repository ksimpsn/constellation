<<<<<<< HEAD
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
        setMessage(`Cannot connect to server. Please make sure the backend is running on ${API_BASE_URL}`);
      } else {
        setMessage(`Signup failed: ${error.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
=======
import React, { useState } from "react";
import GradientBackground from "../components/GradientBackground";
import { getApiUrl } from "../api/config";

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<string>("volunteer");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!fullName.trim() || !email.trim() || !userId.trim()) {
      setMessage("Please fill in name, email, and user ID.");
      return;
    }
    const base = getApiUrl();
    try {
      const response = await fetch(`${base}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          user_id: userId.trim(),
          role: role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setMessage(`Account created. Your user ID is: ${data.user_id}`);
      } else {
        setMessage(data.error || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Signup failed. Check the API URL in Settings and try again.");
>>>>>>> annabella/result-verification
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
<<<<<<< HEAD
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
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
=======
    <GradientBackground>
      <h1 style={{ fontSize: "48px", marginTop: "40px" }}>Sign Up for Constellation</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: "600px", width: "100%", marginTop: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="fullName" style={{ fontSize: "18px" }}>Full name</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px", background: "rgba(255,255,255,0.9)", color: "#333" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ fontSize: "18px" }}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px", background: "rgba(255,255,255,0.9)", color: "#333" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="userId" style={{ fontSize: "18px" }}>User ID (unique; e.g. username)</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="e.g. jane-smith"
            style={{ width: "100%", padding: "10px", marginTop: "5px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px", background: "rgba(255,255,255,0.9)", color: "#333" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="role" style={{ fontSize: "18px" }}>Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "5px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "4px", background: "rgba(255,255,255,0.9)", color: "#333" }}
          >
            <option value="researcher">Researcher</option>
            <option value="volunteer">Volunteer</option>
            <option value="researcher,volunteer">Both (researcher and volunteer)</option>
          </select>
        </div>
        {message && (
          <p style={{ marginBottom: "12px", color: success ? "#2e7d32" : "#c00" }}>{message}</p>
        )}
        <button type="submit" style={{ padding: "14px 28px", background: "black", color: "white", fontSize: "18px", border: "none", borderRadius: "6px", cursor: "pointer", marginTop: "8px" }}>
          Sign up
        </button>
      </form>
      <p style={{ marginTop: "20px", fontSize: "14px", color: "#555" }}>
        API: {getApiUrl()} — change in <a href="/settings" style={{ color: "black" }}>Settings</a> if needed.
      </p>
      <div style={{ marginTop: "24px" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>← Back to Home</a>
      </div>
    </GradientBackground>
>>>>>>> annabella/result-verification
  );
};

export default Signup;
