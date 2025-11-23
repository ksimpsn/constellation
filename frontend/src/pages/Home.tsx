import GradientBackground from "../components/GradientBackground";
import ProfileMenu from "../components/ProfileMenu";

export default function Home() {
  return (
    <GradientBackground>
      <div style={{ alignSelf: "flex-end" }}>
        <ProfileMenu />
      </div>

      <h1 style={{ fontSize: "48px", marginTop: "40px" }}>
        Welcome to Constellation.
      </h1>

      <p style={{ fontSize: "22px", color: "#555" }}>
        The center for democratizing large-scale computing.
      </p>

      <button
        style={{
          marginTop: "30px",
          padding: "14px 28px",
          background: "black",
          color: "white",
          fontSize: "18px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        Sign Up Here
      </button>

      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/why" style={{ fontSize: "18px", color: "black" }}>
          Why Constellation? ↓
        </a>
      </div>
    </GradientBackground>
  );
}
