import { Link } from "react-router-dom";
import GradientBackground from "../components/GradientBackground";

export default function Dashboard() {
  return (
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Volunteer Dashboard</h1>
      <p style={{ fontSize: "18px", color: "#555", marginBottom: "24px" }}>
        Contribute your machine&apos;s compute to research projects.
      </p>
      <Link
        to="/volunteer"
        style={{
          display: "inline-block",
          padding: "16px 32px",
          background: "black",
          color: "white",
          fontSize: "18px",
          textDecoration: "none",
          borderRadius: "8px",
        }}
      >
        Connect as worker
      </Link>
      <p style={{ marginTop: "24px", fontSize: "14px", color: "#666" }}>
        You need a user account (Sign up) and must run <code>RAY_ENABLE_WINDOWS_OR_OSX_CLUSTER=1 ray start --address=&lt;head_ip&gt;:6379</code> on this machine before connecting (required on macOS/Windows).
      </p>
      <div style={{ marginTop: "40px" }}>
        <Link to="/" style={{ fontSize: "18px", color: "black" }}>← Back to Home</Link>
      </div>
    </GradientBackground>
  );
}
