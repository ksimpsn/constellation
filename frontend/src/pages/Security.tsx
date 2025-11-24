import GradientBackground from "../components/GradientBackground";

export default function Security() {
  return (
    <GradientBackground>
      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/why" style={{ fontSize: "18px", color: "black" }}>
          Why Constellation? ↑
        </a>
      </div>
      <h1>Privacy and Security Statements</h1>

      <div style={section}>Constellation is built with privacy and security as core design principles. When a user chooses to volunteer their computing power, their personal information, identity, and browsing data remain fully protected — the platform never collects or exposes anything beyond what is strictly necessary for computation. All third-party projects run inside secure, sandboxed environments, ensuring that no harmful code, malware, or unauthorized processes can ever access your device. Distributed systems have a long history of being safe and effective when implemented correctly, and Constellation strengthens this model with modern security practices, continuous verification, and strict isolation between tasks. You can contribute to scientific and technological progress without ever compromising your privacy or the safety of your machine.</div>

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

const section: React.CSSProperties = {
  height: "350px",
  background: "transparent",
  borderRadius: "8px",
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "black",
  fontSize: "20px",
  overflowY: "auto",
  overflowX: "hidden",
};
