import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GradientBackground from "../components/GradientBackground";
import { getStoredRole, setStoredRole } from "../api/config";

const isElectron = typeof window !== "undefined" && Boolean((window as unknown as { isElectron?: boolean }).isElectron);

export default function Home() {
  const [role, setRole] = useState<"researcher" | "volunteer" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const chooseRole = (r: "researcher" | "volunteer") => {
    setStoredRole(r);
    setRole(r);
  };

  const switchRole = () => {
    const next = role === "researcher" ? "volunteer" : "researcher";
    setStoredRole(next);
    setRole(next);
  };

  // No role chosen yet: show role selection
  if (role === null) {
    return (
      <GradientBackground>
        <h1 style={{ fontSize: "48px", marginTop: "40px" }}>
          Welcome to Constellation
        </h1>
        <p style={{ fontSize: "22px", color: "#555", marginTop: "12px" }}>
          Choose how you want to use the platform.
        </p>
        <div style={{ display: "flex", gap: "20px", marginTop: "40px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => chooseRole("researcher")}
            style={{
              padding: "20px 36px",
              background: "black",
              color: "white",
              fontSize: "18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            I'm a Researcher
          </button>
          <button
            onClick={() => chooseRole("volunteer")}
            style={{
              padding: "20px 36px",
              background: "white",
              color: "black",
              fontSize: "18px",
              border: "2px solid black",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            I'm a Volunteer
          </button>
        </div>
        <p style={{ marginTop: "24px", fontSize: "14px", color: "#666" }}>
          Researchers upload projects and monitor runs. Volunteers contribute compute by connecting as workers.
        </p>
        <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
          <Link to="/why" style={{ fontSize: "18px", color: "black" }}>
            Why Constellation? ↓
          </Link>
        </div>
      </GradientBackground>
    );
  }

  // Researcher home
  if (role === "researcher") {
    return (
      <GradientBackground>
        <h1 style={{ fontSize: "48px", marginTop: "40px" }}>
          Researcher Home
        </h1>
        <p style={{ fontSize: "22px", color: "#555" }}>
          Upload projects, monitor runs, and download results.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px", alignItems: "center" }}>
          <Link
            to="/submit"
            style={{
              padding: "16px 32px",
              background: "black",
              color: "white",
              fontSize: "18px",
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            Submit a Project
          </Link>
          <Link
            to="/researcher"
            style={{
              padding: "16px 32px",
              background: "white",
              color: "black",
              fontSize: "18px",
              textDecoration: "none",
              borderRadius: "8px",
              border: "2px solid black",
            }}
          >
            My Projects & Dashboard
          </Link>
        </div>
        <button
          onClick={switchRole}
          style={{
            marginTop: "32px",
            padding: "8px 16px",
            background: "transparent",
            color: "#555",
            fontSize: "14px",
            border: "1px solid #999",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Switch to Volunteer
        </button>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          <Link to="/settings" style={{ fontSize: "16px", color: "#555" }}>Settings (API URL)</Link>
          {" · "}
          <Link to="/signup" style={{ fontSize: "16px", color: "#555" }}>Sign up</Link>
        </div>
      </GradientBackground>
    );
  }

  // Volunteer home
  return (
    <GradientBackground>
      <h1 style={{ fontSize: "48px", marginTop: "40px" }}>
        Volunteer Home
      </h1>
      <p style={{ fontSize: "22px", color: "#555" }}>
        Connect your machine as a worker to contribute compute.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px", alignItems: "center" }}>
        <Link
          to="/volunteer"
          style={{
            padding: "16px 32px",
            background: "black",
            color: "white",
            fontSize: "18px",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          Connect as Worker
        </Link>
      </div>
      <button
        onClick={switchRole}
        style={{
          marginTop: "32px",
          padding: "8px 16px",
          background: "transparent",
          color: "#555",
          fontSize: "14px",
          border: "1px solid #999",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Switch to Researcher
      </button>
      <div style={{ marginTop: "auto", textAlign: "center" }}>
        <Link to="/settings" style={{ fontSize: "16px", color: "#555" }}>Settings (API URL)</Link>
        {" · "}
        <Link to="/signup" style={{ fontSize: "16px", color: "#555" }}>Sign up</Link>
      </div>
    </GradientBackground>
  );
}
