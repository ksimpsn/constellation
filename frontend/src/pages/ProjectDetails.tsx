import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GradientBackground from "../components/GradientBackground";
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
  status: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  worker_count?: number;
}

export default function ProjectDetails() {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const projectId = projectName ?? "";
  const base = getApiUrl();

  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [liveRunStatus, setLiveRunStatus] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError("No project ID");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [projRes, runsRes] = await Promise.all([
          fetch(`${base}/api/projects/${projectId}`),
          fetch(`${base}/api/projects/${projectId}/runs`),
        ]);
        if (!projRes.ok) {
          setError("Project not found");
          setProject(null);
          return;
        }
        const projData = await projRes.json();
        const runsData = await runsRes.json();
        if (!cancelled) {
          setProject(projData);
          setRuns(runsData.runs || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load project");
          setProject(null);
          setRuns([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, base]);

  const latestRun = runs[0];
  const isActiveRun = latestRun && (latestRun.status === "running" || latestRun.status === "pending");
  const isTerminal = (s: string) => s === "completed" || s === "failed" || s === "cancelled";

  useEffect(() => {
    if (!latestRun) {
      setLiveRunStatus(null);
      return;
    }
    if (liveRunStatus && isTerminal(liveRunStatus.status)) return;
    if (!isActiveRun) {
      setLiveRunStatus(null);
      return;
    }
    const runId = latestRun.run_id;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/api/runs/${runId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        setLiveRunStatus(data);
      } catch {
        /* ignore */
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [latestRun?.run_id, isActiveRun, base, liveRunStatus?.status]);

  if (loading) {
    return (
      <GradientBackground>
        <p style={{ fontSize: "18px", color: "#555" }}>Loading project...</p>
      </GradientBackground>
    );
  }

  if (error || !project) {
    return (
      <GradientBackground>
        <p style={{ color: "#c00" }}>{error || "Project not found"}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "12px", padding: "8px 16px", cursor: "pointer" }}>
          ← Back
        </button>
      </GradientBackground>
    );
  }

  const displayRun = liveRunStatus ?? latestRun;
  const total = displayRun?.total_tasks ?? 1;
  const progress = displayRun ? Math.round(((displayRun.completed_tasks ?? 0) / total) * 100) : 0;

  return (
    <GradientBackground>
      <div style={{ maxWidth: "700px", width: "100%", padding: "20px" }}>
        <button
          onClick={() => navigate("/researcher")}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            background: "rgba(255,255,255,0.9)",
            color: "black",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "black" }}>{project.title}</h1>
        <p style={{ color: "#555", marginBottom: "24px", fontSize: "16px" }}>
          {project.description || "—"}
        </p>
        {latestRun && (
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", color: "black", marginBottom: "16px" }}>
            <div style={{ marginBottom: "8px" }}>
              <strong title="One execution (job) of this project">Latest run:</strong> {displayRun.status}
              {displayRun.worker_count != null && (
                <span style={{ marginLeft: "8px", color: "#555" }} title="Volunteer nodes connected to the cluster">({displayRun.worker_count} connected worker{displayRun.worker_count !== 1 ? "s" : ""})</span>
              )}
            </div>
            <div style={{ height: "10px", background: "#eee", borderRadius: "5px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: displayRun.status === "completed" ? "#2e7d32" : "#2196F3",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ marginTop: "6px", fontSize: "14px", color: "#666" }}>
              {displayRun.completed_tasks ?? 0} of {total} tasks completed
            </p>
          </div>
        )}
        {runs.length === 0 && <p style={{ color: "#666" }}>No runs yet for this project.</p>}
      </div>
    </GradientBackground>
  );
}
