import GradientBackground from "../components/GradientBackground";

export default function Dashboard() {
  return (
    <GradientBackground>

      <h1>My Dashboard</h1>

      <div style={{ display: "flex", gap: "40px", marginTop: "40px" }}>
        <div style={card}>In-Progress Projects</div>
        <div style={card}>Completed Projects</div>
        <div style={card}>Rewards</div>
      </div>
    </GradientBackground>
  );
}

const card = {
  width: "250px",
  height: "300px",
  background: "#ddd",
  borderRadius: "8px"
};
