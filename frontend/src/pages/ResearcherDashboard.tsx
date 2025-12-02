import GradientBackground from "../components/GradientBackground";
import { useState } from "react";

interface ResearchProject {
  id: number;
  title: string;
  description: string;
  progress: number; // 0–100
  resultUrl?: string; // backend CSV/JSON download URL
}

const sampleResearchProjects: ResearchProject[] = [
  {
    id: 1,
    title: "Protein Folding Simulation",
    description: "Crowdsourced molecular dynamics simulations to explore protein stability.",
    progress: 100,
    resultUrl: "/results/protein-folding.json",
  },
  {
    id: 2,
    title: "Climate Modeling",
    description: "Distributed computation of regional weather predictions using ensemble models.",
    progress: 73,
  },
  {
    id: 3,
    title: "AI for Drug Discovery",
    description: "GPU-assisted virtual screening on user devices to accelerate compound searches.",
    progress: 41,
  },
];

export default function ResearcherDashboard() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const downloadResults = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>
        Your Research Projects
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {sampleResearchProjects.map((proj) => {
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

              {/* Expanded section */}
              {expanded === proj.id && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "15px",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  <p style={{ color: "#333", marginBottom: "10px" }}>
                    {isComplete
                      ? "This project has finished computing."
                      : "This project is still processing across volunteer devices."}
                  </p>

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
