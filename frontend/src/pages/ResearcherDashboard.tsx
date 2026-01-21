import GradientBackground from "../components/GradientBackground";
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

// Try port 5000 first, fallback to 5001 (common on macOS due to AirPlay)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

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
          userMessage = `Cannot connect to backend at ${API_BASE_URL}. Make sure the backend is running:\n\npython3 -m flask --app backend.app run --host 0.0.0.0 --port 5000`;
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
    <GradientBackground>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>
        Your Research Projects
      </h1>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", fontSize: "18px", color: "#666" }}>
          Loading projects...
        </div>
      )}

      {error && (
        <div style={{
          textAlign: "left",
          padding: "20px",
          marginBottom: "20px",
          background: "#fee",
          borderRadius: "8px",
          color: "#c33",
          whiteSpace: "pre-line",
          fontFamily: "monospace",
          fontSize: "14px"
        }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: "15px", fontSize: "12px", color: "#a33" }}>
            <strong>Troubleshooting:</strong>
            <br />1. Check if backend is running: <code>python3 -m flask --app backend.app run --host 0.0.0.0 --port 5000</code>
            <br />2. Test API: <code>curl {API_BASE_URL}/</code>
            <br />3. Check browser console (F12) for more details
            <br />4. Verify API URL: {API_BASE_URL}
          </div>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", fontSize: "18px", color: "#666" }}>
          No projects found. Create your first project to get started!
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          width: "100%",
          alignItems: "start",
        }}
      >
        {projects.map((proj) => {
          const isComplete = proj.progress >= 100;

          return (
            <div
              key={proj.id}
              onClick={() => setExpanded(expanded === proj.id ? null : proj.id)}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                cursor: "pointer",
                height: "fit-content",
                transition: "box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
              }}
            >
              <h2 style={{ fontSize: "20px", margin: 0 }}>{proj.title}</h2>

              <p
                style={{
                  color: "#555",
                  marginTop: "8px",
                  fontSize: "15px",
                }}
              >
                {proj.description}
              </p>

              {/* progress bar */}
              <div
                style={{
                  marginTop: "15px",
                  background: "#eee",
                  borderRadius: "8px",
                  height: "12px",
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${proj.progress}%`,
                    height: "100%",
                    background: isComplete ? "#2ecc71" : "#3498db",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <p style={{ marginTop: "6px", color: "#444", fontSize: "14px" }}>
                {proj.progress}% complete
              </p>

              {/* Contributor stats - always visible */}
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ color: "#666" }}>Total Contributors:</span>
                  <span style={{ fontWeight: "600", color: "#333" }}>
                    {proj.totalContributors}
                  </span>
                </div>
                {isComplete ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#666" }}>Completed:</span>
                    <span style={{ fontWeight: "600", color: "#2ecc71" }}>
                      {proj.completedContributors || proj.totalContributors}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#666" }}>Active Now:</span>
                    <span style={{ fontWeight: "600", color: "#3498db" }}>
                      {proj.activeContributors}
                    </span>
                  </div>
                )}
              </div>

              {/* Task stats for in-progress projects - always visible */}
              {!isComplete && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#f0f4f8",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#666" }}>Tasks Completed:</span>
                    <span style={{ fontWeight: "600", color: "#2ecc71" }}>
                      {proj.completedTasks.toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#666" }}>Tasks Remaining:</span>
                    <span style={{ fontWeight: "600", color: "#e67e22" }}>
                      {(
                        proj.totalTasks -
                        proj.completedTasks -
                        proj.failedTasks
                      ).toLocaleString()}
                    </span>
                  </div>
                  {proj.failedTasks > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#666" }}>Tasks Failed:</span>
                      <span style={{ fontWeight: "600", color: "#e74c3c" }}>
                        {proj.failedTasks}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded section */}
              {expanded === proj.id && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "15px",
                    borderTop: "1px solid #ddd",
                    animation: "fadeIn 0.3s ease-in",
                  }}
                >
                  <p style={{ color: "#333", marginBottom: "15px" }}>
                    {isComplete
                      ? "This project has finished computing."
                      : "This project is still processing across volunteer devices."}
                  </p>

                  {/* Task Statistics */}
                  <div
                    style={{
                      marginBottom: "15px",
                      padding: "12px",
                      background: "#f0f4f8",
                      borderRadius: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        margin: "0 0 8px 0",
                        color: "#333",
                      }}
                    >
                      Task Statistics
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        margin: "0 0 10px 0",
                        fontStyle: "italic",
                      }}
                    >
                      Breakdown of computational tasks that process your data
                      chunks
                    </p>
                    <div style={{ fontSize: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ color: "#666" }}>Completed:</span>
                        <span style={{ fontWeight: "600", color: "#2ecc71" }}>
                          {proj.completedTasks.toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ color: "#666" }}>
                          Remaining (pending/assigned):
                        </span>
                        <span style={{ fontWeight: "600", color: "#e67e22" }}>
                          {(
                            proj.totalTasks -
                            proj.completedTasks -
                            proj.failedTasks
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#999",
                          margin: "0 0 6px 0",
                          paddingLeft: "4px",
                        }}
                      >
                        Tasks waiting to be processed or currently being worked
                        on by volunteers
                      </p>
                      {proj.failedTasks > 0 && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <span style={{ color: "#666" }}>Failed:</span>
                            <span
                              style={{ fontWeight: "600", color: "#e74c3c" }}
                            >
                              {proj.failedTasks}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#999",
                              margin: "0 0 6px 0",
                              paddingLeft: "4px",
                            }}
                          >
                            Tasks that encountered errors and may be retried
                            automatically
                          </p>
                        </>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid #ddd",
                        }}
                      >
                        <span style={{ color: "#666" }}>Total Tasks:</span>
                        <span style={{ fontWeight: "600", color: "#333" }}>
                          {proj.totalTasks.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Metadata */}
                  <div
                    style={{
                      marginBottom: "15px",
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        margin: "0 0 8px 0",
                        color: "#333",
                      }}
                    >
                      Project Details
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        margin: "0 0 10px 0",
                        fontStyle: "italic",
                      }}
                    >
                      Administrative information about your project lifecycle
                    </p>
                    <div style={{ fontSize: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ color: "#666" }}>Total Runs:</span>
                        <span style={{ fontWeight: "600", color: "#333" }}>
                          {proj.totalRuns}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#999",
                          margin: "0 0 6px 0",
                          paddingLeft: "4px",
                        }}
                      >
                        Number of times this project has been executed
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ color: "#666" }}>Created:</span>
                        <span style={{ fontWeight: "500", color: "#333" }}>
                          {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "#666" }}>Last Updated:</span>
                        <span style={{ fontWeight: "500", color: "#333" }}>
                          {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#999",
                          margin: "6px 0 0 0",
                          paddingLeft: "4px",
                        }}
                      >
                        When the project was created and last had activity
                      </p>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {proj.averageTaskTime && (
                    <div
                      style={{
                        marginBottom: "15px",
                        padding: "12px",
                        background: "#fff5e6",
                        borderRadius: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          margin: "0 0 10px 0",
                          color: "#333",
                        }}
                      >
                        Performance
                      </h3>
                      <div style={{ fontSize: "14px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "#666" }}>
                            Avg Task Time:
                          </span>
                          <span style={{ fontWeight: "600", color: "#333" }}>
                            {proj.averageTaskTime.toFixed(1)}s
                          </span>
                        </div>
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
                      style={{
                        padding: "10px 20px",
                        background: "black",
                        color: "white",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                        width: "100%",
                        marginTop: "10px",
                      }}
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

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>
          ← Back to Home
        </a>
      </div>
    </GradientBackground>
  );
}
