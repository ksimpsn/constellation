import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import PageFooter from "../components/PageFooter";
import PageBackButton from "../components/PageBackButton";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";
import { hasVolunteerRole } from "../auth/session";

interface VolunteerProject {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  totalChunks: number;
  chunksCompleted: number;
  researcherName?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<VolunteerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    if (!hasVolunteerRole(user.role)) {
      setLoading(false);
      navigate("/researcher", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE_URL}/api/volunteer/${encodeURIComponent(user.user_id)}/projects`
        );
        if (!res.ok) {
          let detail = res.statusText;
          try {
            const body = await res.json();
            if (body?.error) detail = String(body.error);
          } catch {
            // ignore parse errors
          }
          throw new Error(detail || "Failed to load volunteer projects");
        }

        const data = await res.json();
        if (!cancelled) {
          const rows = Array.isArray(data?.projects) ? data.projects : [];
          setProjects(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load volunteer projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const inProgress = projects.filter((p) => (p.progress ?? 0) < 100);
  const completed = projects.filter((p) => (p.progress ?? 0) >= 100);

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen">
        <div className="mb-6">
          <PageBackButton />
        </div>
        <h1 className="text-4xl font-bold text-white/90 mb-10">My Volunteer Dashboard</h1>

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

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
          <div className="flex-[1.2] min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[280px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">In-Progress</h2>
            {loading ? (
              <p className="text-white/60 m-0">Loading projects...</p>
            ) : inProgress.length === 0 ? (
              <p className="text-white/60 m-0">No in-progress contributed projects yet.</p>
            ) : (
              <ul className="list-none p-0 m-0 leading-relaxed">
                {inProgress.map((project) => (
                  <li
                    key={project.id}
                    className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20"
                  >
                    <Link
                      to={`/project/${encodeURIComponent(project.id)}`}
                      className="text-white/90 no-underline hover:text-white block"
                    >
                      {project.title} ({project.progress}%)
                    </Link>
                    {project.researcherName ? (
                      <p className="text-xs text-white/60 mt-1 mb-1.5">Researcher: {project.researcherName}</p>
                    ) : null}
                    <div
                      className="h-1.5 rounded bg-blue-400/80 mt-1"
                      style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex-[1.2] min-w-0 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-y-auto min-h-[280px]">
            <h2 className="text-xl font-semibold text-white/90 mt-0 mb-3">Completed</h2>
            {loading ? (
              <p className="text-white/60 m-0">Loading projects...</p>
            ) : completed.length === 0 ? (
              <p className="text-white/60 m-0">No completed contributed projects yet.</p>
            ) : (
              <ul className="list-none p-0 m-0 leading-relaxed">
                {completed.map((project) => (
                  <li
                    key={project.id}
                    className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20"
                  >
                    <Link
                      to={`/project/${encodeURIComponent(project.id)}`}
                      className="text-white/90 no-underline hover:text-white block"
                    >
                      {project.title} (100%)
                    </Link>
                    {project.researcherName ? (
                      <p className="text-xs text-white/60 mt-1 mb-1.5">Researcher: {project.researcherName}</p>
                    ) : null}
                    <div className="h-1.5 rounded bg-emerald-400/80 mt-1 w-full" />
                  </li>
                ))}
              </ul>
            )}
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
                  <div className="group relative flex flex-col items-center">
                    <div className="w-8 h-8 flex items-center justify-center text-xl rounded-md bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:scale-105 hover:-translate-y-0.5 cursor-default">
                      🏆
                    </div>
                    <span className="text-[10px] text-white/60 mt-0.5">Published</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 rounded-md bg-white/95 text-slate-800 text-xs font-medium max-w-[160px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      Your work was included in 1 major published paper
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-sm w-full" style={{ background: 'linear-gradient(180deg, rgba(139,90,43,0.6) 0%, rgba(92,64,51,0.8) 50%, rgba(60,40,20,0.9) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
              {/* Bottom shelf */}
              <div className="relative">
                <div className="flex justify-around items-end gap-1 pb-1 px-0">
                  <div className="group relative flex flex-col items-center">
                    <div className="w-8 h-8 flex items-center justify-center text-xl rounded-md bg-amber-500/20 border border-amber-400/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:scale-105 hover:-translate-y-0.5 cursor-default">
                      🏆
                    </div>
                    <span className="text-[10px] text-white/60 mt-0.5">Dedicated</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 rounded-md bg-white/95 text-slate-800 text-xs font-medium max-w-[160px] text-center opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10 shadow-lg">
                      You logged 50 contribution sessions
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-sm w-full" style={{ background: 'linear-gradient(180deg, rgba(139,90,43,0.6) 0%, rgba(92,64,51,0.8) 50%, rgba(60,40,20,0.9) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
          </div>
        </div>

        <PageFooter className="w-full" />
      </div>
    </ConstellationStarfieldBackground>
  );
}
