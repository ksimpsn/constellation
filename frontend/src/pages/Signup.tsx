import React, { useState } from 'react';
import GradientBackground from '../components/GradientBackground';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);

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
    try {
      const response = await fetch('http://localhost:5001/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, role, reasons }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Signup successful!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Check console for details.');
    }
  };

  return (
    <GradientBackground>
      <h1 style={{ fontSize: '48px', marginTop: '40px' }}>Sign Up for Constellation</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', width: '100%', marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ fontSize: '18px' }}>Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.8)', color: '#555' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ fontSize: '18px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.8)', color: '#555' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="role" style={{ fontSize: '18px' }}>Role:</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.8)', color: role === '' ? '#555' : 'black' }}
          >
            <option value="">Select your role</option>
            <option value="researcher">Researcher</option>
            <option value="contributor">Contributor</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '18px' }}>Why are you using Constellation? (Select all that apply)</label>
          <div style={{ marginTop: '10px' }}>
            {reasonOptions.map((reason) => (
              <div key={reason} style={{ marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  id={reason}
                  checked={reasons.includes(reason)}
                  onChange={() => handleReasonChange(reason)}
                  style={{ marginRight: '10px', background: 'rgba(255, 255, 255, 0.8)', accentColor: '#5a1d91' }}
                />
                <label htmlFor={reason} style={{ fontSize: '16px' }}>{reason}</label>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" style={{ padding: '14px 28px', background: 'black', color: 'white', fontSize: '18px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}>
          Sign Up
        </button>
      </form>
    </GradientBackground>
  );
};

export default Signup;
