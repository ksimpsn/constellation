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



// CSS Animations (we'll add these to a style tag or CSS file)
const styles = `
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(90deg); }
  50% { transform: translateY(-5px) rotate(180deg); }
  75% { transform: translateY(-15px) rotate(270deg); }
}

@keyframes fadeInScale {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes aiGlow {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

@keyframes aiPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); box-shadow: 0 0 15px #FFD700, 0 0 30px #FFD700; }
  50% { transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 35px #FFD700, 0 0 70px #FFD700; }
}

@keyframes titleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes constellationGlow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)); }
}

@keyframes floatOrb1 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-20px) translateX(15px); }
  50% { transform: translateY(-10px) translateX(30px); }
  75% { transform: translateY(-30px) translateX(15px); }
}

@keyframes floatOrb2 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-25px) translateX(-20px); }
  66% { transform: translateY(-15px) translateX(-40px); }
}

@keyframes floatOrb3 {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  20% { transform: translateY(-15px) translateX(25px); }
  40% { transform: translateY(-30px) translateX(10px); }
  60% { transform: translateY(-20px) translateX(35px); }
  80% { transform: translateY(-35px) translateX(20px); }
}

@keyframes cardFadeIn {
  0% { opacity: 0; transform: translateY(50px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0px) scale(1); }
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

.text-card:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  backdrop-filter: blur(15px) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
}

.nav-link:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(255, 255, 255, 0.15);
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(255, 215, 0, 0.4);
}

.secondary-button:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
