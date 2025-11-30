import GradientBackground from "../components/GradientBackground";

export default function Why() {
  return (
    <GradientBackground>
      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          Home ↑
        </a>
      </div>
      <h1>Why Constellation?</h1>

      <div style={section}>Distributed computing is a model where many individual devices—laptops, desktops, and even phones—work together to solve large computational problems. Platforms like BOINC and Folding@home have shown how powerful this approach can be, enabling major breakthroughs in areas like protein folding and disease research. But these systems rely almost entirely on volunteer altruism, which limits participation and makes it difficult to maintain long-term, large-scale engagement outside of moments of global crisis.

Constellation builds on the strengths of these volunteer-driven platforms while addressing their core limitation: sustainability. By introducing a meaningful incentive structure, Constellation motivates broader and more consistent participation, transforming distributed computing from a niche volunteer effort into a scalable, dependable computing network.
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/security" style={{ fontSize: "18px", color: "black" }}>
          Privacy and Security Concerns ↓
        </a>
      </div>
    </GradientBackground>
  );
}

const section: React.CSSProperties= {
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
