import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Delaunay } from 'd3-delaunay';
import FlowNav from '../components/FlowNav';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';

type Task = { id: number; title: string; description: string };

type ConstellationStar = { id: number; x: number; y: number; isYours: boolean };

const projectData: Record<
  string,
  { name: string; progress: number; completedTasks: Task[]; researchPaperUrl?: string }
> = {
  'NeuroStream': {
    name: 'NeuroStream: Adaptive Modeling',
    progress: 60,
    completedTasks: [
      { id: 1, title: 'Batch 12 — Signal preprocessing', description: 'Preprocessed 10,000 EEG segments and normalized time windows for the adaptive model.' },
      { id: 2, title: 'Batch 18 — Feature extraction', description: 'Computed spectral features and connectivity matrices for a subset of the cohort.' },
      { id: 3, title: 'Batch 21 — Validation run', description: 'Ran cross-validation fold 3 and wrote accuracy metrics to the shared results store.' },
    ],
  },
  'HelixCompute': {
    name: 'HelixCompute: Task-Sharding',
    progress: 40,
    completedTasks: [
      { id: 1, title: 'Shard 4 — Sequence chunk', description: 'Processed sequence chunk 4 of 20 for the designated genome region.' },
      { id: 2, title: 'Shard 9 — Alignment pass', description: 'Performed alignment pass and reported scores to the coordinator.' },
    ],
  },
  'AuroraML': {
    name: 'AuroraML: Diagnostic Prediction',
    progress: 80,
    completedTasks: [
      { id: 1, title: 'Epoch 2 — Gradient update', description: 'Computed gradients and updated weights for the diagnostic classifier.' },
      { id: 2, title: 'Epoch 5 — Validation', description: 'Ran validation batch and logged F1 score to the experiment tracker.' },
      { id: 3, title: 'Epoch 8 — Checkpoint', description: 'Saved model checkpoint and sent metadata to the central job queue.' },
      { id: 4, title: 'Epoch 11 — Inference slice', description: 'Ran inference on 500 held-out samples and wrote predictions to storage.' },
    ],
  },
  'Berlin Marathon Analytics': {
    name: 'Berlin Marathon Analytics',
    progress: 100,
    researchPaperUrl: '/research/berlin-marathon',
    completedTasks: [
      { id: 1, title: 'Segment A — GPS cleanup', description: 'Cleaned and interpolated GPS traces for 2,000 runners in segment A.' },
      { id: 2, title: 'Segment B — Pace curves', description: 'Computed per-kilometer pace curves and flagged anomalies.' },
      { id: 3, title: 'Segment C — Aggregation', description: 'Aggregated segment statistics and wrote to the project results table.' },
      { id: 4, title: 'Segment D — Visualization data', description: 'Prepared time-series data for the public dashboard visualizations.' },
      { id: 5, title: 'Final — Summary stats', description: 'Computed final summary statistics and closed the project result set.' },
    ],
  },
  'Deep Learning Research': {
    name: 'Deep Learning Research',
    progress: 100,
    researchPaperUrl: '/research/deep-learning',
    completedTasks: [
      { id: 1, title: 'Task 1 — Data load', description: 'Loaded and preprocessed image batch for the training pipeline.' },
      { id: 2, title: 'Task 2 — Forward pass', description: 'Ran forward pass and computed loss for the batch.' },
      { id: 3, title: 'Task 3 — Backward pass', description: 'Computed gradients and updated model parameters.' },
    ],
  },
  'PTSD Detection Model': {
    name: 'PTSD Detection Model',
    progress: 100,
    researchPaperUrl: '/research/ptsd-detection',
    completedTasks: [
      { id: 1, title: 'Transcript 7 — Embedding', description: 'Generated embeddings for transcript 7 using the shared encoder.' },
      { id: 2, title: 'Transcript 14 — Classification', description: 'Ran classification and recorded confidence scores for the study.' },
    ],
  },
  'Protein Folding Simulation': { name: 'Protein Folding Simulation', progress: 35, completedTasks: [] },
  'Climate Modeling': { name: 'Climate Modeling', progress: 22, completedTasks: [] },
  'AI for Drug Discovery': { name: 'AI for Drug Discovery', progress: 58, completedTasks: [] },
  'Genomic Variant Mapping': { name: 'Genomic Variant Mapping', progress: 41, completedTasks: [] },
  'Dark Matter Particle Search': { name: 'Dark Matter Particle Search', progress: 18, completedTasks: [] },
  'Brain-Computer Interface Research': { name: 'Brain-Computer Interface Research', progress: 67, completedTasks: [] },
  'Ocean Acidification Study': { name: 'Ocean Acidification Study', progress: 12, completedTasks: [] },
  'CRISPR Off-Target Prediction': { name: 'CRISPR Off-Target Prediction', progress: 29, completedTasks: [] },
  'Federated Medical Imaging': { name: 'Federated Medical Imaging', progress: 55, completedTasks: [] },
  'Quantum Chemistry Simulations': { name: 'Quantum Chemistry Simulations', progress: 8, completedTasks: [] },
  'Wildlife Migration Tracking': { name: 'Wildlife Migration Tracking', progress: 73, completedTasks: [] },
  'Renewable Grid Optimization': { name: 'Renewable Grid Optimization', progress: 44, completedTasks: [] },
};

