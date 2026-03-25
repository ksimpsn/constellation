import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const location = useLocation();
  const navState = location.state as
    | { contributedProjectTitle?: string }
    | undefined;

  const contributedProjectTitle = navState?.contributedProjectTitle;

  const [inProgressProjectTitle, setInProgressProjectTitle] = useState<string | null>(null);
  const [inProgressProgress, setInProgressProgress] = useState<number>(0);
  const [completedProjectTitle, setCompletedProjectTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!contributedProjectTitle) return;

    // Start at 50%, then hit 100% and switch to Completed.
    setInProgressProjectTitle(contributedProjectTitle);
    setInProgressProgress(50);
    setCompletedProjectTitle(null);

    const t1 = window.setTimeout(() => {
      setInProgressProgress(75);
    }, 1000);

    const t2 = window.setTimeout(() => {
      setInProgressProgress(100);
      setCompletedProjectTitle(contributedProjectTitle);
      setInProgressProjectTitle(null);
    }, 2000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [contributedProjectTitle]);

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

        <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
          <div className="flex-[1.2] min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[280px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">In-Progress</h2>
            <ul className="list-none p-0 m-0 leading-relaxed">
              {inProgressProjectTitle ? (
                <li className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                  <Link
                    to={`/project/${encodeURIComponent(inProgressProjectTitle)}`}
                    state={{ progressOverride: inProgressProgress }}
                    className="text-white/90 no-underline hover:text-white block font-medium"
                  >
                    {inProgressProjectTitle} ({inProgressProgress}%)
                  </Link>
                  <div className="h-1.5 rounded bg-blue-400/80 mt-1" style={{ width: `${inProgressProgress}%` }} />
                </li>
              ) : (
                <li className="text-white/60 text-sm p-3 rounded-lg bg-white/5 border border-white/10">
                  No projects in progress right now.
                </li>
              )}
            </ul>
          </div>

          <div className="flex-[1.2] min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[280px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">Completed</h2>
            <ul className="list-none p-0 m-0 leading-relaxed">
              {completedProjectTitle ? (
                <li className="text-white/60 text-sm p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20 cursor-pointer">
                  <Link
                    to={`/project/${encodeURIComponent(completedProjectTitle)}`}
                    state={{ progressOverride: 100 }}
                    className="text-white/90 no-underline hover:text-white block"
                  >
                    {completedProjectTitle} (100%)
                  </Link>
                  <div className="h-1.5 rounded bg-emerald-400/80 mt-1 w-full" />
                </li>
              ) : (
                <li className="text-white/60 text-sm p-3 rounded-lg bg-white/5 border border-white/10">
                  Nothing completed yet.
                </li>
              )}
            </ul>
          </div>

          <div className="max-w-[13rem] mx-auto lg:mx-0 lg:w-52 lg:max-w-none shrink-0 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-visible">
            <h2 className="text-sm font-semibold text-white/90 mt-0 mb-3">Trophy Case</h2>
            <div className="space-y-0.5 pt-2">
              {/* Top shelf */}
              <div className="relative">
                <div className="flex justify-around items-end gap-1 pb-1 px-0">
                  <div className="group relative flex flex-col items-center">
                    <div className="w-8 h-8 flex items-center justify-center text-xl rounded-md bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:scale-105 hover:-translate-y-0.5 cursor-default">
                      🏆
                    </div>
                    <span className="text-[10px] text-white/60 mt-0.5">First Project</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 rounded-md bg-white/95 text-slate-800 text-xs font-medium max-w-[160px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      You completed your very first research contribution!
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-sm w-full" style={{ background: 'linear-gradient(180deg, rgba(139,90,43,0.6) 0%, rgba(92,64,51,0.8) 50%, rgba(60,40,20,0.9) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
