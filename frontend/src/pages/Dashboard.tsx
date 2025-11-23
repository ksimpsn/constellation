import GradientBackground from "../components/GradientBackground";
import ProfileMenu from "../components/ProfileMenu";

export default function Dashboard() {
  return (
    <GradientBackground>
      <div style={{ alignSelf: "flex-end" }}>
              <ProfileMenu />
      </div>

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
