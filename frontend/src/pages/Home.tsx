import GradientBackground from "../components/GradientBackground";

const isElectron = typeof window !== "undefined" && Boolean(window.isElectron);

export default function Home() {
  const downloadDesktopApp = () => {
    const isMac = navigator.userAgent.includes("Mac");
    const isWindows = navigator.userAgent.includes("Win");

    const url = isMac
      ? "/downloads/constellation-mac.dmg"
      : isWindows
      ? "/downloads/constellation-win.exe"
      : "/downloads/constellation-appimage";

    window.location.href = url;
    setTimeout(() => {
      window.location.href = "constellation://open";
    }, 2000);
  };
  const startLocalComputeNode = () => {
    // later: IPC call into Electron / Node to start worker, etc.
    console.log("Starting local compute node...");
  };
  return (
    <GradientBackground>

      <h1 style={{ fontSize: "48px", marginTop: "40px" }}>
        Welcome to Constellation.
      </h1>

      <p style={{ fontSize: "22px", color: "#555" }}>
        The center for democratizing large-scale computing.
      </p>

      {!isElectron && (
      <button
          onClick={downloadDesktopApp}
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
          Download Desktop App
        </button>
      )}

{isElectron && (
        <button
          onClick={startLocalComputeNode}
          style={{
            marginTop: "30px",
            padding: "14px 28px",
            background: "black",
            color: "white",
            fontSize: "18px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Start Compute Node
      </button>
      )}

      <div style={{ marginTop: "auto", textAlign: "center", alignSelf: "center" }}>
        <a href="/why" style={{ fontSize: "18px", color: "black" }}>
          Why Constellation? ↓
        </a>
      </div>
    </GradientBackground>
  );
}
