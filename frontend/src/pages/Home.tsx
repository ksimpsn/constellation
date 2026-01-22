import { BigDipperBackground } from "../components/BigDipperBackground";
import ProfileMenu from "../components/ProfileMenu";

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
      {/* Big Dipper Background */}
      <BigDipperBackground />

      {/* Sign Up Button */}
      <div className="absolute top-8 right-8 z-20">
        <a
          href="/signup"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          Sign Up
        </a>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/src/assets/logo.png"
            alt="Constellation Logo"
            className="h-16 w-auto"
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white/90 leading-tight text-center mb-6">
          Welcome to Constellation.
        </h1>

        <p className="text-xl md:text-2xl text-white/70 leading-relaxed text-center max-w-3xl mb-12">
          The center for democratizing large-scale computing.
        </p>

        <div className="flex flex-col items-center gap-6">
          {!isElectron && (
            <button
              onClick={downloadDesktopApp}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              Download Desktop App
            </button>
          )}

          {isElectron && (
            <button
              onClick={startLocalComputeNode}
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              Start Compute Node
            </button>
          )}

          <a
            href="/why"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
          >
            <span>Why Constellation?</span>
            <span className="group-hover:translate-y-1 transition-transform duration-300">↓</span>
          </a>
        </div>
      </div>
    </div>
  );
}
