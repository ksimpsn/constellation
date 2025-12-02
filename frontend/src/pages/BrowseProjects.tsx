import GradientBackground from "../components/GradientBackground";
import { useState } from "react";

interface Project {
  id: number;
  title: string;
  description: string;
}

const sampleProjects: Project[] = [
  { id: 1, title: "Protein Folding Simulation", description: "Crowdsourced molecular dynamics simulations to explore protein stability." },
  { id: 2, title: "Climate Modeling", description: "Distributed computation of regional weather predictions using ensemble models." },
  { id: 3, title: "AI for Drug Discovery", description: "GPU-assisted virtual screening on user devices to accelerate compound searches." },
  { id: 4, title: "Genomic Variant Mapping", description: "Mapping millions of short reads to detect rare mutations." },
  { id: 5, title: "Dark Matter Particle Search", description: "Distributed Monte Carlo models to simulate particle interactions." },
  { id: 6, title: "Brain-Computer Interface Research", description: "Neural signal processing using federated learning." },
];

export default function BrowseProjects() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <GradientBackground>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>Browse Research Projects</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
          width: "100%",
        }}
      >
        {sampleProjects.map((proj) => (
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
                marginTop: "10px",
                color: "#444",
                fontSize: "15px",
              }}
            >
              {expanded === proj.id
                ? proj.description
                : proj.description.substring(0, 60) + "..."}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <a href="/" style={{ fontSize: "18px", color: "black" }}>← Back to Home</a>
      </div>
    </GradientBackground>
  );
}
