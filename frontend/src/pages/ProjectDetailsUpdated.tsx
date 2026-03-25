import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Delaunay } from "d3-delaunay";
import FlowNav from "../components/FlowNav";
import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import { useGoBack } from "../hooks/useGoBack";
import { API_BASE_URL } from "../api/config";
import { useAuth } from "../context/AuthContext";

type Task = { id: number; title: string; description: string };
type ConstellationStar = { id: number; x: number; y: number; isYours: boolean };

interface LearnMoreLink {
  label: string;
  url: string;
}

interface AwsProject {
  id: string | number;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  whyJoin: string[];
  learnMore: LearnMoreLink[];
  researcherName?: string;
}

interface ProjectData {
  id: string;
  name: string;
  overview: string;
  progress: number;
  completedTasks: Task[];
  tags: string[];
  whyJoin: string[];
  learnMore: LearnMoreLink[];
  researcherName?: string;
  progressPlaceholder?: string;
  tasksPlaceholder?: string;
}

const normalize = (value: string): string => value.trim().toLowerCase();
const isActiveWorkerStatus = (status?: string) => ["online", "idle", "busy"].includes((status ?? "").toLowerCase());

interface WorkerRecord {
  worker_id: string;
  user_id?: string;
  worker_name?: string;
  status?: string;
}

interface ProjectStats {
  id: string | number;
  progress?: number;
  totalContributors?: number;
  activeContributors?: number;
  completedContributors?: number | null;
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
  totalRuns?: number;
  averageTaskTime?: number;
  status?: string;
}

const parseProject = (raw: unknown): AwsProject => {
  const p = raw as Record<string, unknown>;
  return {
    id: (p.id as string | number) ?? "",
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    longDescription: String(p.longDescription ?? p.description ?? ""),
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    whyJoin: Array.isArray(p.whyJoin) ? (p.whyJoin as string[]) : [],
    learnMore: Array.isArray(p.learnMore) ? (p.learnMore as LearnMoreLink[]) : [],
    researcherName: typeof p.researcherName === "string" ? p.researcherName : undefined,
  };
};

const toProjectData = (project: AwsProject | null, requestedProject: string): ProjectData | null => {
  if (!project) return null;

  const name = project.title.trim() || requestedProject || "Untitled AWS Project";
  const overview =
    project.longDescription?.trim() ||
    project.description.trim() ||
    "Project description is not available yet. Please check back soon for more details.";
  const whyJoin =
    project.whyJoin.length > 0
      ? project.whyJoin
      : [
          "Motivation details are not available yet for this AWS project.",
          "Contributors are still welcome while project metadata is being expanded.",
        ];
  const learnMore =
    project.learnMore.length > 0
      ? project.learnMore
      : [{ label: "Learn-more links coming soon", url: "" }];

  return {
    id: String(project.id),
    name,
    overview,
    progress: 0,
    completedTasks: [],
    tags: project.tags,
    whyJoin,
    learnMore,
    researcherName: project.researcherName,
    progressPlaceholder: "Progress metrics are not yet available from the AWS projects browse payload.",
    tasksPlaceholder: "Task history has not been connected to this page yet. Star updates will appear once per-task data is available.",
  };
};

