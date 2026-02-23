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

  const downloadResults = (url: string) => {
    window.open(url, "_blank");
  };

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
  );
}
