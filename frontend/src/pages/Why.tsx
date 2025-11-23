import GradientBackground from "../components/GradientBackground";
import ProfileMenu from "../components/ProfileMenu";

export default function Why() {
  return (
    <GradientBackground>
      <div style={{ alignSelf: "flex-end" }}>
        <ProfileMenu />
      </div>
      <h1>Why Constellation?</h1>

      <div style={section}>Detailed overview of Constellation</div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <a href="/security">Privacy and Security Concerns? ↓</a>
      </div>
    </GradientBackground>
  );
}

const section = {
  height: "350px",
  background: "#eee",
  borderRadius: "8px",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#555",
  fontSize: "20px"
};
