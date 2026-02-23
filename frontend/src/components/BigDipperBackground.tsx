interface BigDipperBackgroundProps {
  className?: string;
  /** If set, only this many constellations are shown (e.g. 3 for a calmer home screen). */
  limit?: number;
  /** If set, only these constellation ids are shown (e.g. ['orion', 'bigDipper', 'lyra'] to include "This is you"). */
  onlyIds?: string[];
  /** Scale of the constellation layer. Default 1.32 (larger). Use e.g. 0.55 to show more constellations smaller. */
  scale?: number;
}

// Constellations with non-overlapping regions (no line crossings between constellations)
// Each constellation occupies a distinct zone in the viewBox 0 0 1000 600

const constellations = {
  orion: {
    stars: [
      { x: 60, y: 75, r: 3.5 },
      { x: 140, y: 65, r: 4 },
      { x: 200, y: 78, r: 3.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
    ],
    region: "top-left",
  },
  bigDipper: {
    stars: [
      { x: 130, y: 210, r: 3 },
      { x: 200, y: 190, r: 4 },
      { x: 260, y: 230, r: 3 },
      { x: 180, y: 270, r: 3.5 },
      { x: 340, y: 170, r: 3 },
      { x: 440, y: 150, r: 4 },
      { x: 520, y: 130, r: 3.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 4],
      [4, 5],
      [5, 6],
    ],
    region: "left-center",
  },
  ursaMinor: {
    stars: [
      { x: 50, y: 400, r: 2.5 },
      { x: 90, y: 370, r: 3 },
      { x: 70, y: 340, r: 2.5 },
      { x: 40, y: 360, r: 3 },
      { x: 130, y: 350, r: 3 },
      { x: 170, y: 330, r: 2.5 },
      { x: 210, y: 315, r: 2.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 4],
      [4, 5],
      [5, 6],
    ],
    region: "bottom-left",
  },
  draco: {
    stars: [
      { x: 420, y: 110, r: 2.5 },
      { x: 470, y: 130, r: 3 },
      { x: 510, y: 100, r: 2.5 },
      { x: 550, y: 125, r: 3 },
      { x: 490, y: 155, r: 2.5 },
      { x: 530, y: 175, r: 2.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
    ],
    region: "center-top",
  },
  cassiopeia: {
    stars: [
      { x: 700, y: 55, r: 3 },
      { x: 780, y: 35, r: 3.5 },
      { x: 850, y: 50, r: 4 },
      { x: 910, y: 70, r: 3.5 },
      { x: 950, y: 60, r: 3 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    region: "top-right",
  },
  hercules: {
    stars: [
      { x: 600, y: 255, r: 2.5 },
      { x: 665, y: 235, r: 3 },
      { x: 690, y: 285, r: 3.5 },
      { x: 625, y: 305, r: 3 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    region: "center-right",
  },
  coronaBorealis: {
    stars: [
      { x: 500, y: 330, r: 2.5 },
      { x: 535, y: 310, r: 3 },
      { x: 565, y: 315, r: 2.5 },
      { x: 590, y: 340, r: 3 },
      { x: 565, y: 365, r: 2.5 },
      { x: 535, y: 370, r: 3 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
    region: "center",
  },
  cygnus: {
    stars: [
      { x: 300, y: 310, r: 2.5 },
      { x: 310, y: 360, r: 3.5 },
      { x: 320, y: 410, r: 2.5 },
      { x: 280, y: 340, r: 2.5 },
      { x: 340, y: 350, r: 2.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [0, 4],
    ],
    region: "center-left",
  },
  lyra: {
    // Harp-shaped constellation with "you" as the bright center star; lines avoid crossings
    stars: [
      { x: 690, y: 358, r: 2.8 },
      { x: 770, y: 332, r: 3 },
      { x: 850, y: 358, r: 2.8 },
      { x: 770, y: 398, r: 4.5, isYou: true },
      { x: 708, y: 448, r: 2.6 },
      { x: 832, y: 448, r: 2.6 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 2],
      [3, 4],
      [4, 0],
      [3, 5],
      [5, 2],
    ],
    region: "bottom-right",
  },
  pegasus: {
    stars: [
      { x: 820, y: 200, r: 2.5 },
      { x: 900, y: 195, r: 3 },
      { x: 910, y: 270, r: 3 },
      { x: 830, y: 275, r: 2.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    region: "right",
  },
  aquila: {
    stars: [
      { x: 480, y: 420, r: 2.5 },
      { x: 540, y: 400, r: 3.5 },
      { x: 520, y: 455, r: 2.5 },
      { x: 500, y: 380, r: 2.5 },
      { x: 560, y: 430, r: 2.5 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [1, 4],
    ],
    region: "bottom-center",
  },
};

// Scattered background stars (no constellation lines)
const scatteredStars = [
  { x: 100, y: 140, r: 1 },
  { x: 250, y: 100, r: 1.5 },
  { x: 380, y: 200, r: 1 },
  { x: 620, y: 170, r: 1.5 },
  { x: 740, y: 150, r: 1 },
  { x: 50, y: 280, r: 1 },
  { x: 350, y: 260, r: 1.5 },
  { x: 760, y: 320, r: 1 },
  { x: 150, y: 480, r: 1.5 },
  { x: 400, y: 500, r: 1 },
  { x: 630, y: 450, r: 1.5 },
  { x: 920, y: 400, r: 1 },
  { x: 120, y: 50, r: 1 },
  { x: 580, y: 90, r: 1.5 },
  { x: 980, y: 180, r: 1 },
  { x: 280, y: 450, r: 1 },
  { x: 850, y: 555, r: 1.5 },
];

// Phase delay (seconds) per constellation – same value = they grow at the same time
const constellationPhaseDelays = [0, 0, 0.7, 0.7, 1.4, 1.4, 2.1, 2.1, 2.8, 2.8, 3.5];

// True if segment (p1,p2) properly intersects (p3,p4) in the interior (not at endpoints)
function segmentsCross(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const [x1, y1] = [p1.x, p1.y];
  const [x2, y2] = [p2.x, p2.y];
  const [x3, y3] = [p3.x, p3.y];
  const [x4, y4] = [p4.x, p4.y];
  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d;
  return t > 1e-9 && t < 1 - 1e-9 && u > 1e-9 && u < 1 - 1e-9;
}

// From a list of lines (pairs of star indices), return a subset where no two segments cross
function nonCrossingLines(
  stars: Array<{ x: number; y: number }>,
  lines: Array<[number, number]>
): Array<[number, number]> {
  const kept: Array<[number, number]> = [];
  for (const [a, b] of lines) {
    const p1 = stars[a];
    const p2 = stars[b];
    if (!p1 || !p2) continue;
    let crosses = false;
    for (const [c, d] of kept) {
      if (a === c || a === d || b === c || b === d) continue;
      if (segmentsCross(p1, p2, stars[c]!, stars[d]!)) {
        crosses = true;
        break;
      }
    }
    if (!crosses) kept.push([a, b]);
  }
  return kept;
}

type ConstellationEntry = [string, (typeof constellations)[keyof typeof constellations]];

export function BigDipperBackground({ className = "", limit, onlyIds, scale: scaleProp }: BigDipperBackgroundProps) {
  const entries: ConstellationEntry[] = Object.entries(constellations);
  const shown: ConstellationEntry[] =
    onlyIds != null && onlyIds.length > 0
      ? onlyIds
          .filter((id): id is keyof typeof constellations => id in constellations)
          .map((id) => [id, constellations[id]])
      : limit != null
        ? entries.slice(0, limit)
        : entries;
  const scale = scaleProp ?? 1.32;
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="70%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          {/* Warm glow for "This is you" star */}
          <radialGradient id="youStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 240, 1)" />
            <stop offset="40%" stopColor="rgba(255, 248, 200, 0.95)" />
            <stop offset="70%" stopColor="rgba(255, 220, 120, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 200, 80, 0.2)" />
          </radialGradient>
          <filter id="youStarShadow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur3" />
            <feFlood floodColor="rgba(255, 230, 150, 0.5)" result="glowColor" />
            <feComposite in="glowColor" in2="blur3" operator="in" result="glow3" />
            <feFlood floodColor="rgba(255, 248, 200, 0.6)" result="glowColor2" />
            <feComposite in="glowColor2" in2="blur2" operator="in" result="glow2" />
            <feMerge>
              <feMergeNode in="glow3" />
              <feMergeNode in="glow2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="youLabelGlow" x="-50%" y="-100%" width="200%" height="300%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feFlood floodColor="rgba(251, 191, 36, 0.4)" result="color" />
            <feComposite in="color" in2="offsetBlur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="shootingStarTrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
          </linearGradient>
        </defs>

        {/* Constellation stars and lines – scale from center; no line crosses another; slow drift */}
        <g className="constellation-drift">
          <g transform={`translate(500, 300) scale(${scale}) translate(-500, -300)`}>
          {shown.map(([key, { stars, lines }], constellationIndex) => {
            const phaseDelay = constellationPhaseDelays[constellationIndex] ?? constellationIndex * 0.7;
            const safeLines = nonCrossingLines(stars, lines as Array<[number, number]>);
            return (
              <g key={key}>
                {stars.map((s, i) => (
                  <g key={i}>
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={s.r}
                      fill={"isYou" in s && s.isYou ? "url(#youStarGlow)" : "white"}
                      filter={"isYou" in s && s.isYou ? "url(#youStarShadow)" : "drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))"}
                      opacity={1}
                      className={"isYou" in s && s.isYou ? "animate-you-star" : undefined}
                    />
                    {"isYou" in s && s.isYou && (
                      <g filter="url(#youLabelGlow)">
                        <text
                          x={s.x}
                          y={s.y + 26}
                          textAnchor="middle"
                          fill="rgba(254, 243, 199, 1)"
                          fontSize="13"
                          fontWeight="600"
                          fontFamily="'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                          letterSpacing="0.02em"
                        >
                          This is you.
                        </text>
                      </g>
                    )}
                  </g>
                ))}
                {safeLines.map(([a, b], i) => {
                  const lineStagger = (i % 7) * 0.08;
                  const totalDelay = phaseDelay + lineStagger;
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={stars[a].x}
                      y1={stars[a].y}
                      x2={stars[b].x}
                      y2={stars[b].y}
                      className="animated-line"
                      style={{ animationDelay: `${totalDelay}s` }}
                    />
                  );
                })}
              </g>
            );
          })}
          </g>
          {/* Scattered stars – same drift as constellations */}
          {scatteredStars.map((s, i) => (
            <circle
              key={`scatter-${i}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="white"
              filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))"
            />
          ))}
        </g>

        {/* Shooting star - bottom left to top right every 5s */}
        <g className="shooting-star">
          {/* Trail - tail points toward bottom-left as star moves top-right */}
          <line
            x1="-60"
            y1="60"
            x2="0"
            y2="0"
            stroke="url(#shootingStarTrail)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Head */}
          <circle r="4" fill="white" filter="drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))" />
        </g>

        {/* Animated Connecting Lines */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes constellationDrift {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(12px, 6px); }
                50% { transform: translate(-8px, 10px); }
                75% { transform: translate(-10px, -6px); }
              }
              .constellation-drift {
                animation: constellationDrift 90s ease-in-out infinite;
              }

              @keyframes drawLine {
                to { stroke-dashoffset: 0; }
              }
              @keyframes disappearAndRestart {
                0% { opacity: 0.45; stroke-dashoffset: 0; }
                20% { opacity: 0.45; }
                40% { opacity: 0; stroke-dashoffset: 0; }
                100% { opacity: 0; stroke-dashoffset: 1000; }
              }
              .animated-line {
                stroke: rgba(255, 255, 255, 0.45);
                stroke-width: 2;
                fill: none;
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: drawLine 0.85s ease-out forwards, disappearAndRestart 3.2s 0.7s infinite;
              }

              @keyframes shootingStar {
                0%, 79% { transform: translate(80, 560); opacity: 0; }
                80% { transform: translate(80, 560); opacity: 1; }
                96% { transform: translate(920, 40); opacity: 1; }
                97%, 100% { transform: translate(80, 560); opacity: 0; }
              }
              .shooting-star {
                transform-origin: 0 0;
                animation: shootingStar 5s ease-in infinite;
              }
              @keyframes youStarPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.88; }
              }
              .animate-you-star {
                animation: youStarPulse 2.8s ease-in-out infinite;
              }
            `,
          }}
        />
      </svg>
    </div>
  );
}