export default function ProjectDetailsUpdated() {
  const goBack = useGoBack();
  const { user, isVolunteer, isResearcher } = useAuth();
  const { projectName } = useParams<{ projectName: string }>();
  const requestedProject = decodeURIComponent(projectName ?? "");

  const [project, setProject] = useState<ProjectData | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"connect" | "disconnect" | null>(null);
  const [volunteerConnected, setVolunteerConnected] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [projectStatsLoading, setProjectStatsLoading] = useState(false);
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/projects/browse`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { projects?: unknown[] }) => {
        if (cancelled) return;
        const rawProjects = Array.isArray(data?.projects) ? data.projects : [];
        const mapped = rawProjects.map(parseProject);
        const match =
          mapped.find((p) => normalize(p.title) === normalize(requestedProject)) ??
          mapped.find((p) => String(p.id) === requestedProject) ??
          null;

        if (!match) {
          setProject(null);
          setLoadError("Project not found in AWS project table.");
          return;
        }

        const mappedProject = toProjectData(match, requestedProject);
        setProject(mappedProject);
        setActionError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load project details");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedProject]);

  useEffect(() => {
    if (!user || !isVolunteer) {
      setVolunteerConnected(false);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE_URL}/api/workers`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { workers?: WorkerRecord[] }) => {
        if (cancelled) return;
        const workers = Array.isArray(data?.workers) ? data.workers : [];
        const connected = workers.some(
          (w) => w.user_id === user.user_id && isActiveWorkerStatus(w.status)
        );
        setVolunteerConnected(connected);
      })
      .catch(() => {
        if (!cancelled) setVolunteerConnected(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isVolunteer, project?.id]);

  useEffect(() => {
    if (!project) {
      setProjectStats(null);
      setProjectStatsLoading(false);
      return;
    }

    let cancelled = false;
    setProjectStatsLoading(true);
    fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { project?: unknown }) => {
        if (cancelled) return;
        const p = (data?.project || {}) as Record<string, unknown>;
        if (!p.id) {
          setProjectStats(null);
          return;
        }
        setProjectStats({
          id: p.id as string | number,
          progress: Number(p.progress ?? 0),
          totalContributors: Number(p.totalContributors ?? 0),
          activeContributors: Number(p.activeContributors ?? 0),
          completedContributors:
            p.completedContributors == null ? null : Number(p.completedContributors),
          totalTasks: Number(p.totalTasks ?? 0),
          completedTasks: Number(p.completedTasks ?? 0),
          failedTasks: Number(p.failedTasks ?? 0),
          totalRuns: Number(p.totalRuns ?? 0),
          averageTaskTime:
            p.averageTaskTime == null ? undefined : Number(p.averageTaskTime),
          status: typeof p.status === "string" ? p.status : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setProjectStats(null);
      })
      .finally(() => {
        if (!cancelled) setProjectStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  const connectWorkerForProject = async () => {
    if (!project || !user) {
      setActionError("Please sign in with a volunteer account before connecting.");
      return;
    }
    setActionLoading("connect");
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/workers/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          email: user.email,
          worker_name: `${user.user_id}-worker`,
          project_id: project.id,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to connect worker");
      setVolunteerConnected(true);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to connect worker");
    } finally {
      setActionLoading(null);
    }
  };

  const disconnectWorker = async () => {
    if (!user) {
      setActionError("Please sign in with a volunteer account.");
      return;
    }
    setActionLoading("disconnect");
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/workers/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          email: user.email,
          project_id: project?.id,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to disconnect worker");
      setVolunteerConnected(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to disconnect worker");
    } finally {
      setActionLoading(null);
    }
  };

  const tasks = project?.completedTasks ?? [];
  const volunteerView = !!isVolunteer && !isResearcher;
  const connectedStarCount = volunteerView && volunteerConnected ? 1 : 0;
  const displayedProgress = Math.max(0, Math.min(100, projectStats?.progress ?? project?.progress ?? 0));

  const { starPositions, lines } = useMemo((): {
    starPositions: ConstellationStar[];
    lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  } => {
    const numYour = tasks.length + connectedStarCount;
    const numOther = 32;
    const total = numYour + numOther;

    const seed = requestedProject.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = (i: number, j: number, offset: number) => {
      const x = Math.sin(seed + offset + i * 7 + j * 13) * 10000;
      return x - Math.floor(x);
    };

    const yourPositions = Array.from({ length: numYour }, (_, i) => ({
      id: i,
      x: 20 + rnd(i, 0, 0) * 55,
      y: 20 + rnd(i, 1, 0) * 60,
      isYours: true as const,
    }));

    const otherPositions = Array.from({ length: numOther }, (_, i) => ({
      id: numYour + i,
      x: 10 + rnd(i, 0, 100) * 80,
      y: 10 + rnd(i, 1, 100) * 80,
      isYours: false as const,
    }));

    const positions = [...yourPositions, ...otherPositions];
    if (total === 0) return { starPositions: [], lines: [] };

    const points = positions.map((p) => [p.x, p.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const tri = delaunay.triangles;
    const edgeMap = new Map<string, { a: number; b: number; lenSq: number }>();

    for (let t = 0; t < tri.length; t += 3) {
      const add = (a: number, b: number) => {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (edgeMap.has(key)) return;
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        edgeMap.set(key, { a, b, lenSq: dx * dx + dy * dy });
      };
      add(tri[t], tri[t + 1]);
      add(tri[t + 1], tri[t + 2]);
      add(tri[t + 2], tri[t]);
    }

    const edges = Array.from(edgeMap.values()).sort((e, f) => e.lenSq - f.lenSq);
    const parent = positions.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const lineList: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (const { a, b } of edges) {
      if (find(a) === find(b)) continue;
      parent[find(a)] = find(b);
      const pa = positions[a];
      const pb = positions[b];
      lineList.push({ x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y });
    }

    return { starPositions: positions, lines: lineList };
  }, [requestedProject, tasks.length, connectedStarCount]);

  const hasTasks = tasks.length > 0;
  const hasAnyStars = starPositions.length > 0;

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 h-screen flex flex-col overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 shrink-0 mb-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-base font-medium px-4 py-2.5 rounded-lg border border-white/40 hover:border-white/60 transition-colors bg-transparent cursor-pointer font-inherit"
          >
            ← Back
          </button>
        </div>

        {listLoading ? (
          <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
            <p className="text-white/70 text-sm m-0">Loading project details from AWS...</p>
          </div>
        ) : loadError || !project ? (
          <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-red-300/30 p-5">
            <p className="text-red-100 text-sm m-0">{loadError ?? "Project not found."}</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg border border-white/30 bg-white/15 hover:bg-white/25 text-white/95 no-underline text-sm"
            >
              Return to browse
            </Link>
          </div>
        ) : (
          <>
            <header className="shrink-0 mb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">AWS project details</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-0 mb-1">
                {project.name}
              </h1>
              <p className="text-white/60 text-sm m-0">
                {project.researcherName
                  ? `Lead researcher: ${project.researcherName}`
                  : "Lead researcher information is not available yet."}
              </p>
            </header>

            {actionError && (
              <div className="rounded-xl bg-red-500/10 border border-red-300/30 p-4 mb-3">
                <p className="text-red-100 text-sm m-0">{actionError}</p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
              <div className="flex-1 min-h-0 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden relative">
                {volunteerView && volunteerConnected && (
                  <div className="absolute top-3 left-3 z-10 rounded-lg border border-amber-300/40 bg-amber-400/20 px-3 py-1.5">
                    <p className="text-amber-100 text-xs font-semibold m-0">★ This is you</p>
                  </div>
                )}
                {hasAnyStars ? (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                      </linearGradient>
                      <filter id="starGlowYellow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="starGlowWhite" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {lines.map((line, i) => (
                      <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="url(#lineGrad)"
                        strokeWidth="0.6"
                        className="transition-opacity duration-300"
                        style={{ opacity: hoveredTaskIndex === null ? 1 : 0.25 }}
                      />
                    ))}

                    {starPositions.map((star, i) => {
                      const isYours = star.isYours;
                      const isHovered = isYours && hoveredTaskIndex === i;
                      const isDimmed = hoveredTaskIndex !== null && !(isYours && hoveredTaskIndex === i);
                      const r = isYours ? (isHovered ? 1.8 : 1.2) : 0.65;
                      const fill = isYours ? "#fef08a" : "rgba(255,255,255,0.95)";
                      const filter = isYours ? "url(#starGlowYellow)" : "url(#starGlowWhite)";
                      return (
                        <circle
                          key={star.id}
                          cx={star.x}
                          cy={star.y}
                          r={r}
                          fill={fill}
                          filter={filter}
                          className="transition-all duration-300 pointer-events-none"
                          style={{ opacity: isDimmed ? 0.25 : 1 }}
                        />
                      );
                    })}
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/40 text-sm text-center px-4">{project.tasksPlaceholder}</p>
                  </div>
                )}
              </div>

              <div className="lg:w-[360px] shrink-0 flex flex-col gap-4 min-h-0 overflow-y-auto">
                {volunteerView && (
                  <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
                    {volunteerConnected ? (
                      <>
                        <p className="text-sm font-semibold text-emerald-200 mt-0 mb-2">
                          You're contributing CPU to this project.
                        </p>
                        <button
                          type="button"
                          onClick={() => void disconnectWorker()}
                          disabled={actionLoading === "disconnect"}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-300/30 text-red-100 font-medium transition-all duration-200 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                        >
                          {actionLoading === "disconnect" ? "Stopping contribution..." : "Stop contributing CPU"}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-white/80 mt-0 mb-2">
                          Connect your worker to start contributing CPU.
                        </p>
                        <button
                          type="button"
                          onClick={() => void connectWorkerForProject()}
                          disabled={actionLoading === "connect"}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium transition-all duration-200 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                        >
                          {actionLoading === "connect" ? "Connecting worker..." : "Contribute CPU to this project"}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {isResearcher && (
                  <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
                    <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-3">
                      Researcher overview
                    </h2>
                    {projectStatsLoading ? (
                      <p className="text-sm text-white/70 m-0">Loading researcher statistics...</p>
                    ) : projectStats ? (
                      <div className="space-y-2 text-sm text-white/80">
                        <p className="m-0">Project progress: {projectStats.progress ?? 0}%</p>
                        <p className="m-0">Total contributors: {projectStats.totalContributors ?? 0}</p>
                        <p className="m-0">Active contributors: {projectStats.activeContributors ?? 0}</p>
                        <p className="m-0">Total tasks: {projectStats.totalTasks ?? 0}</p>
                        <p className="m-0">Completed tasks: {projectStats.completedTasks ?? 0}</p>
                        <p className="m-0">Failed tasks: {projectStats.failedTasks ?? 0}</p>
                        <p className="m-0">Total runs: {projectStats.totalRuns ?? 0}</p>
                        <p className="m-0">
                          Avg task time: {(projectStats.averageTaskTime ?? 0).toFixed(1)}s
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-white/70 m-0">
                        Detailed researcher statistics are not available for this project yet.
                      </p>
                    )}
                  </div>
                )}

                {isResearcher && (
                  <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
                    <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-3">
                      Project settings
                    </h2>
                    <div className="space-y-2 text-sm text-white/75">
                      <p className="m-0">Data source: AWS projects table</p>
                      <p className="m-0">Project ID: {project.id}</p>
                      <p className="m-0">Status: {projectStats?.status ?? "pending"}</p>
                      <p className="m-0">Replication factor: not exposed in browse payload yet</p>
                      <p className="m-0">Max verification attempts: not exposed in browse payload yet</p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white/90">Project progress</span>
                    <span className="text-2xl font-bold text-white tabular-nums ml-auto">{displayedProgress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${displayedProgress}%`, background: "linear-gradient(90deg, #a78bfa, #818cf8)" }}
                    />
                  </div>
                  {projectStatsLoading ? (
                    <p className="text-white/55 text-sm mt-3 mb-0">Loading project metrics...</p>
                  ) : projectStats ? (
                    <div className="text-white/70 text-sm mt-3 space-y-1">
                      <p className="m-0">Total contributors: {projectStats.totalContributors ?? 0}</p>
                      <p className="m-0">Active contributors: {projectStats.activeContributors ?? 0}</p>
                    </div>
                  ) : (
                    <p className="text-white/55 text-sm mt-3 mb-0">{project.progressPlaceholder}</p>
                  )}
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Overview</h2>
                  <p className="text-sm text-white/85 leading-relaxed m-0">{project.overview}</p>
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden shrink-0">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-5 py-3.5 border-b border-white/10">
                    Tasks you completed
                  </h2>
                  {hasTasks ? (
                    <ul className="list-none p-0 m-0 max-h-[180px] overflow-y-auto">
                      {tasks.map((task, i) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredTaskIndex(i)}
                            onMouseLeave={() => setHoveredTaskIndex(null)}
                            className={`w-full text-left px-5 py-3 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors cursor-pointer ${
                              hoveredTaskIndex === i
                                ? "bg-amber-500/15 border-l-2 border-l-amber-400/60"
                                : "hover:bg-white/5 border-l-2 border-l-transparent"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" aria-hidden />
                            <span className="text-sm font-medium text-white/95 truncate">{task.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/45 text-sm px-5 py-5 m-0">{project.tasksPlaceholder}</p>
                  )}
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Why join</h2>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {project.whyJoin.map((reason, i) => (
                      <li key={`${reason}-${i}`} className="text-sm text-white/80 leading-relaxed">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Learn more</h2>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {project.learnMore.map((link, i) => (
                      <li key={`${link.label}-${i}`}>
                        {link.url ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white/90 hover:text-white underline underline-offset-2"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <span className="text-sm text-white/60">{link.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {project.tags.length > 0 && (
                  <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                    <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-white/15 text-white/80 text-xs border border-white/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {hasTasks && hoveredTaskIndex !== null && tasks[hoveredTaskIndex] && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4 shrink-0 transition-opacity duration-200">
                    <p className="text-xs font-semibold text-amber-200/90 uppercase tracking-wider mb-2">What this task did</p>
                    <p className="text-sm text-white/90 leading-relaxed line-clamp-4 m-0">
                      {tasks[hoveredTaskIndex].description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ConstellationStarfieldBackground>
  );
}