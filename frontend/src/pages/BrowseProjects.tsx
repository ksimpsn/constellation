import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import AppNav from "../components/AppNav";
import { useState } from "react";
import { Link } from "react-router-dom";

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
    <ConstellationStarfieldBackground>
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      <div className="px-6 py-24 pt-28 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-white/90 mb-8">Browse Research Projects</h1>

        <div
          className="grid gap-5 w-full"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {sampleProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setExpanded(expanded === proj.id ? null : proj.id)}
              className="p-5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
            >
              <h2 className="text-xl font-semibold text-white/90 m-0">{proj.title}</h2>
              <p className="mt-2.5 text-white/70 text-[15px]">
                {expanded === proj.id
                  ? proj.description
                  : proj.description.substring(0, 60) + "..."}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/" className="text-lg text-white/70 hover:text-white transition-colors no-underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
