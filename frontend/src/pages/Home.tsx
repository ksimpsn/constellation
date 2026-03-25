import { Link } from "react-router-dom";
import { BigDipperBackground } from "../components/BigDipperBackground";
import FlowNav from "../components/FlowNav";

const isElectron = typeof window !== "undefined" && Boolean((window as unknown as { isElectron?: boolean }).isElectron);

/** Keeps subtitle readable on bright stars without a background plate */
const subtitleReadable = {
  WebkitTextStroke: "0.35px rgba(15, 23, 42, 0.55)",
  textShadow:
    "0 1px 2px rgba(0,0,0,0.85), 0 2px 14px rgba(0,0,0,0.55), 0 0 24px rgba(15,23,42,0.65)",
} as const;

const subtitleReadableStrong = {
  WebkitTextStroke: "0.4px rgba(15, 23, 42, 0.5)",
  textShadow:
    "0 1px 2px rgba(0,0,0,0.9), 0 2px 16px rgba(0,0,0,0.6), 0 0 28px rgba(15,23,42,0.7)",
} as const;

export default function Home() {
  const startLocalComputeNode = () => {
    // later: IPC call into Electron / Node to start worker, etc.
    console.log("Starting local compute node...");
  };
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
      <BigDipperBackground scale={1.4} />
      <FlowNav />
      <div className="relative z-10 flex flex-col min-h-screen px-5 sm:px-8 pt-20 pb-24">
        <div className="flex flex-1 flex-col items-center justify-center antialiased">
          <div className="w-full max-w-[40rem] md:max-w-[44rem] mx-auto text-center">
            <h1 className="m-0 font-bold text-white tracking-tight text-balance">
              <span className="block text-[clamp(1.125rem,2.5vw,1.375rem)] font-medium text-white/55 leading-snug mb-2 md:mb-3">
                Welcome to
              </span>
              <span
                className="block text-[clamp(3.35rem,12vw,6.75rem)] leading-[1.02] text-white"
                style={{
                  textShadow:
                    "0 0 80px rgba(255,255,255,0.12), 0 2px 1px rgba(0,0,0,0.2)",
                }}
              >
                Constellation.
              </span>
            </h1>

            <div className="w-full min-w-0 mt-7 md:mt-9 mb-10 md:mb-12 flex justify-center">
              <div className="max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain [scrollbar-width:thin]">
                <div className="flex flex-col gap-1 items-center text-center text-base sm:text-lg md:text-xl leading-tight w-max max-w-none mx-auto px-1">
                  <p
                    className="m-0 py-0.5 font-medium text-white/[0.93] whitespace-nowrap [paint-order:stroke_fill]"
                    style={subtitleReadable}
                  >
                    The world&apos;s biggest supercomputer already exists.
                  </p>
                  <p
                    className="m-0 py-0.5 font-medium text-white/[0.93] whitespace-nowrap [paint-order:stroke_fill]"
                    style={subtitleReadable}
                  >
                    It&apos;s scattered across billions of pockets and desks.
                  </p>
                  <p
                    className="m-0 py-0.5 font-semibold text-white whitespace-nowrap [paint-order:stroke_fill]"
                    style={subtitleReadableStrong}
                  >
                    We&apos;re turning it on.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-sm sm:max-w-none">
            {!isElectron && (
              <Link
                to="/login"
                className="w-full sm:w-auto min-w-[12rem] px-8 py-3.5 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 text-white text-[0.9375rem] font-semibold tracking-wide hover:bg-white/18 hover:border-white/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] no-underline text-center shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
              >
                Join us
              </Link>
            )}

            {isElectron && (
              <button
                type="button"
                onClick={startLocalComputeNode}
                className="w-full sm:w-auto min-w-[12rem] px-8 py-3.5 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 text-white text-[0.9375rem] font-semibold tracking-wide hover:bg-white/18 hover:border-white/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
              >
                Start Compute Node
              </button>
            )}

            <Link
              to="/why"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/15 text-white/85 text-[0.9375rem] font-medium tracking-wide hover:text-white hover:bg-white/12 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group no-underline shadow-[0_2px_16px_rgba(0,0,0,0.2)]"
            >
              <span>Why Constellation?</span>
              <span className="text-white/70 group-hover:translate-y-0.5 transition-transform duration-300" aria-hidden>
                ↓
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
