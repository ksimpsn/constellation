<<<<<<< HEAD
import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";
import { useState, useEffect } from "react";

interface ResearchProject {
  id: string; // Changed from number to string (project_id)
  title: string;
  description: string;
  progress: number; // 0–100
  resultUrl?: string; // backend CSV/JSON download URL
  totalContributors: number; // Total unique contributors across all time
  activeContributors: number; // Currently contributing (if in progress)
  completedContributors?: number; // Contributors who finished (if completed)
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  totalRuns: number;
  averageTaskTime?: number; // Average task completion time in seconds
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BACKEND_PORT = (() => {
  try {
    return new URL(API_BASE_URL).port || "5000";
  } catch {
    return "5000";
  }
})();

export default function ResearcherDashboard() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researcherId, setResearcherId] = useState<string | null>(null);

  // First, fetch the debug researcher ID
  useEffect(() => {
    const fetchResearcherId = async () => {
      try {
        console.log(`[ResearcherDashboard] Fetching researcher ID from: ${API_BASE_URL}/api/researcher/debug-id`);
        const response = await fetch(`${API_BASE_URL}/api/researcher/debug-id`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log(`[ResearcherDashboard] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ResearcherDashboard] Error response: ${errorText}`);
          throw new Error(`Backend returned ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log(`[ResearcherDashboard] Got researcher ID: ${data.researcher_id}`);
        setResearcherId(data.researcher_id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load researcher ID";
        console.error("[ResearcherDashboard] Error fetching researcher ID:", err);

        // Provide more helpful error message
        let userMessage = errorMessage;
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          userMessage = `Cannot connect to backend at ${API_BASE_URL}. Make sure the backend is running:\n\npython3 -m flask --app backend.app run --host 0.0.0.0 --port ${BACKEND_PORT}`;
        }

        setError(userMessage);
        setLoading(false);
      }
    };

    fetchResearcherId();
  }, []);

  // Then, fetch projects once we have the researcher ID
  useEffect(() => {
    if (!researcherId) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/researcher/${researcherId}/projects`);

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects");
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [researcherId]);
=======
import GradientBackground from "../components/GradientBackground";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getApiUrl } from "../api/config";

interface Project {
  project_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string | null;
}

interface Run {
  run_id: string;
  project_id: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  started_at: string | null;
  completed_at: string | null;
  worker_count?: number;
}

export default function ResearcherDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [runsByProject, setRunsByProject] = useState<Record<string, Run[]>>({});
  const [runStatus, setRunStatus] = useState<Record<string, Run>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const base = getApiUrl();
>>>>>>> annabella/result-verification

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/projects`);
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [base]);

  const fetchRuns = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`${base}/api/projects/${projectId}/runs`);
      if (!res.ok) return;
      const data = await res.json();
      setRunsByProject((prev) => ({ ...prev, [projectId]: data.runs || [] }));
      (data.runs || []).forEach((r: Run) => {
        setRunStatus((prev) => ({ ...prev, [r.run_id]: r }));
      });
    } catch {
      /* ignore */
    }
  }, [base]);

  const fetchRunStatus = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`${base}/api/runs/${runId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setRunStatus((prev) => ({ ...prev, [runId]: data }));
    } catch {
      /* ignore */
    }
  }, [base]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    projects.forEach((p) => fetchRuns(p.project_id));
  }, [projects, fetchRuns]);

  const hasActiveRun = Object.values(runStatus).some(
    (r) => r.status === "running" || r.status === "pending"
  );
  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(() => {
      Object.entries(runStatus).forEach(([rid, r]) => {
        if (r.status === "running" || r.status === "pending") fetchRunStatus(rid);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasActiveRun, runStatus, fetchRunStatus]);

  const downloadResults = async (runId: string) => {
    try {
      const res = await fetch(`${base}/api/runs/${runId}/results/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${runId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <p style={{ fontSize: "18px", color: "#555" }}>Loading projects...</p>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <p style={{ color: "#c00", marginBottom: "16px" }}>{error}</p>
        <p style={{ fontSize: "14px", color: "#555" }}>Check Settings to set the correct API URL (e.g. http://localhost:5001).</p>
        <button
          onClick={() => { setLoading(true); fetchProjects(); }}
          style={{ marginTop: "12px", padding: "8px 16px", cursor: "pointer" }}
        >
          Retry
        </button>
      </GradientBackground>
    );
  }

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-6xl mx-auto w-full min-h-screen">
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
        <h1 className="text-4xl font-bold text-white/90 mb-10">
          Your Research Projects
        </h1>

<<<<<<< HEAD
        {loading && (
          <div className="text-center py-12 text-lg text-white/60">
            Loading projects...
          </div>
        )}

        {error && (
          <div className="text-left p-5 mb-6 rounded-2xl bg-red-500/10 border border-red-400/30 text-red-200 whitespace-pre-line font-mono text-sm">
            <strong>Error:</strong> {error}
            <div className="mt-4 text-xs text-red-300/90">
              <strong>Troubleshooting:</strong>
              <br />1. Check if backend is running: <code className="text-white/80">python3 -m flask --app backend.app run --host 0.0.0.0 --port {BACKEND_PORT}</code>
              <br />2. Test API: <code className="text-white/80">curl {API_BASE_URL}/</code>
              <br />3. Check browser console (F12) for more details
              <br />4. Verify API URL: {API_BASE_URL}
            </div>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12 text-lg text-white/60 rounded-2xl bg-white/5 border border-white/10">
            No projects found. Create your first project to get started!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full items-start">
        {projects.map((proj) => {
          const isComplete = proj.progress >= 100;

          return (
            <div
              key={proj.id}
              onClick={() => setExpanded(expanded === proj.id ? null : proj.id)}
              className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer h-fit transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-white/20"
            >
              <h2 className="text-xl font-semibold text-white/90 m-0">{proj.title}</h2>

              <p className="text-white/70 mt-2 text-[15px]">
                {proj.description}
              </p>

              {/* progress bar */}
              <div className="mt-4 rounded-lg h-3 w-full overflow-hidden bg-white/10">
                <div
                  className="h-full rounded-lg transition-[width] duration-400 ease-out"
                  style={{
                    width: `${proj.progress}%`,
                    backgroundColor: isComplete ? "rgba(52, 211, 153, 0.8)" : "rgba(96, 165, 250, 0.8)",
                  }}
                />
              </div>

              <p className="mt-1.5 text-white/70 text-sm">
                {proj.progress}% complete
              </p>

              {/* Contributor stats - always visible */}
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Total Contributors:</span>
                  <span className="font-semibold text-white/90">
                    {proj.totalContributors}
                  </span>
                </div>
                {isComplete ? (
                  <div className="flex justify-between">
                    <span className="text-white/60">Completed:</span>
                    <span className="font-semibold text-emerald-400/90">
                      {proj.completedContributors || proj.totalContributors}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-white/60">Active Now:</span>
                    <span className="font-semibold text-blue-400/90">
                      {proj.activeContributors}
                    </span>
                  </div>
                )}
              </div>

              {/* Task stats for in-progress projects - always visible */}
              {!isComplete && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-white/60">Tasks Completed:</span>
                    <span className="font-semibold text-emerald-400/90">
                      {proj.completedTasks.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-white/60">Tasks Remaining:</span>
                    <span className="font-semibold text-amber-400/90">
                      {(
                        proj.totalTasks -
                        proj.completedTasks -
                        proj.failedTasks
                      ).toLocaleString()}
                    </span>
                  </div>
                  {proj.failedTasks > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Tasks Failed:</span>
                      <span className="font-semibold text-red-400/90">
                        {proj.failedTasks}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded section */}
              {expanded === proj.id && (
                <div className="mt-5 pt-4 border-t border-white/10 animate-[fadeIn_0.3s_ease-in]">
                  <p className="text-white/80 mb-4">
                    {isComplete
                      ? "This project has finished computing."
                      : "This project is still processing across volunteer devices."}
                  </p>

                  {/* Task Statistics */}
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Task Statistics</h3>
                    <p className="text-xs text-white/60 m-0 mb-2 italic">
                      Breakdown of computational tasks that process your data chunks
                    </p>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white/60">Completed:</span>
                        <span className="font-semibold text-emerald-400/90">{proj.completedTasks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white/60">Remaining (pending/assigned):</span>
                        <span className="font-semibold text-amber-400/90">
                          {(proj.totalTasks - proj.completedTasks - proj.failedTasks).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 m-0 mb-1.5 pl-1">Tasks waiting to be processed or currently being worked on by volunteers</p>
                      {proj.failedTasks > 0 && (
                        <>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-white/60">Failed:</span>
                            <span className="font-semibold text-red-400/90">{proj.failedTasks}</span>
                          </div>
                          <p className="text-[11px] text-white/50 m-0 mb-1.5 pl-1">Tasks that encountered errors and may be retried automatically</p>
                        </>
                      )}
                      <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                        <span className="text-white/60">Total Tasks:</span>
                        <span className="font-semibold text-white/90">{proj.totalTasks.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Metadata */}
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Project Details</h3>
                    <p className="text-xs text-white/60 m-0 mb-2 italic">Administrative information about your project lifecycle</p>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white/60">Total Runs:</span>
                        <span className="font-semibold text-white/90">{proj.totalRuns}</span>
                      </div>
                      <p className="text-[11px] text-white/50 m-0 mb-1.5 pl-1">Number of times this project has been executed</p>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white/60">Created:</span>
                        <span className="font-medium text-white/90">{new Date(proj.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Last Updated:</span>
                        <span className="font-medium text-white/90">{new Date(proj.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1.5 pl-1">When the project was created and last had activity</p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {proj.averageTaskTime && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/20">
                      <h3 className="text-base font-semibold text-white/90 m-0 mb-2">Performance</h3>
                      <div className="text-sm flex justify-between">
                        <span className="text-white/60">Avg Task Time:</span>
                        <span className="font-semibold text-white/90">{proj.averageTaskTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  )}

                  {/* Download button for completed projects */}
                  {isComplete && proj.resultUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadResults(proj.resultUrl!);
                      }}
                      className="w-full mt-3 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 text-white font-medium cursor-pointer transition-colors"
                    >
                      Download Results
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </ConstellationStarfieldBackground>
=======
      {projects.length === 0 ? (
        <p style={{ color: "#555" }}>No projects yet. Submit a project from the Researcher home.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", maxWidth: "800px" }}>
          {projects.map((proj) => {
            const runs = runsByProject[proj.project_id] || [];
            const expanded = expandedProject === proj.project_id;
            return (
              <div
                key={proj.project_id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  color: "black",
                }}
              >
                <div
                  onClick={() => setExpandedProject(expanded ? null : proj.project_id)}
                  style={{ cursor: "pointer" }}
                >
                  <h2 style={{ fontSize: "20px", margin: 0 }}>{proj.title}</h2>
                  <p style={{ color: "#555", marginTop: "8px", fontSize: "15px" }}>
                    {proj.description || "—"}
                  </p>
                  <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
                    {runs.length} run{runs.length !== 1 ? "s" : ""} <span style={{ color: "#888", fontWeight: "normal" }}>(jobs)</span> · {expanded ? "▼" : "▶"}
                    {" · "}
                    <Link to={`/project/${proj.project_id}`} style={{ color: "black" }} onClick={(e) => e.stopPropagation()}>
                      View details
                    </Link>
                  </p>
                </div>

                {expanded && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
                    {runs.length === 0 ? (
                      <p style={{ color: "#666", fontSize: "14px" }}>No runs yet.</p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {runs.map((run) => {
                          const status = runStatus[run.run_id] || run;
                          const total = status.total_tasks || 1;
                          const progress = Math.round(((status.completed_tasks || 0) / total) * 100);
                          const isComplete = status.status === "completed";
                          return (
                            <li
                              key={run.run_id}
                              style={{
                                marginBottom: "12px",
                                padding: "12px",
                                background: "#f9f9f9",
                                borderRadius: "8px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                <span>
                                  <strong title="One execution (job) of this project">Run:</strong> {run.run_id.slice(0, 20)}… · {status.status}
                                  {status.worker_count != null && (
                                    <span style={{ marginLeft: "8px", color: "#555" }} title="Volunteer nodes connected to the cluster (excluding head)">
                                      ({status.worker_count} connected worker{status.worker_count !== 1 ? "s" : ""})
                                    </span>
                                  )}
                                </span>
                                {isComplete && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); downloadResults(run.run_id); }}
                                    style={{
                                      padding: "8px 16px",
                                      background: "black",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Download results
                                  </button>
                                )}
                              </div>
                              <div
                                style={{
                                  marginTop: "8px",
                                  height: "8px",
                                  background: "#eee",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    background: isComplete ? "#2ecc71" : "#3498db",
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }} title="Tasks completed so far (updates as the run progresses)">
                                {status.completed_tasks ?? 0} of {total} tasks completed
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "40px" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          ← Back to Home
        </a>
      </div>
    </GradientBackground>
>>>>>>> annabella/result-verification
  );
}