// Default for unknown project
const defaultProject = {
  name: 'Unknown Project',
  progress: 0,
  completedTasks: [] as Task[],
  researchPaperUrl: undefined as string | undefined,
};

export default function ProjectDetails() {
  const { projectName } = useParams<{ projectName: string }>();
  const project = projectData[projectName || ''] ?? defaultProject;
  const tasks = project.completedTasks;
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);

  const { starPositions, lines, numYourStars } = useMemo((): {
    starPositions: ConstellationStar[];
    lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
    numYourStars: number;
  } => {
    const numYour = tasks.length;
    const numOther = 32; // white stars = other people's tasks
    const total = numYour + numOther;

    const seed = (projectName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = (i: number, j: number, offset: number) => {
      const x = Math.sin(seed + offset + i * 7 + j * 13) * 10000;
      return x - Math.floor(x);
    };

    // Your tasks (yellow) — cluster slightly left-of-center
    const yourPositions = Array.from({ length: numYour }, (_, i) => ({
      id: i,
      x: 20 + rnd(i, 0, 0) * 55,
      y: 20 + rnd(i, 1, 0) * 60,
      isYours: true as const,
    }));

    // Other people's tasks (white) — fill the rest of the sky
    const otherPositions = Array.from({ length: numOther }, (_, i) => ({
      id: numYour + i,
      x: 10 + rnd(i, 0, 100) * 80,
      y: 10 + rnd(i, 1, 100) * 80,
      isYours: false as const,
    }));

    const positions = [...yourPositions, ...otherPositions];

    if (total === 0) {
      return { starPositions: [], lines: [], numYourStars: 0 };
    }

    // Constellation-like: Delaunay triangulation (planar, no crossing lines) then MST for a branching shape
    const points = positions.map((p) => [p.x, p.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const tri = delaunay.triangles;
    const edgeMap = new Map<string, { a: number; b: number; lenSq: number }>();
    for (let t = 0; t < tri.length; t += 3) {
      const add = (a: number, b: number) => {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (edgeMap.has(key)) return;
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        edgeMap.set(key, { a, b, lenSq: dx * dx + dy * dy });
      };
      add(tri[t], tri[t + 1]);
      add(tri[t + 1], tri[t + 2]);
      add(tri[t + 2], tri[t]);
    }
    const edges = Array.from(edgeMap.values()).sort((e, f) => e.lenSq - f.lenSq);
    const parent = positions.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const lineList: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (const { a, b } of edges) {
      if (find(a) === find(b)) continue;
      parent[find(a)] = find(b);
      const pa = positions[a];
      const pb = positions[b];
      lineList.push({ x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y });
    }

    return { starPositions: positions, lines: lineList, numYourStars: numYour };
  }, [projectName, tasks.length]);

  const isComplete = project.progress === 100;
  const hasTasks = tasks.length > 0;
  const hasAnyStars = starPositions.length > 0;

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 h-screen flex flex-col overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-start justify-between gap-4 shrink-0 mb-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white no-underline text-base font-medium px-4 py-2.5 rounded-lg border border-white/40 hover:border-white/60 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <header className="shrink-0 mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">Your contribution</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-0 mb-1">
            {project.name}
          </h1>
          <p className="text-white/60 text-sm">
            {hasTasks
              ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} completed by you — each star is one task.`
              : 'Complete tasks to add stars to your constellation.'}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {/* Constellation */}
          <div className="flex-1 min-h-0 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden relative">
            {hasAnyStars ? (
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                  </linearGradient>
                  <filter id="starGlowYellow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="starGlowWhite" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Lines first so they sit under stars */}
                {lines.map((line, i) => (
                  <line
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="url(#lineGrad)"
                    strokeWidth="0.6"
                    className="transition-opacity duration-300"
                    style={{ opacity: hoveredTaskIndex === null ? 1 : 0.25 }}
                  />
                ))}
                {/* Stars in same coordinate system so lines meet them */}
                {starPositions.map((star, i) => {
                  const isYours = star.isYours;
                  const isHovered = isYours && hoveredTaskIndex === i;
                  const isDimmed = hoveredTaskIndex !== null && !(isYours && hoveredTaskIndex === i);
                  const r = isYours ? (isHovered ? 1.8 : 1.2) : 0.65;
                  const fill = isYours ? '#fef08a' : 'rgba(255,255,255,0.95)';
                  const filter = isYours ? 'url(#starGlowYellow)' : 'url(#starGlowWhite)';
                  return (
                    <circle
                      key={star.id}
                      cx={star.x}
                      cy={star.y}
                      r={r}
                      fill={fill}
                      filter={filter}
                      className="transition-all duration-300 pointer-events-none"
                      style={{ opacity: isDimmed ? 0.25 : 1 }}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/40 text-sm text-center px-4">
                  No tasks completed yet. Contribute to this project from your dashboard to add stars here.
                </p>
              </div>
            )}
          </div>

          {/* Progress + task list + description */}
          <div className="lg:w-[360px] shrink-0 flex flex-col gap-4 min-h-0 overflow-y-auto">
            {/* Project progress — first */}
            <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-5 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-white/90">Project progress</span>
                <span className="text-2xl font-bold text-white tabular-nums ml-auto">
                  {project.progress}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${project.progress}%`,
                    background: isComplete
                      ? 'linear-gradient(90deg, rgba(52,211,153,0.85), rgba(110,231,183,0.85))'
                      : 'linear-gradient(90deg, #a78bfa, #818cf8)',
                  }}
                />
              </div>
              {isComplete ? (
                <>
                  <p className="text-white/90 text-sm mt-4">
                    You made this possible. You're a star!
                  </p>
                  <Link
                    to={project.researchPaperUrl ?? '/browse'}
                    className="inline-flex items-center gap-2 mt-3 px-5 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-400/85 hover:to-emerald-500/85 no-underline"
                  >
                    Get early access to this research
                  </Link>
                </>
              ) : (
                <p className="text-white/55 text-sm mt-3">
                  Keep contributing to add more stars.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/10 overflow-hidden shrink-0">
              <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-5 py-3.5 border-b border-white/10">
                Tasks you completed
              </h2>
              {hasTasks ? (
                <ul className="list-none p-0 m-0 max-h-[180px] overflow-y-auto">
                  {tasks.map((task, i) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredTaskIndex(i)}
                        onMouseLeave={() => setHoveredTaskIndex(null)}
                        className={`w-full text-left px-5 py-3 flex items-center gap-3 border-b border-white/5 last:border-0 transition-colors cursor-pointer ${
                          hoveredTaskIndex === i
                            ? 'bg-amber-500/15 border-l-2 border-l-amber-400/60'
                            : 'hover:bg-white/5 border-l-2 border-l-transparent'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 bg-amber-400"
                          aria-hidden
                        />
                        <span className="text-sm font-medium text-white/95 truncate">
                          {task.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/45 text-sm px-5 py-5">No completed tasks yet.</p>
              )}
            </div>

            {hasTasks && hoveredTaskIndex !== null && tasks[hoveredTaskIndex] && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4 shrink-0 transition-opacity duration-200">
                <p className="text-xs font-semibold text-amber-200/90 uppercase tracking-wider mb-2">
                  What this task did
                </p>
                <p className="text-sm text-white/90 leading-relaxed line-clamp-4">
                  {tasks[hoveredTaskIndex].description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
