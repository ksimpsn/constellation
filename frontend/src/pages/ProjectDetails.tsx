import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppNav from '../components/AppNav';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';

const projectData: Record<string, { name: string; progress: number }> = {
  'NeuroStream': { name: 'NeuroStream: Adaptive Modeling', progress: 60 },
  'HelixCompute': { name: 'HelixCompute: Task-Sharding', progress: 40 },
  'AuroraML': { name: 'AuroraML: Diagnostic Prediction', progress: 80 },
  'Berlin Marathon Analytics': { name: 'Berlin Marathon Analytics', progress: 100 },
  'Deep Learning Research': { name: 'Deep Learning Research', progress: 100 },
  'PTSD Detection Model': { name: 'PTSD Detection Model', progress: 100 },
};

export default function ProjectDetails() {
  const { projectName } = useParams<{ projectName: string }>();
  const project = projectData[projectName || 'Berlin Marathon Analytics'] || { name: 'Unknown Project', progress: 0 };

  // Stable constellation: use project name as seed for consistent layout per project
  const { stars, lines } = useMemo(() => {
    const numOtherStars = 20;
    const totalStars = numOtherStars + 1;

    const seed = (projectName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRandom = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const stars = Array.from({ length: totalStars }, (_, i) => ({
      id: i,
      x: seededRandom(i * 3) * 80 + 10,
      y: seededRandom(i * 3 + 1) * 60 + 20,
      bright: i === 0,
    }));

    const linesList: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const usedPairs = new Set<string>();
    const connectedStars = new Set<number>([0]);

    for (let i = 1; i < stars.length; i++) {
      const closest = Array.from(connectedStars)
        .map((ci) => ({
          index: ci,
          distance: Math.sqrt((stars[i].x - stars[ci].x) ** 2 + (stars[i].y - stars[ci].y) ** 2),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (closest) {
        const pairKey = `${Math.min(i, closest.index)}-${Math.max(i, closest.index)}`;
        if (!usedPairs.has(pairKey)) {
          linesList.push({
            x1: stars[i].x,
            y1: stars[i].y,
            x2: stars[closest.index].x,
            y2: stars[closest.index].y,
          });
          usedPairs.add(pairKey);
          connectedStars.add(i);
        }
      }
    }

    return { stars, lines: linesList };
  }, [projectName]);

  const numOtherStars = stars.length - 1;
  const isComplete = project.progress === 100;

  return (
    <ConstellationStarfieldBackground>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes twinkle {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
            @keyframes glow {
              0%, 100% { box-shadow: 0 0 30px #FFD700, 0 0 60px #FFD700; }
              50% { box-shadow: 0 0 40px #FFD700, 0 0 80px #FFD700; }
            }
          `,
        }}
      />

      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      <div className="px-6 py-24 pt-36 max-w-6xl mx-auto w-full min-h-screen">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white no-underline text-sm mb-8 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold text-white/95 mb-3 mt-0 tracking-tight">
          {project.name}
        </h1>
        <p className="text-lg text-white/70 mb-10">
          You and {numOtherStars} other stars are making this project possible
        </p>

        <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden p-6 md:p-8 min-h-[420px] relative">
          <div className="absolute inset-6 md:inset-8 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {lines.map((line, i) => (
                <line
                  key={i}
                  x1={`${line.x1}%`}
                  y1={`${line.y1}%`}
                  x2={`${line.x2}%`}
                  y2={`${line.y2}%`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  className="animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
              ))}
            </svg>
            {stars.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.bright ? 14 : 8,
                  height: star.bright ? 14 : 8,
                  backgroundColor: star.bright ? '#FFD700' : 'white',
                  boxShadow: star.bright
                    ? '0 0 24px #FFD700, 0 0 48px rgba(255,215,0,0.5)'
                    : '0 0 12px rgba(255,255,255,0.8)',
                  animation: star.bright ? 'twinkle 1.5s ease-in-out infinite, glow 2s ease-in-out infinite' : 'twinkle 4s ease-in-out infinite',
                }}
              >
                {star.bright && (
                  <span
                    className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-amber-200 text-sm font-medium"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                  >
                    This is your contribution
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white/95 mb-4">Project Progress</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${project.progress}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #34d399, #6ee7b7)'
                    : 'linear-gradient(90deg, #60a5fa, #38bdf8)',
                }}
              />
            </div>
            <span className="text-2xl font-bold text-white/95 tabular-nums min-w-[4rem]">
              {project.progress}%
            </span>
          </div>
          <p className="text-white/60 text-sm mt-3">
            {isComplete ? 'Complete — thank you for your contribution!' : 'Keep contributing to move the needle.'}
          </p>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
