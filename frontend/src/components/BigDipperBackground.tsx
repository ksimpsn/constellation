interface BigDipperBackgroundProps {
  className?: string;
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
    stars: [
      { x: 670, y: 385, r: 2.5 },
      { x: 735, y: 360, r: 3 },
      { x: 810, y: 375, r: 3 },
      { x: 770, y: 460, r: 6.5, isYou: true },
      { x: 700, y: 435, r: 2.5 },
      { x: 830, y: 440, r: 3 },
      { x: 700, y: 535, r: 2.5 },
      { x: 840, y: 535, r: 2.5 },
      { x: 640, y: 425, r: 2 },
      { x: 875, y: 410, r: 2.5 },
      { x: 760, y: 350, r: 2.5 },
      { x: 730, y: 445, r: 2 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 5],
      [5, 3],
      [3, 4],
      [4, 0],
      [3, 7],
      [3, 6],
      [4, 6],
      [5, 7],
      [0, 8],
      [2, 9],
      [1, 10],
      [10, 3],
      [4, 11],
      [11, 3],
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

export function BigDipperBackground({ className = "" }: BigDipperBackgroundProps) {
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
          {/* Yellow glow for "This is you" star */}
          <radialGradient id="youStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 245, 200, 1)" />
            <stop offset="50%" stopColor="rgba(255, 230, 150, 0.9)" />
            <stop offset="100%" stopColor="rgba(255, 210, 100, 0.5)" />
          </radialGradient>
          <linearGradient id="shootingStarTrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="60%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 1)" />
          </linearGradient>
        </defs>

        {/* Constellation stars and lines */}
        {Object.entries(constellations).map(([key, { stars, lines }]) => (
          <g key={key}>
            {stars.map((s, i) => (
              <g key={i}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill={"isYou" in s && s.isYou ? "url(#youStarGlow)" : "white"}
                  filter={"isYou" in s && s.isYou ? "drop-shadow(0 0 6px rgba(255, 230, 150, 0.9))" : "drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))"}
                  opacity={1}
                />
                {"isYou" in s && s.isYou && (
                  <text
                    x={s.x}
                    y={s.y + 32}
                    textAnchor="middle"
                    fill="rgba(255, 250, 220, 0.95)"
                    fontSize="14"
                    fontFamily="'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  >
                    This is you.
                  </text>
                )}
              </g>
            ))}
            {lines.map(([a, b], i) => (
              <line
                key={i}
                x1={stars[a].x}
                y1={stars[a].y}
                x2={stars[b].x}
                y2={stars[b].y}
                className={`animated-line line-delay-${(i % 7) + 1}`}
              />
            ))}
          </g>
        ))}

        {/* Scattered stars */}
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
              @keyframes drawLine {
                to { stroke-dashoffset: 0; }
              }
              @keyframes disappearAndRestart {
                0% { opacity: 0.4; stroke-dashoffset: 0; }
                15% { opacity: 0.4; }
                30% { opacity: 0; stroke-dashoffset: 0; }
                100% { opacity: 0; stroke-dashoffset: 1000; }
              }
              .animated-line {
                stroke: rgba(255, 255, 255, 0.4);
                stroke-width: 1.5;
                fill: none;
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: drawLine 0.4s ease-out forwards, disappearAndRestart 2.2s 0.5s infinite;
              }
              .line-delay-1 { animation-delay: 0.05s; }
              .line-delay-2 { animation-delay: 0.1s; }
              .line-delay-3 { animation-delay: 0.15s; }
              .line-delay-4 { animation-delay: 0.2s; }
              .line-delay-5 { animation-delay: 0.25s; }
              .line-delay-6 { animation-delay: 0.3s; }
              .line-delay-7 { animation-delay: 0.35s; }

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
            `,
          }}
        />
      </svg>
    </div>
  );
}
