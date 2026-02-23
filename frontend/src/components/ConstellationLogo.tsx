/**
 * Big Dipper constellation logo: clear ladle – rectangular bowl + handle.
 * Designed to fill a wide rectangular button. viewBox 100×36.
 */
interface ConstellationLogoProps {
  className?: string;
  /** Logo height in pixels; width scales from dipper aspect (100:36). */
  height?: number;
}

// Big Dipper: diamond bowl (4 stars) + handle (3 stars). ViewBox 100×36.
const VIEW_W = 100;
const VIEW_H = 36;
const DIPPER_STARS = [
  { x: 26, y: 6 },   // bowl – top of diamond
  { x: 44, y: 18 },  // bowl – right of diamond (handle starts here)
  { x: 26, y: 30 },  // bowl – bottom of diamond
  { x: 8, y: 18 },   // bowl – left of diamond
  { x: 58, y: 14 },  // handle
  { x: 80, y: 12 },  // handle
  { x: 96, y: 14 },  // handle end
];
const DIPPER_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0], // bowl – diamond
  [1, 4], [4, 5], [5, 6],         // handle
];

// In viewBox units for crisp scaling
const STROKE = 2.2;
const R = 2.4;

export default function ConstellationLogo({ className = "", height = 40 }: ConstellationLogoProps) {
  const w = (VIEW_W / VIEW_H) * height;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={w}
      height={height}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="constellation-logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.88)" />
        </linearGradient>
        <filter id="constellation-logo-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Lines – dipper outline */}
      <g stroke="rgba(255,255,255,0.9)" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {DIPPER_LINES.map(([i, j], idx) => (
          <line key={idx} x1={DIPPER_STARS[i].x} y1={DIPPER_STARS[i].y} x2={DIPPER_STARS[j].x} y2={DIPPER_STARS[j].y} />
        ))}
      </g>
      {/* Stars */}
      <g filter="url(#constellation-logo-soft-glow)" fill="url(#constellation-logo-glow)">
        {DIPPER_STARS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === 1 ? R * 1.15 : R} />
        ))}
      </g>
    </svg>
  );
}
