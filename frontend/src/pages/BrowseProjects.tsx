import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import AppNav from "../components/AppNav";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

interface LearnMoreLink {
  label: string;
  url: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  longDescription?: string;
  whyJoin: string[];
  learnMore: LearnMoreLink[];
}

const sampleProjects: Project[] = [
  {
    id: 1,
    title: "Protein Folding Simulation",
    description: "Crowdsourced molecular dynamics simulations to explore protein stability.",
    longDescription: "We run large-scale molecular dynamics simulations to understand how proteins fold and interact. Your device helps explore conformations that could lead to new treatments for diseases from Alzheimer's to cancer.",
    whyJoin: ["Directly advance basic science that underpins drug discovery.", "Results are published openly; contributors are acknowledged.", "No special hardware needed—runs on everyday laptops and desktops."],
    learnMore: [
      { label: "Project overview (Folding@home)", url: "https://foldingathome.org/" },
      { label: "Protein folding & disease", url: "https://www.nature.com/articles/s41576-019-0093-7" },
    ],
  },
  {
    id: 2,
    title: "Climate Modeling",
    description: "Distributed computation of regional weather predictions using ensemble models.",
    longDescription: "Regional climate models need huge amounts of compute. We run ensemble forecasts to improve predictions for droughts, floods, and extreme heat so communities can plan better.",
    whyJoin: ["Improve climate resilience for vulnerable regions.", "Support open climate science used by policymakers.", "Your contribution is credited in project publications."],
    learnMore: [
      { label: "Climate modeling basics", url: "https://climate.nasa.gov/nasa_science/climate_modeling/" },
      { label: "Ensemble forecasting", url: "https://www.ecmwf.int/en/forecasts/documentation-and-support/ensemble-forecasts" },
    ],
  },
  {
    id: 3,
    title: "AI for Drug Discovery",
    description: "GPU-assisted virtual screening on user devices to accelerate compound searches.",
    longDescription: "We screen millions of molecules against disease targets using distributed GPUs and CPUs. Your contribution can help identify candidate drugs faster and at lower cost.",
    whyJoin: ["Accelerate the search for new medicines.", "Open-source pipeline; results shared with the research community.", "GPU optional—CPU-only participation welcome."],
    learnMore: [
      { label: "Virtual screening in drug discovery", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6096023/" },
      { label: "AI in pharmaceutical research", url: "https://www.nature.com/articles/s41573-019-0024-5" },
    ],
  },
  {
    id: 4,
    title: "Genomic Variant Mapping",
    description: "Mapping millions of short reads to detect rare mutations.",
    longDescription: "We align sequencing reads to reference genomes and call variants. This helps find rare disease mutations and understand population genetics—all while keeping data privacy-preserving.",
    whyJoin: ["Support rare disease and cancer genomics research.", "Privacy-first: only computed results leave your device.", "Part of consortia that publish in top journals."],
    learnMore: [
      { label: "Genome mapping explained", url: "https://www.genome.gov/about-genomics/fact-sheets/Genome-Mapping-Fact-Sheet" },
      { label: "Rare disease genomics", url: "https://www.nature.com/articles/s41576-019-0093-7" },
    ],
  },
  {
    id: 5,
    title: "Dark Matter Particle Search",
    description: "Distributed Monte Carlo models to simulate particle interactions.",
    longDescription: "Monte Carlo simulations help us interpret data from dark matter experiments. Your CPU runs millions of collision scenarios so we can tell signal from background.",
    whyJoin: ["Contribute to one of physics' biggest open questions.", "Fully open data and methods; results are reproducible.", "No physics background required—just spare compute."],
    learnMore: [
      { label: "What is dark matter?", url: "https://home.cern/science/physics/dark-matter" },
      { label: "Monte Carlo in particle physics", url: "https://arxiv.org/abs/hep-ph/0409146" },
    ],
  },
  {
    id: 6,
    title: "Brain-Computer Interface Research",
    description: "Neural signal processing using federated learning.",
    longDescription: "We train and evaluate models for decoding brain signals—for assistive devices and basic neuroscience—using federated learning so raw data never leaves the hospital.",
    whyJoin: ["Help advance assistive tech for people with paralysis.", "Privacy-preserving: only model updates are shared.", "Interdisciplinary team; volunteers are recognized."],
    learnMore: [
      { label: "Brain–computer interfaces (NIH)", url: "https://www.ninds.nih.gov/health-information/public-education/brain-basics/brain-basics-know-your-brain" },
      { label: "Federated learning overview", url: "https://ai.googleblog.com/2017/04/federated-learning-collaborative.html" },
    ],
  },
  {
    id: 7,
    title: "Ocean Acidification Study",
    description: "Long-term ocean chemistry modeling to understand ecosystem impact.",
    longDescription: "We model how rising CO₂ changes ocean chemistry and affects shellfish, coral, and food webs. Long-running simulations need distributed compute to explore scenarios.",
    whyJoin: ["Direct impact on marine conservation and fisheries policy.", "Open models and open data for global researchers.", "Suitable for long, low-priority runs on any machine."],
    learnMore: [
      { label: "Ocean acidification (NOAA)", url: "https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification" },
      { label: "Impacts on marine life", url: "https://www.ipcc.ch/report/ar6/wg2/" },
    ],
  },
  {
    id: 8,
    title: "CRISPR Off-Target Prediction",
    description: "Machine learning to predict and reduce off-target gene editing effects.",
    longDescription: "We train and run models that predict where CRISPR might cut besides the intended site. Better predictions mean safer gene therapies and crops.",
    whyJoin: ["Make gene editing safer for clinical and agricultural use.", "Models are open; you help improve a global tool.", "CPU-only; runs on any modern processor."],
    learnMore: [
      { label: "CRISPR explained", url: "https://www.broadinstitute.org/what-broad/areas-research/project-spotlight/crispr" },
      { label: "Off-target effects", url: "https://www.nature.com/articles/s41576-019-0093-7" },
    ],
  },
  {
    id: 9,
    title: "Federated Medical Imaging",
    description: "Privacy-preserving analysis of medical images across institutions.",
    longDescription: "Hospitals keep data local; we train diagnostic models by aggregating only model updates. Your device can run training rounds or evaluation tasks.",
    whyJoin: ["Advance medical AI without moving patient data.", "Aligned with strict privacy and ethics guidelines.", "Contributors acknowledged in papers and tools."],
    learnMore: [
      { label: "Federated learning in healthcare", url: "https://www.nature.com/articles/s41551-021-00803-1" },
      { label: "Medical imaging AI", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6364151/" },
    ],
  },
  {
    id: 10,
    title: "Quantum Chemistry Simulations",
    description: "Distributed ab initio calculations for molecular properties.",
    longDescription: "We run quantum chemistry calculations to predict molecular energies, spectra, and reactivity. Distributed compute lets us study larger systems and longer timescales.",
    whyJoin: ["Push the limits of computational chemistry.", "Results feed into materials and drug design.", "Batch-friendly; run when your machine is idle."],
    learnMore: [
      { label: "Computational chemistry basics", url: "https://www.acs.org/careers/chemical-sciences/areas/computational-chemistry.html" },
      { label: "Ab initio methods", url: "https://en.wikipedia.org/wiki/Ab_initio_quantum_chemistry_methods" },
    ],
  },
  {
    id: 11,
    title: "Wildlife Migration Tracking",
    description: "Satellite and sensor data fusion to model species migration.",
    longDescription: "We combine satellite imagery, GPS tags, and environmental data to model where species move and why. This supports conservation planning and policy.",
    whyJoin: ["Support conservation and biodiversity science.", "Data and code are open for education and research.", "Flexible workload; good for variable availability."],
    learnMore: [
      { label: "Wildlife tracking technology", url: "https://www.movebank.org/" },
      { label: "Migration & conservation", url: "https://www.conservation.org/priorities/wildlife-migration" },
    ],
  },
  {
    id: 12,
    title: "Renewable Grid Optimization",
    description: "Real-time optimization of renewable energy dispatch and storage.",
    longDescription: "We optimize how wind, solar, and storage are dispatched across grids under uncertainty. Your compute helps run thousands of scenarios for planning and operations.",
    whyJoin: ["Accelerate the transition to clean energy.", "Used by researchers and grid operators worldwide.", "Deterministic runs; reproducible and citable."],
    learnMore: [
      { label: "Grid integration of renewables", url: "https://www.nrel.gov/grid/renewable-energy-integration.html" },
      { label: "Energy storage & optimization", url: "https://www.energy.gov/oe/energy-storage" },
    ],
  },
];

export default function BrowseProjects() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return sampleProjects;
    const q = search.trim().toLowerCase();
    return sampleProjects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <ConstellationStarfieldBackground>
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      <div className="px-6 py-24 pt-28 max-w-6xl mx-auto w-full min-h-screen flex flex-col">
        <h1 className="text-4xl font-bold text-white/90 mb-4">Browse Research Projects</h1>
        <p className="text-white/70 mb-6">Click a project to learn more, then contribute your CPU if you’d like to join.</p>

        <div className="mb-6">
          <label htmlFor="browse-search" className="sr-only">
            Search projects
          </label>
          <input
            id="browse-search"
            type="search"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/95 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
          />
        </div>

        <div
          className="flex-1 overflow-y-auto grid gap-5 w-full pb-12"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {filteredProjects.length === 0 ? (
            <p className="col-span-full text-white/60 py-8">No projects match your search. Try different keywords.</p>
          ) : (
            filteredProjects.map((proj) => {
              const isExpanded = expandedId === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`rounded-xl backdrop-blur-sm border transition-all flex flex-col overflow-hidden ${
                    isExpanded
                      ? "bg-white/10 border-white/25 shadow-[0_0_32px_rgba(255,255,255,0.08)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                  onClick={() => !isExpanded && setExpandedId(proj.id)}
                >
                  <div className="p-5" onClick={(e) => isExpanded && e.stopPropagation()}>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-xl font-semibold text-white/90 m-0">{proj.title}</h2>
                      {isExpanded && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {!isExpanded ? (
                      <p className="mt-2.5 text-white/70 text-[15px] line-clamp-2">
                        {proj.description}
                      </p>
                    ) : (
                      <div className="mt-4 space-y-5">
                        <p className="text-white/80 text-[15px] leading-relaxed">
                          {proj.longDescription || proj.description}
                        </p>
                        <div>
                          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">
                            Why be part of this project
                          </h3>
                          <ul className="list-none p-0 m-0 space-y-1.5">
                            {proj.whyJoin.map((reason, i) => (
                              <li key={i} className="flex gap-2 text-white/75 text-[14px] leading-relaxed">
                                <span className="text-emerald-400/90 shrink-0">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {proj.learnMore.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-2">
                              Learn more
                            </h3>
                            <ul className="list-none p-0 m-0 flex flex-wrap gap-2">
                              {proj.learnMore.map((link, i) => (
                                <li key={i}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-sm no-underline transition-colors"
                                  >
                                    {link.label}
                                    <span className="text-xs opacity-70" aria-hidden>↗</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Link
                          to={`/project/${encodeURIComponent(proj.title)}`}
                          className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium no-underline transition-all duration-200 text-sm mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Contribute CPU to this project
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4">
          <Link to="/dashboard" className="text-white/70 hover:text-white transition-colors no-underline">
            ← Back to Dashboard
          </Link>
          <Link to="/" className="text-white/70 hover:text-white transition-colors no-underline">
            Home
          </Link>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
