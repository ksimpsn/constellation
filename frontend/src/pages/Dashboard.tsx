import GradientBackground from "../components/GradientBackground";

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
          gap: "20px", // ⭐ spacing between the columns
        }}
      >
        <div style={card}>
          <h2 style={cardTitle}>In-Progress</h2>
          <ul style={list}>
            <li>Penn Planner — UI redesign</li>
            <li>AI Quiz Generator — LLM testing</li>
            <li>Constellation — dashboard layout</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Completed</h2>
          <ul style={list}>
            <li>Berlin Marathon Analytics</li>
            <li>Twitter Bot (Markov Chains)</li>
            <li>PTSD Detection Model</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={cardTitle}>Rewards</h2>
          <ul style={list}>
            <li>⭐ 10 project streak</li>
            <li>🎉 Finished 3 major builds</li>
            <li>🔥 Logged 50 coding sessions</li>
          </ul>
        </div>
      </div>
    </GradientBackground>
  );
}

const card = {
  width: "30%",
  height: "300px",
  background: "rgba(255,255,255,0.15)",
  borderRadius: "12px",
  backdropFilter: "blur(10px)",
  padding: "20px",
  color: "white",
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
