<<<<<<< HEAD
import { Link } from "react-router-dom";
import { BigDipperBackground } from "../components/BigDipperBackground";
import FlowNav from "../components/FlowNav";
=======
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GradientBackground from "../components/GradientBackground";
import { getStoredRole, setStoredRole } from "../api/config";
>>>>>>> annabella/result-verification

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
<<<<<<< HEAD
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
      <BigDipperBackground scale={1.4} />
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <h1 className="text-5xl md:text-7xl font-bold text-white/90 leading-tight text-center mb-6">
          Welcome to Constellation.
        </h1>

        <p className="text-xl md:text-2xl text-white/70 leading-relaxed text-center max-w-3xl mb-12">
          The center for democratizing large-scale computing.
        </p>

        <div className="flex flex-col items-center gap-6">
          {!isElectron && (
            <button
              onClick={downloadDesktopApp}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              Download Desktop App
            </button>
          )}

          {isElectron && (
            <button
              onClick={startLocalComputeNode}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              Start Compute Node
            </button>
          )}

          <Link
            to="/why"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
          >
            <span>Why Constellation?</span>
            <span className="group-hover:translate-y-1 transition-transform duration-300">↓</span>
          </Link>
        </div>
=======

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
>>>>>>> annabella/result-verification
      </div>
    </div>
  );
}
