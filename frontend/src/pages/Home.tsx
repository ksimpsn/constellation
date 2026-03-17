import { Link } from "react-router-dom";
import { BigDipperBackground } from "../components/BigDipperBackground";
import FlowNav from "../components/FlowNav";

const isElectron = typeof window !== "undefined" && Boolean((window as unknown as { isElectron?: boolean }).isElectron);

export default function Home() {
  const [role, setRole] = useState<"researcher" | "volunteer" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const chooseRole = (r: "researcher" | "volunteer") => {
    setStoredRole(r);
    setRole(r);
  };

  const switchRole = () => {
    const next = role === "researcher" ? "volunteer" : "researcher";
    setStoredRole(next);
    setRole(next);
  };
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
      <BigDipperBackground scale={1.4} />
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
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

          <Link
            to="/why"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
          >
            <span>Why Constellation?</span>
            <span className="group-hover:translate-y-1 transition-transform duration-300">↓</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
