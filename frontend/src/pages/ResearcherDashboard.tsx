import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import PageFooter from "../components/PageFooter";
import PageBackButton from "../components/PageBackButton";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL, getBackendPort } from "../api/config";
import { useAuth } from "../context/AuthContext";
import { hasResearcherRole } from "../auth/session";

interface ResearchProject {
  id: string;
  title: string;
  description: string;
  progress: number;
  resultUrl?: string;
  totalContributors: number;
  activeContributors: number;
  completedContributors?: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalChunks: number;
  verifiedChunks: number;
  failedVerifications: number;
  replicationFactor: number;
  maxVerificationAttempts: number;
  chunkSize?: number;
  createdAt: string;
  updatedAt: string;
  totalRuns: number;
  averageTaskTime?: number;
  latestRunId?: string;
  latestRunStatus?: string;
}

const BACKEND_PORT = getBackendPort();

function ProjectCard({
  proj,
  expanded,
  onToggle,
}: {
  proj: ResearchProject;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isComplete = proj.progress >= 100;
  const hasResults = !!proj.latestRunId;

  const downloadResults = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (proj.latestRunId) {
      window.open(`${API_BASE_URL}/api/runs/${proj.latestRunId}/results/download`, "_blank");
    }
  };

  return (
    <div
      onClick={onToggle}
      className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer h-fit transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-xl font-semibold text-white/90 m-0">{proj.title}</h2>
        <span
          className={`shrink-0 mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${
            isComplete
              ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
              : "bg-blue-500/20 border-blue-400/30 text-blue-300"
          }`}
        >
          {isComplete ? "Completed" : "In Progress"}
        </span>
      </div>

      <p className="text-white/70 mt-2 text-[15px]">{proj.description}</p>

      <div className="mt-4 rounded-lg h-3 w-full overflow-hidden bg-white/10">
        <div
          className="h-full rounded-lg transition-[width] duration-400 ease-out"
          style={{
            width: `${proj.progress}%`,
            backgroundColor: isComplete ? "rgba(52, 211, 153, 0.8)" : "rgba(96, 165, 250, 0.8)",
          }}
        />
      </div>
      <p className="mt-1.5 text-white/70 text-sm">{proj.progress}% complete</p>

      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-white/60">Total Contributors:</span>
          <span className="font-semibold text-white/90">{proj.totalContributors}</span>
        </div>
        {isComplete ? (
          <div className="flex justify-between">
            <span className="text-white/60">Completed:</span>
            <span className="font-semibold text-emerald-400/90">
              {proj.completedContributors ?? proj.totalContributors}
            </span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-white/60">Active Now:</span>
            <span className="font-semibold text-blue-400/90">{proj.activeContributors}</span>
          </div>
        )}
      </div>

      {!isComplete && (
        <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
          <div className="flex justify-between mb-1.5">
            <span className="text-white/60">Tasks Completed:</span>
            <span className="font-semibold text-emerald-400/90">{proj.completedTasks.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span className="text-white/60">Tasks Remaining:</span>
            <span className="font-semibold text-amber-400/90">
              {(proj.totalTasks - proj.completedTasks - proj.failedTasks).toLocaleString()}
            </span>
          </div>
          {proj.failedTasks > 0 && (
            <div className="flex justify-between">
              <span className="text-white/60">Tasks Failed:</span>
              <span className="font-semibold text-red-400/90">{proj.failedTasks}</span>
            </div>
          )}
        </div>
      )}

      <Link
        to={`/project/${encodeURIComponent(proj.id)}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium no-underline transition-all duration-200 text-sm mt-3"
      >
        View project details
        <span aria-hidden>→</span>
      </Link>

      {/* Download — always visible when there's a run */}
      {hasResults && (
        <button
          onClick={downloadResults}
          className={`w-full mt-3 py-2.5 px-4 rounded-xl border font-medium text-sm cursor-pointer transition-all ${
            isComplete
              ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-200"
              : "bg-white/10 hover:bg-white/15 border-white/15 text-white/80"
          }`}
        >
          {isComplete ? "Download Verified Results" : "Download Partial Results"}
        </button>
      )}

      {expanded && (
        <div className="mt-5 pt-4 border-t border-white/10 animate-[fadeIn_0.3s_ease-in]">
          <p className="text-white/80 mb-4">
            {isComplete
              ? "This project has finished computing."
              : "This project is still processing across volunteer devices."}
          </p>

          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Task Statistics</h3>
            <div className="text-sm">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Completed:</span>
                <span className="font-semibold text-emerald-400/90">{proj.completedTasks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Remaining:</span>
                <span className="font-semibold text-amber-400/90">
                  {(proj.totalTasks - proj.completedTasks - proj.failedTasks).toLocaleString()}
                </span>
              </div>
              {proj.failedTasks > 0 && (
                <div className="flex justify-between mb-1.5">
                  <span className="text-white/60">Failed:</span>
                  <span className="font-semibold text-red-400/90">{proj.failedTasks}</span>
                </div>
              )}
              <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                <span className="text-white/60">Total Tasks:</span>
                <span className="font-semibold text-white/90">{proj.totalTasks.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Verification</h3>
            <div className="text-sm">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Total Chunks:</span>
                <span className="font-semibold text-white/90">{proj.totalChunks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Verified Chunks:</span>
                <span className="font-semibold text-emerald-400/90">{proj.verifiedChunks.toLocaleString()}</span>
              </div>
              {proj.failedVerifications > 0 && (
                <div className="flex justify-between mb-1.5">
                  <span className="text-white/60">Failed Verifications:</span>
                  <span className="font-semibold text-red-400/90">{proj.failedVerifications}</span>
                </div>
              )}
              <div className="flex justify-between mb-1.5 mt-2 pt-2 border-t border-white/10">
                <span className="text-white/60">Replication Factor:</span>
                <span className="font-semibold text-white/90">{proj.replicationFactor}</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Max Verify Attempts:</span>
                <span className="font-semibold text-white/90">{proj.maxVerificationAttempts}</span>
              </div>
              {proj.chunkSize != null && (
                <div className="flex justify-between">
                  <span className="text-white/60">Chunk Size:</span>
                  <span className="font-semibold text-white/90">{proj.chunkSize.toLocaleString()} rows</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Project Details</h3>
            <div className="text-sm">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Total Runs:</span>
                <span className="font-semibold text-white/90">{proj.totalRuns}</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60">Created:</span>
                <span className="font-medium text-white/90">{new Date(proj.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Last Updated:</span>
                <span className="font-medium text-white/90">{new Date(proj.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {proj.averageTaskTime != null && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20">
              <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Performance</h3>
              <div className="text-sm flex justify-between">
                <span className="text-white/60">Avg Task Time:</span>
                <span className="font-semibold text-white/90">{proj.averageTaskTime.toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResearcherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researcherId, setResearcherId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }
    if (!hasResearcherRole(user.role)) {
      setLoading(false);
      navigate("/profile", { replace: true });
      return;
    }
    setResearcherId(user.user_id);
  }, [user, navigate]);

  useEffect(() => {
    if (!researcherId) return;
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/researcher/${researcherId}/projects`);
        if (!response.ok) {
          let detail = response.statusText;
          try {
            const errBody = await response.json();
            if (errBody?.error) detail = String(errBody.error);
          } catch { /* ignore */ }
          throw new Error(`Failed to fetch projects: ${detail}`);
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [researcherId]);

  const { inProgress, completed } = useMemo(() => ({
    inProgress: projects.filter((p) => p.progress < 100),
    completed: projects.filter((p) => p.progress >= 100),
  }), [projects]);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="mb-6">
          <PageBackButton />
        </div>
        <h1 className="text-4xl font-bold text-white/90 mb-10">My Researcher Dashboard</h1>

        {loading && (
          <div className="text-center py-12 text-lg text-white/60">Loading projects...</div>
        )}

        {error && (
          <div className="text-left p-5 mb-6 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-200 whitespace-pre-line font-mono text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-4 text-xs text-red-300/90">
              <strong>Troubleshooting:</strong>
              <br />1. Check if backend is running: <code className="text-white/80">python3 -m flask --app backend.app run --host 0.0.0.0 --port {BACKEND_PORT}</code>
              <br />2. Test API: <code className="text-white/80">curl {API_BASE_URL}/</code>
              <br />3. Verify API URL: {API_BASE_URL}
            </div>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12 text-lg text-white/60 rounded-2xl bg-white/5 border border-white/10">
            No projects found. Create your first project to get started!
          </div>
        )}

        {!loading && inProgress.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white/80 mb-4">In Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full items-start">
              {inProgress.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  proj={proj}
                  expanded={expanded === proj.id}
                  onToggle={() => toggle(proj.id)}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && completed.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white/80 mb-4">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full items-start">
              {completed.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  proj={proj}
                  expanded={expanded === proj.id}
                  onToggle={() => toggle(proj.id)}
                />
              ))}
            </div>
          </section>
        )}

        <PageFooter className="w-full" />
      </div>
    </ConstellationStarfieldBackground>
  );
}
