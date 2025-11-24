import GradientBackground from "../components/GradientBackground";
import Navbar from "../components/Navbar";

export default function Security() {
  return (
    <GradientBackground>
      <div style={{ alignSelf: "flex-end" }}>
        <Navbar />
      </div>
      <h1>Privacy and Security Statements</h1>

      <div style={section}>Detailed Overview of Security</div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button
          style={{
            background: "black",
            color: "white",
            padding: "12px 28px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer"
          }}
        >
          Security Research
        </button>
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
