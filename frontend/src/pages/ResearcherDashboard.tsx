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
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>
        Your Research Projects
      </h1>

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
  );
}
