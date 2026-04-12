import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Delaunay } from "d3-delaunay";
import FlowNav from "../components/FlowNav";
import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import PageFooter from "../components/PageFooter";
import { useGoBack } from "../hooks/useGoBack";
import { API_BASE_URL } from "../api/config";
import { hasResearcherRole } from "../auth/session";
import { useAuth } from "../context/AuthContext";
import TagMultiselectDropdown from "../components/TagMultiselectDropdown";
import { PROJECT_TAG_OPTIONS } from "../constants/projectTags";

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
  tags: string[];
  whyJoin: string[];
  learnMore: LearnMoreLink[];
  researcherName?: string;
  researcherId?: string;
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
  ownerResearcherId?: string;
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
  latestRunId?: string;
  latestRunStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  totalChunks?: number;
  verifiedChunks?: number;
  failedVerifications?: number;
  researcherId?: string | null;
  title?: string;
  description?: string;
  tags?: string[];
  replicationFactor?: number;
  maxVerificationAttempts?: number;
  datasetType?: string;
  awsTotalChunks?: number | null;
  awsChunksCompleted?: number | null;
  whyJoin?: string[];
  learnMore?: LearnMoreLink[];
}

const parseProject = (raw: unknown): AwsProject => {
  const p = raw as Record<string, unknown>;
  return {
    id: (p.id as string | number) ?? "",
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    whyJoin: Array.isArray(p.whyJoin) ? (p.whyJoin as string[]) : [],
    learnMore: Array.isArray(p.learnMore) ? (p.learnMore as LearnMoreLink[]) : [],
    researcherName: typeof p.researcherName === "string" ? p.researcherName : undefined,
    researcherId:
      typeof p.researcherId === "string"
        ? p.researcherId
        : typeof p.researcher_id === "string"
          ? p.researcher_id
          : undefined,
  };
};

const toProjectData = (project: AwsProject | null, requestedProject: string): ProjectData | null => {
  if (!project) return null;

  const name = project.title.trim() || requestedProject || "Untitled Project";
  const overview =
    project.description.trim() ||
    "Project description is not available yet. Please check back soon for more details.";
  const whyJoin =
    project.whyJoin.length > 0
      ? project.whyJoin
      : ["The lead researcher has not added “why join” reasons for this project yet."];
  const learnMore = project.learnMore.length > 0 ? project.learnMore : [];

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
    ownerResearcherId: project.researcherId,
    progressPlaceholder: "Progress metrics are not yet available.",
    tasksPlaceholder: "Task history has not been connected to this page yet. Star updates will appear once per-task data is available.",
  };
};

function OwnerPanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white/[0.04] border border-white/10 p-4 min-w-0 flex flex-col h-full">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90 m-0 mb-3 pb-2 border-b border-white/10">
        {title}
      </h3>
      <div className="min-w-0 flex flex-col flex-1">{children}</div>
    </section>
  );
}

function OwnerStatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-2.5 border-b border-white/[0.07] last:border-b-0 items-start sm:items-baseline">
      <span className="text-white/50 text-xs leading-snug">{label}</span>
      <span className="text-white/95 text-sm font-medium tabular-nums sm:text-right break-words min-w-0">
        {value}
      </span>
    </div>
  );
}

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
  const [statsVersion, setStatsVersion] = useState(0);
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPresetTags, setEditPresetTags] = useState<Set<string>>(new Set());
  const [editExtraTags, setEditExtraTags] = useState<string[]>([]);
  const [editCustomTagInput, setEditCustomTagInput] = useState("");
  const [editWhyJoinText, setEditWhyJoinText] = useState("");
  const [editLearnMoreRows, setEditLearnMoreRows] = useState<LearnMoreLink[]>([]);
  const [saveProjectLoading, setSaveProjectLoading] = useState(false);
  const [saveProjectError, setSaveProjectError] = useState<string | null>(null);

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
          setLoadError("Project not found.");
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
        const tagArr = Array.isArray(p.tags)
          ? (p.tags as unknown[]).map((t) => String(t))
          : [];
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
          latestRunId: typeof p.latestRunId === "string" ? p.latestRunId : undefined,
          latestRunStatus:
            typeof p.latestRunStatus === "string" ? p.latestRunStatus : undefined,
          createdAt: typeof p.createdAt === "string" ? p.createdAt : undefined,
          updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
          totalChunks: p.totalChunks == null ? undefined : Number(p.totalChunks),
          verifiedChunks: p.verifiedChunks == null ? undefined : Number(p.verifiedChunks),
          failedVerifications:
            p.failedVerifications == null ? undefined : Number(p.failedVerifications),
          researcherId:
            p.researcherId == null ? null : String(p.researcherId),
          title: typeof p.title === "string" ? p.title : undefined,
          description: typeof p.description === "string" ? p.description : undefined,
          tags: tagArr,
          replicationFactor:
            p.replicationFactor == null ? undefined : Number(p.replicationFactor),
          maxVerificationAttempts:
            p.maxVerificationAttempts == null
              ? undefined
              : Number(p.maxVerificationAttempts),
          datasetType: typeof p.datasetType === "string" ? p.datasetType : undefined,
          awsTotalChunks:
            p.awsTotalChunks == null ? null : Number(p.awsTotalChunks),
          awsChunksCompleted:
            p.awsChunksCompleted == null ? null : Number(p.awsChunksCompleted),
          whyJoin: Array.isArray(p.whyJoin)
            ? (p.whyJoin as unknown[]).map((x) => String(x))
            : undefined,
          learnMore: Array.isArray(p.learnMore)
            ? (p.learnMore as { label?: string; url?: string }[]).map((x) => ({
                label: String(x.label ?? ""),
                url: String(x.url ?? ""),
              }))
            : undefined,
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
  }, [project, statsVersion]);

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
  const volunteerView = !!isVolunteer && !hasResearcherRole(user?.role ?? "");
  const connectedStarCount = volunteerView && volunteerConnected ? 1 : 0;
  const displayedProgress = Math.max(0, Math.min(100, projectStats?.progress ?? project?.progress ?? 0));

  const isProjectOwner = Boolean(
    user?.user_id &&
      isResearcher &&
      (projectStats?.researcherId === user.user_id ||
        project?.ownerResearcherId === user.user_id)
  );

  const displayTitle =
    isProjectOwner && projectStats?.title ? projectStats.title : (project?.name ?? "");
  const displayOverview =
    isProjectOwner && projectStats?.description != null && projectStats.description !== ""
      ? projectStats.description
      : (project?.overview ?? "");

  const displayTags =
    isProjectOwner && projectStats?.tags && projectStats.tags.length > 0
      ? projectStats.tags
      : (project?.tags ?? []);

  const displayWhyJoin = useMemo(() => {
    const fromStats = projectStats?.whyJoin?.filter((s) => s.trim());
    if (fromStats && fromStats.length > 0) return fromStats;
    return project?.whyJoin ?? [];
  }, [projectStats?.whyJoin, project?.whyJoin]);

  const displayLearnMore = useMemo(() => {
    const fromStats = projectStats?.learnMore?.filter((l) => l.label.trim());
    if (fromStats && fromStats.length > 0) return fromStats;
    return project?.learnMore ?? [];
  }, [projectStats?.learnMore, project?.learnMore]);

  const downloadResultsOwner = () => {
    if (projectStats?.latestRunId) {
      window.open(
        `${API_BASE_URL}/api/runs/${projectStats.latestRunId}/results/download`,
        "_blank"
      );
    }
  };

  const beginEditProject = () => {
    setSaveProjectError(null);
    setEditTitle(projectStats?.title ?? project?.name ?? "");
    const desc =
      projectStats?.description ??
      (project?.overview && !project.overview.includes("not available yet")
        ? project.overview
        : "") ??
      "";
    setEditDescription(desc);
    const tagSource =
      projectStats?.tags && projectStats.tags.length > 0 ? projectStats.tags : project?.tags ?? [];
    const nextPreset = new Set<string>();
    const nextExtra: string[] = [];
    for (const raw of tagSource) {
      const trimmed = String(raw).trim();
      if (!trimmed) continue;
      const canonical = PROJECT_TAG_OPTIONS.find(
        (p) => p.toLowerCase() === trimmed.toLowerCase()
      );
      if (canonical) nextPreset.add(canonical);
      else if (!nextExtra.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
        nextExtra.push(trimmed);
      }
    }
    setEditPresetTags(nextPreset);
    setEditExtraTags(nextExtra);
    setEditCustomTagInput("");
    const wj =
      projectStats?.whyJoin && projectStats.whyJoin.length > 0
        ? projectStats.whyJoin
        : project?.whyJoin ?? [];
    setEditWhyJoinText(wj.join("\n"));
    const lm =
      projectStats?.learnMore && projectStats.learnMore.length > 0
        ? projectStats.learnMore
        : project?.learnMore ?? [];
    setEditLearnMoreRows(lm.length > 0 ? [...lm] : [{ label: "", url: "" }]);
    setEditingProject(true);
  };

  const cancelEditProject = () => {
    setEditingProject(false);
    setSaveProjectError(null);
  };

  const saveEditProject = async () => {
    if (!user?.user_id || !project) return;
    const titleTrim = editTitle.trim();
    if (!titleTrim) {
      setSaveProjectError("Title cannot be empty.");
      return;
    }
    const tags = [
      ...new Set(
        [...editPresetTags, ...editExtraTags].map((s) => s.trim()).filter(Boolean)
      ),
    ];
    if (tags.length === 0) {
      setSaveProjectError("Select at least one suggested tag and/or add a custom tag.");
      return;
    }
    const whyJoinLines = editWhyJoinText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (whyJoinLines.length === 0) {
      setSaveProjectError("Add at least one “why join” line.");
      return;
    }
    const learnMorePayload = editLearnMoreRows
      .filter((r) => r.label.trim())
      .map((r) => ({ label: r.label.trim(), url: (r.url || "").trim() }));
    for (let i = 0; i < editLearnMoreRows.length; i++) {
      const row = editLearnMoreRows[i];
      if ((row.url || "").trim() && !(row.label || "").trim()) {
        setSaveProjectError(`Learn more row ${i + 1}: add a label, or remove the URL.`);
        return;
      }
    }
    setSaveProjectLoading(true);
    setSaveProjectError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(project.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_id,
            title: titleTrim,
            description: editDescription,
            tags,
            whyJoin: whyJoinLines,
            learnMore: learnMorePayload,
          }),
        }
      );
      const data = (await res.json()) as {
        error?: string;
        project?: {
          title: string;
          description: string;
          tags: string[];
          whyJoin?: string[];
          learnMore?: LearnMoreLink[];
        };
      };
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setEditingProject(false);
      if (data.project) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                name: data.project!.title,
                overview: data.project!.description,
                tags: data.project!.tags ?? prev.tags,
                whyJoin: data.project!.whyJoin ?? prev.whyJoin,
                learnMore: data.project!.learnMore ?? prev.learnMore,
              }
            : prev
        );
      }
      setStatsVersion((v) => v + 1);
    } catch (e) {
      setSaveProjectError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaveProjectLoading(false);
    }
  };

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
      <div className="relative z-10 flex min-h-0 flex-1 min-h-screen flex-col px-4 sm:px-6 pt-16 sm:pt-20 pb-10 max-w-6xl mx-auto w-full">
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
            <p className="text-white/70 text-sm m-0">Loading project details...</p>
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
              <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">Project details</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-0 mb-1">
                {displayTitle}
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

            <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
              <div className="w-full lg:flex-1 lg:min-w-0 min-h-[220px] flex flex-col rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden relative">
                {volunteerView && volunteerConnected && (
                  <div className="absolute top-3 left-3 z-10 rounded-lg border border-amber-300/40 bg-amber-400/20 px-3 py-1.5">
                    <p className="text-amber-100 text-xs font-semibold m-0">★ This is you</p>
                  </div>
                )}
                <div className="flex-1 min-h-[200px] lg:min-h-0 relative w-full">
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
              </div>

              <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-4 lg:min-h-0">
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

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Project progress</span>
                    <span className="text-2xl font-bold text-white tabular-nums ml-auto">{displayedProgress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${displayedProgress}%`, background: "linear-gradient(90deg, #a78bfa, #818cf8)" }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Overview</h2>
                  <p className="text-sm text-white/85 leading-relaxed m-0">{displayOverview}</p>
                </div>

                {/* <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden shrink-0">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-5 py-3.5 border-b border-white/10">
                    Tasks you completed
                  </h2>
                  {hasTasks ? (
                    <ul className="list-none p-0 m-0">
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
                </div> */}

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Why join</h2>
                  {displayWhyJoin.length === 0 ? (
                    <p className="text-sm text-white/55 m-0">No reasons listed yet.</p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-2">
                      {displayWhyJoin.map((reason, i) => (
                        <li key={`${reason}-${i}`} className="text-sm text-white/80 leading-relaxed">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                  <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Learn more</h2>
                  {displayLearnMore.length === 0 ? (
                    <p className="text-sm text-white/55 m-0">No external links listed.</p>
                  ) : (
                    <ul className="list-none p-0 m-0 space-y-2">
                      {displayLearnMore.map((link, i) => (
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
                            <span className="text-sm text-white/80">{link.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {displayTags.length > 0 && (
                  <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5">
                    <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider mt-0 mb-2">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {displayTags.map((tag) => (
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

            <div className="flex flex-col gap-6 mt-8 w-full">
              {isProjectOwner && (
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 backdrop-blur-md border border-indigo-400/25 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-white/10">
                    <div>
                      <h2 className="text-base font-semibold text-white tracking-tight m-0">
                        Your project
                      </h2>
                      <p className="text-white/50 text-xs m-0 mt-1">
                        Detailed compute and verification metrics (not shown to volunteers).
                      </p>
                    </div>
                    <span className="shrink-0 self-start sm:self-center text-xs font-semibold px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/90">
                      Owner
                    </span>
                  </div>
                  {projectStatsLoading ? (
                    <p className="text-sm text-white/70 m-0">Loading analytics...</p>
                  ) : projectStats ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <OwnerPanelSection title="Project & runs">
                          <OwnerStatRow
                            label="Project ID"
                            value={<span className="font-mono text-xs">{project.id}</span>}
                          />
                          <OwnerStatRow
                            label="Run status"
                            value={projectStats.latestRunStatus ?? projectStats.status ?? "—"}
                          />
                          {projectStats.createdAt && (
                            <OwnerStatRow
                              label="Created"
                              value={new Date(projectStats.createdAt).toLocaleDateString()}
                            />
                          )}
                          {projectStats.updatedAt && (
                            <OwnerStatRow
                              label="Last activity"
                              value={new Date(projectStats.updatedAt).toLocaleDateString()}
                            />
                          )}
                          {projectStats.datasetType && (
                            <OwnerStatRow label="Dataset type" value={projectStats.datasetType} />
                          )}
                        </OwnerPanelSection>

                        <OwnerPanelSection title="Contributors">
                          <OwnerStatRow
                            label="Total (≥1 task completed)"
                            value={(projectStats.totalContributors ?? 0).toLocaleString()}
                          />
                          <OwnerStatRow
                            label="Active now"
                            value={<span className="text-sky-300">{projectStats.activeContributors ?? 0}</span>}
                          />
                          {(projectStats.progress ?? 0) >= 100 &&
                            projectStats.completedContributors != null && (
                              <OwnerStatRow
                                label="Completed cohort"
                                value={
                                  <span className="text-emerald-300">
                                    {projectStats.completedContributors}
                                  </span>
                                }
                              />
                            )}
                        </OwnerPanelSection>

                        <OwnerPanelSection title="Tasks & timing">
                          <OwnerStatRow
                            label="Completed"
                            value={
                              <span className="text-emerald-300/90">
                                {(projectStats.completedTasks ?? 0).toLocaleString()}
                              </span>
                            }
                          />
                          <OwnerStatRow
                            label="Remaining"
                            value={
                              <span className="text-amber-300/90">
                                {Math.max(
                                  0,
                                  (projectStats.totalTasks ?? 0) -
                                    (projectStats.completedTasks ?? 0) -
                                    (projectStats.failedTasks ?? 0)
                                ).toLocaleString()}
                              </span>
                            }
                          />
                          {(projectStats.failedTasks ?? 0) > 0 && (
                            <OwnerStatRow
                              label="Failed"
                              value={
                                <span className="text-red-300/90">{projectStats.failedTasks}</span>
                              }
                            />
                          )}
                          <OwnerStatRow
                            label="Total tasks"
                            value={(projectStats.totalTasks ?? 0).toLocaleString()}
                          />
                          <OwnerStatRow label="Total runs" value={projectStats.totalRuns ?? 0} />
                          {projectStats.averageTaskTime != null && (
                            <OwnerStatRow
                              label="Avg task time"
                              value={`${projectStats.averageTaskTime.toFixed(1)}s`}
                            />
                          )}
                        </OwnerPanelSection>

                        <OwnerPanelSection title="Verification & data">
                          <OwnerStatRow
                            label="Chunk indices (tasks)"
                            value={(projectStats.totalChunks ?? 0).toLocaleString()}
                          />
                          <OwnerStatRow
                            label="Verified chunks"
                            value={
                              <span className="text-emerald-300/90">
                                {(projectStats.verifiedChunks ?? 0).toLocaleString()}
                              </span>
                            }
                          />
                          {(projectStats.failedVerifications ?? 0) > 0 && (
                            <OwnerStatRow
                              label="Failed verifications"
                              value={
                                <span className="text-red-300/90">
                                  {projectStats.failedVerifications}
                                </span>
                              }
                            />
                          )}
                          <OwnerStatRow
                            label="Replication factor"
                            value={projectStats.replicationFactor ?? "—"}
                          />
                          <OwnerStatRow
                            label="Max verify attempts"
                            value={projectStats.maxVerificationAttempts ?? "—"}
                          />
                          {projectStats.awsTotalChunks != null && projectStats.awsTotalChunks > 0 && (
                            <OwnerStatRow
                              label="Chunk progress"
                              value={`${projectStats.awsChunksCompleted ?? 0} / ${projectStats.awsTotalChunks}`}
                            />
                          )}
                        </OwnerPanelSection>
                      </div>

                      {projectStats.latestRunId && (
                        <div className="mt-5 pt-5 border-t border-white/10">
                          <p className="text-xs text-white/45 uppercase tracking-wider m-0 mb-2">
                            Exports
                          </p>
                          <button
                            type="button"
                            onClick={downloadResultsOwner}
                            className="w-full sm:w-auto min-w-[200px] py-2.5 px-5 rounded-lg border font-medium text-sm bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-100 cursor-pointer"
                          >
                            Download results (latest run)
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-white/70 m-0">
                      Analytics will appear once this project is linked to compute runs.
                    </p>
                  )}
                </div>
              )}

              {isProjectOwner && (
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03]">
                    <h2 className="text-base font-semibold text-white tracking-tight m-0">
                      Edit project
                    </h2>
                    <p className="text-white/50 text-xs m-0 mt-1">
                      Title, description, tags, why join, and learn-more links shown to volunteers.
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    {saveProjectError && (
                      <p className="text-sm text-red-200 m-0 mb-4 rounded-lg bg-red-500/10 border border-red-400/20 px-3 py-2">
                        {saveProjectError}
                      </p>
                    )}
                    {editingProject ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                          <div className="space-y-4 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 m-0">
                              Basic info
                            </p>
                            <label className="block">
                              <span className="text-xs text-white/55">Title</span>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                maxLength={500}
                              />
                            </label>
                            <div className="block">
                              <span className="text-xs text-white/55 block mb-1.5">
                                Tags (required)
                              </span>
                              <TagMultiselectDropdown
                                options={[...PROJECT_TAG_OPTIONS]}
                                selected={editPresetTags}
                                onChange={setEditPresetTags}
                                buttonLabel="Suggested tags"
                                emptyHint="No suggested tags match your search."
                              />
                              <div className="mt-3">
                                <span className="text-[10px] text-white/45 uppercase tracking-wide block mb-1.5">
                                  Custom tags
                                </span>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add tag…"
                                    value={editCustomTagInput}
                                    onChange={(e) => setEditCustomTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const t = editCustomTagInput.trim();
                                        if (!t) return;
                                        setEditExtraTags((prev) =>
                                          prev.some((x) => x.toLowerCase() === t.toLowerCase()) ||
                                          [...editPresetTags].some(
                                            (x) => x.toLowerCase() === t.toLowerCase()
                                          )
                                            ? prev
                                            : [...prev, t]
                                        );
                                        setEditCustomTagInput("");
                                      }
                                    }}
                                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/40"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const t = editCustomTagInput.trim();
                                      if (!t) return;
                                      setEditExtraTags((prev) =>
                                        prev.some((x) => x.toLowerCase() === t.toLowerCase()) ||
                                        [...editPresetTags].some(
                                          (x) => x.toLowerCase() === t.toLowerCase()
                                        )
                                          ? prev
                                          : [...prev, t]
                                      );
                                      setEditCustomTagInput("");
                                    }}
                                    className="px-3 py-2 rounded-lg border border-white/25 text-white/85 text-sm hover:bg-white/10 cursor-pointer shrink-0 bg-transparent font-inherit"
                                  >
                                    Add
                                  </button>
                                </div>
                                {editExtraTags.length > 0 && (
                                  <ul className="flex flex-wrap gap-1.5 list-none m-0 mt-2 p-0">
                                    {editExtraTags.map((tag) => (
                                      <li key={tag}>
                                        <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/25 text-violet-100 text-xs">
                                          {tag}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditExtraTags((prev) =>
                                                prev.filter((x) => x !== tag)
                                              )
                                            }
                                            className="p-0.5 rounded hover:bg-white/10 text-white/80 leading-none border-0 bg-transparent cursor-pointer font-inherit"
                                            aria-label={`Remove ${tag}`}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <label className="block">
                              <span className="text-xs text-white/55">Why join (one reason per line, required)</span>
                              <textarea
                                value={editWhyJoinText}
                                onChange={(e) => setEditWhyJoinText(e.target.value)}
                                rows={4}
                                className="mt-1.5 w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm resize-y min-h-[88px]"
                              />
                            </label>
                          </div>
                          <div className="flex flex-col min-w-0 min-h-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 m-0 mb-2">
                              Description
                            </p>
                            <label className="flex flex-col flex-1 min-h-[140px]">
                              <span className="sr-only">Description</span>
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={6}
                                className="flex-1 w-full min-h-[140px] px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm resize-y"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45 m-0">
                            Learn more (optional — each row needs a label)
                          </p>
                          {editLearnMoreRows.map((row, i) => (
                            <div
                              key={i}
                              className="flex flex-col sm:flex-row gap-2 sm:items-end flex-wrap"
                            >
                              <label className="flex-1 min-w-[140px] block">
                                <span className="text-xs text-white/50">Label</span>
                                <input
                                  type="text"
                                  value={row.label}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setEditLearnMoreRows((rows) =>
                                      rows.map((r, j) => (j === i ? { ...r, label: v } : r))
                                    );
                                  }}
                                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                  placeholder="Paper, docs, …"
                                />
                              </label>
                              <label className="flex-[2] min-w-[180px] block">
                                <span className="text-xs text-white/50">URL (optional)</span>
                                <input
                                  type="text"
                                  value={row.url}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setEditLearnMoreRows((rows) =>
                                      rows.map((r, j) => (j === i ? { ...r, url: v } : r))
                                    );
                                  }}
                                  className="mt-1 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                  placeholder="https://…"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditLearnMoreRows((rows) => rows.filter((_, j) => j !== i))
                                }
                                className="px-3 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setEditLearnMoreRows((rows) => [...rows, { label: "", url: "" }])
                            }
                            className="text-sm text-violet-200 hover:text-white underline underline-offset-2 bg-transparent border-0 cursor-pointer p-0 font-inherit"
                          >
                            + Add link
                          </button>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={cancelEditProject}
                            disabled={saveProjectLoading}
                            className="px-5 py-2.5 rounded-lg border border-white/25 text-white/85 text-sm cursor-pointer disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveEditProject()}
                            disabled={saveProjectLoading}
                            className="px-5 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium cursor-pointer disabled:opacity-60"
                          >
                            {saveProjectLoading ? "Saving…" : "Save changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
                        <ul className="text-sm text-white/60 space-y-2 m-0 pl-4 list-disc marker:text-white/35">
                          <li>Edit title, description, tags, why join, and learn-more links.</li>
                          <li>Volunteers see the same overview on browse and project pages.</li>
                        </ul>
                        <button
                          type="button"
                          onClick={beginEditProject}
                          className="w-full lg:w-auto shrink-0 py-2.5 px-6 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-medium cursor-pointer whitespace-nowrap"
                        >
                          Edit listing
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isResearcher && !isProjectOwner && (
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 sm:p-6">
                  <div className="mb-5 pb-4 border-b border-white/10">
                    <h2 className="text-base font-semibold text-white tracking-tight m-0">
                      Researcher overview
                    </h2>
                    <p className="text-white/50 text-xs m-0 mt-1">
                      Summary metrics for projects you do not own.
                    </p>
                  </div>
                  {projectStatsLoading ? (
                    <p className="text-sm text-white/70 m-0">Loading researcher statistics...</p>
                  ) : projectStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <OwnerPanelSection title="Progress">
                        <OwnerStatRow label="Project progress" value={`${projectStats.progress ?? 0}%`} />
                        <OwnerStatRow
                          label="Total contributors"
                          value={(projectStats.totalContributors ?? 0).toLocaleString()}
                        />
                        <OwnerStatRow
                          label="Active contributors"
                          value={(projectStats.activeContributors ?? 0).toLocaleString()}
                        />
                      </OwnerPanelSection>
                      <OwnerPanelSection title="Tasks">
                        <OwnerStatRow
                          label="Total tasks"
                          value={(projectStats.totalTasks ?? 0).toLocaleString()}
                        />
                        <OwnerStatRow
                          label="Completed"
                          value={(projectStats.completedTasks ?? 0).toLocaleString()}
                        />
                        <OwnerStatRow label="Failed" value={(projectStats.failedTasks ?? 0).toLocaleString()} />
                        <OwnerStatRow label="Total runs" value={projectStats.totalRuns ?? 0} />
                        <OwnerStatRow
                          label="Avg task time"
                          value={`${(projectStats.averageTaskTime ?? 0).toFixed(1)}s`}
                        />
                      </OwnerPanelSection>
                      <OwnerPanelSection title="Verification">
                        <OwnerStatRow
                          label="Verified chunks"
                          value={(projectStats.verifiedChunks ?? 0).toLocaleString()}
                        />
                        <OwnerStatRow
                          label="Replication factor"
                          value={projectStats.replicationFactor ?? "—"}
                        />
                      </OwnerPanelSection>
                    </div>
                  ) : (
                    <p className="text-sm text-white/70 m-0">
                      Detailed researcher statistics are not available for this project yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <PageFooter className="w-full" />
      </div>
    </ConstellationStarfieldBackground>
  );
}