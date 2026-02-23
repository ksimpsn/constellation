import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen">
        <h1 className="text-4xl font-bold text-white/90 mb-10">My Dashboard</h1>

        <div className="mb-8">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/95 font-medium no-underline transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
          >
            Browse more projects
            <span className="text-lg" aria-hidden>→</span>
          </Link>
          <p className="text-white/60 text-sm mt-2">Find new research projects and contribute your CPU</p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between gap-6 w-full">
          <div className="flex-1 min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[300px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">In-Progress</h2>
            <ul className="list-none p-0 m-0 leading-relaxed">
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/NeuroStream" className="text-white/90 no-underline hover:text-white block">NeuroStream: Adaptive Modeling (60%)</Link>
                <div className="h-1.5 rounded bg-blue-400/80 mt-1" style={{ width: '60%' }} />
              </li>
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/HelixCompute" className="text-white/90 no-underline hover:text-white block">HelixCompute: Task-Sharding (40%)</Link>
                <div className="h-1.5 rounded bg-blue-400/80 mt-1" style={{ width: '40%' }} />
              </li>
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/AuroraML" className="text-white/90 no-underline hover:text-white block">AuroraML: Diagnostic Prediction (80%)</Link>
                <div className="h-1.5 rounded bg-blue-400/80 mt-1" style={{ width: '80%' }} />
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[300px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">Completed</h2>
            <ul className="list-none p-0 m-0 leading-relaxed">
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/Berlin Marathon Analytics" className="text-white/90 no-underline hover:text-white block">Berlin Marathon Analytics (100%)</Link>
                <div className="h-1.5 rounded bg-emerald-400/80 mt-1 w-full" />
              </li>
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/Deep Learning Research" className="text-white/90 no-underline hover:text-white block">Deep Learning Research (100%)</Link>
                <div className="h-1.5 rounded bg-emerald-400/80 mt-1 w-full" />
              </li>
              <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                <Link to="/project/PTSD Detection Model" className="text-white/90 no-underline hover:text-white block">PTSD Detection Model (100%)</Link>
                <div className="h-1.5 rounded bg-emerald-400/80 mt-1 w-full" />
              </li>
            </ul>
          </div>

          <div className="flex-1 min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-visible min-h-[300px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-4">Trophy Case</h2>
            <div className="space-y-1 pt-10">
              {/* Top shelf */}
              <div className="relative">
                <div className="flex justify-around items-end gap-4 pb-2 px-2">
                  <div className="group relative flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center text-3xl rounded-lg bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_28px_rgba(251,191,36,0.4)] hover:scale-110 hover:-translate-y-1 cursor-default">
                      🏆
                    </div>
                    <span className="text-xs text-white/60 mt-1.5">First Project</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-white/95 text-slate-800 text-sm font-medium max-w-[200px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      You completed your very first research contribution!
                    </div>
                  </div>
                  <div className="group relative flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center text-3xl rounded-lg bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_28px_rgba(251,191,36,0.4)] hover:scale-110 hover:-translate-y-1 cursor-default">
                      🏆
                    </div>
                    <span className="text-xs text-white/60 mt-1.5">Published</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-white/95 text-slate-800 text-sm font-medium max-w-[200px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      Your work was included in 1 major published paper
                    </div>
                  </div>
                </div>
                <div className="h-3 rounded-sm w-full" style={{ background: 'linear-gradient(180deg, rgba(139,90,43,0.6) 0%, rgba(92,64,51,0.8) 50%, rgba(60,40,20,0.9) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
              {/* Bottom shelf */}
              <div className="relative">
                <div className="flex justify-around items-end gap-4 pb-2 px-2">
                  <div className="group relative flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center text-3xl rounded-lg bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_28px_rgba(251,191,36,0.4)] hover:scale-110 hover:-translate-y-1 cursor-default">
                      🏆
                    </div>
                    <span className="text-xs text-white/60 mt-1.5">Dedicated</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-white/95 text-slate-800 text-sm font-medium max-w-[200px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      You logged 50 contribution sessions
                    </div>
                  </div>
                </div>
                <div className="h-3 rounded-sm w-full" style={{ background: 'linear-gradient(180deg, rgba(139,90,43,0.6) 0%, rgba(92,64,51,0.8) 50%, rgba(60,40,20,0.9) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
