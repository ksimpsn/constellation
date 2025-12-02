import GradientBackground from "../components/GradientBackground";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <GradientBackground>

      <h1>My Dashboard</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          marginTop: "40px",
          gap: "20px",
        }}
      >
        <div style={card}>
          <h2 style={cardTitle}>In-Progress</h2>
          <ul style={list}>
            <li style={progressItem}>
              <Link to="/project/NeuroStream" style={linkStyle}>NeuroStream: Adaptive Modeling (60%)</Link>
              <div style={{...progressBar, width: '60%'}}></div>
            </li>
            <li style={progressItem}>
              <Link to="/project/HelixCompute" style={linkStyle}>HelixCompute: Task-Sharding (40%)</Link>
              <div style={{...progressBar, width: '40%'}}></div>
            </li>
            <li style={progressItem}>
              <Link to="/project/AuroraML" style={linkStyle}>AuroraML: Diagnostic Prediction (80%)</Link>
              <div style={{...progressBar, width: '80%'}}></div>
            </li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Completed</h2>
          <ul style={list}>
            <li style={progressItem}>
              <Link to="/project/Berlin Marathon Analytics" style={linkStyle}>Berlin Marathon Analytics (100%)</Link>
              <div style={{...completedProgressBar, width: '100%'}}></div>
            </li>
            <li style={progressItem}>
              <Link to="/project/Deep Learning Research" style={linkStyle}>Deep Learning Research (100%)</Link>
              <div style={{...completedProgressBar, width: '100%'}}></div>
            </li>
            <li style={progressItem}>
              <Link to="/project/PTSD Detection Model" style={linkStyle}>PTSD Detection Model (100%)</Link>
              <div style={{...completedProgressBar, width: '100%'}}></div>
            </li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Rewards</h2>
          <ul style={list}>
            <li style={rewardItem}>🏆 First project! </li>
            <li style={rewardItem}>🏆 Contributed to 1 major published paper</li>
            <li style={rewardItem}>🏆 Logged 50 sessions</li>
          </ul>
        </div>
      </div>
    </GradientBackground>
  );
}

const card: React.CSSProperties = {
  width: "30%",
  height: "300px",
  background: "rgba(255,255,255,0.15)",
  borderRadius: "12px",
  backdropFilter: "blur(10px)",
  padding: "20px",
  color: "black",
  overflowY: "auto", // ⭐ scroll if content grows
};

const cardTitle = {
  marginTop: 0,
  marginBottom: "12px",
  fontSize: "20px",
  fontWeight: "600",
};

const list = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  lineHeight: "1.6",
};

const rewardItem = {
  background: "rgba(255, 255, 255, 0.8)",
  padding: "8px 12px",
  marginBottom: "8px",
  borderRadius: "6px",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  fontSize: "16px",
};

const progressItem = {
  background: "rgba(255, 255, 255, 0.8)",
  padding: "8px 12px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  fontSize: "16px",
};

const progressBar = {
  height: "6px",
  background: "#2196F3",
  borderRadius: "3px",
  marginTop: "4px",
};

const completedProgressBar = {
  height: "6px",
  background: "#4CAF50",
  borderRadius: "3px",
  marginTop: "4px",
};

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
};
