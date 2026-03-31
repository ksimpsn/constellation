import { useEffect, useMemo, useState } from "react";
import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import PageBackButton from "../components/PageBackButton";
import { API_BASE_URL } from "../api/config";

type Contributor = { username: string; value: number };

type WorkerApiRow = {
  worker_id?: string;
  user_id?: string;
  worker_name?: string;
  tasks_completed?: number;
  cpu_cores?: number;
};

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export default function Leaderboard() {
  const [workers, setWorkers] = useState<WorkerApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/workers`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { workers?: WorkerApiRow[] }) => {
        if (cancelled) return;
        setWorkers(Array.isArray(data?.workers) ? data.workers : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load workers";
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const aggregates = useMemo(() => {
    const byVolunteer = new Map<string, { username: string; projects: number; cores: number }>();
    for (const w of workers) {
      const key = (w.user_id || w.worker_name || w.worker_id || "").trim();
      if (!key) continue;
      const username = (w.worker_name || w.user_id || w.worker_id || "Volunteer").trim();
      const prev = byVolunteer.get(key) || { username, projects: 0, cores: 0 };
      prev.projects += Number(w.tasks_completed || 0);
      prev.cores = Math.max(prev.cores, Number(w.cpu_cores || 0));
      byVolunteer.set(key, prev);
    }
    return Array.from(byVolunteer.values());
  }, [workers]);

  const baseProjects = useMemo(
    () =>
      aggregates
        .map((v) => ({ username: v.username, value: v.projects }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [aggregates]
  );

  const allZeroProjects = baseProjects.length > 0 && baseProjects.every((x) => x.value === 0);
  const mostProjects = useMemo(
    () => (allZeroProjects ? shuffled(baseProjects) : baseProjects),
    [allZeroProjects, baseProjects]
  );

  const mostCompute = useMemo(
    () =>
      aggregates
        .map((v) => ({ username: v.username, value: v.cores }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [aggregates]
  );

  const mostTime = useMemo(
    () =>
      aggregates
        .map((v) => ({ username: v.username, value: v.projects }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [aggregates]
  );

  const formatValue = (value: number, type: string) => {
    if (type === "compute") return `${value} cores`;
    if (type === "time") return `${value} tasks`;
    return `${value} projects`;
  };

  const ContributorList = ({
    contributors,
    title,
    valueType,
    accentColor,
  }: {
    contributors: Array<{ username: string; value: number }>;
    title: string;
    valueType: string;
    accentColor: string;
  }) => (
    <div className="flex-1 min-w-[320px] max-w-[380px] p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18] hover:shadow-[0_0_48px_rgba(255,255,255,0.06)] transition-all duration-300">
      <div className="mb-5 pb-3 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white/95 text-center">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {contributors.map((contributor, index) => {
          const isTopThree = index < 3;
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                isTopThree
                  ? "bg-white/[0.12] border border-white/25"
                  : "bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm tabular-nums bg-white/10 text-white/85 font-medium">
                {index + 1}
              </span>
              <span
                className={`flex-1 truncate font-medium ${
                  isTopThree ? "text-white" : "text-white/92"
                }`}
              >
                {contributor.username}
              </span>
              <span
                className="text-sm font-semibold shrink-0 tabular-nums"
                style={{ color: accentColor }}
              >
                {formatValue(contributor.value, valueType)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <PageBackButton />
        </div>
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-amber-300/95 text-sm font-medium mb-3 tracking-wider uppercase">
            Top Contributors
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight m-0"
            style={{
              background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 25%, #fde68a 50%, #fcd34d 75%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 24px rgba(251,191,36,0.25))",
            }}
          >
            Leaderboard
          </h1>
          {allZeroProjects && (
            <p className="text-white/50 text-sm mt-2 m-0">
              All volunteers currently have 0 projects contributed, so podium order is randomized.
            </p>
          )}
          {loadError && (
            <p className="text-red-300 text-sm mt-2 m-0">Failed to load leaderboard data: {loadError}</p>
          )}
        </div>

        {/* Podium highlight - top 3 across all categories */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-amber-500/8 via-amber-400/5 to-transparent border border-amber-400/25 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
          <h3 className="text-center text-amber-200/90 text-sm font-medium mb-4 uppercase tracking-wider">
            Hall of Fame
          </h3>
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-10 h-10 rounded-full bg-white/10 text-white/85 font-bold flex items-center justify-center text-lg mb-2">2</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[1]?.username || "-"}</span>
              <div className="w-full h-16 mt-2 rounded-t-lg bg-white/10 border border-white/20 shadow-inner" />
              <span className="text-xs text-white/70 font-medium mt-1">2nd</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[140px]">
              <span className="w-12 h-12 rounded-full bg-white/10 text-white/85 font-bold flex items-center justify-center text-xl mb-2">1</span>
              <span className="text-white font-bold text-center text-base truncate w-full">{mostProjects[0]?.username || "-"}</span>
              <div className="w-full h-24 mt-2 rounded-t-lg bg-white/10 border border-white/20 shadow-inner" />
              <span className="text-xs text-white/70 font-semibold mt-1">1st</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-10 h-10 rounded-full bg-white/10 text-white/85 font-bold flex items-center justify-center text-lg mb-2">3</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[2]?.username || "-"}</span>
              <div className="w-full h-12 mt-2 rounded-t-lg bg-white/10 border border-white/20" />
              <span className="text-xs text-white/70 font-medium mt-1">3rd</span>
            </div>
          </div>
        </div>

        {/* Category columns */}
        {loading ? (
          <p className="text-white/60 text-center">Loading leaderboard...</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
          <ContributorList
            contributors={mostProjects}
            title="Most Projects"
            valueType="projects"
            accentColor="rgb(125, 211, 252)"
          />
          <ContributorList
            contributors={mostCompute}
            title="Most Compute"
            valueType="compute"
            accentColor="rgb(196, 181, 253)"
          />
          <ContributorList
            contributors={mostTime}
            title="Most Tasks Completed"
            valueType="time"
            accentColor="rgb(134, 239, 172)"
          />
          </div>
        )}
      </div>
    </ConstellationStarfieldBackground>
  );
}
