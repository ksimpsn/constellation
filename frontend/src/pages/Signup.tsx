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
    }
  };

  return (
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
  );
};

export default Signup;
