import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";

const RANK_GLOWS = [
  "rgba(250,204,21,0.5)",
  "rgba(203,213,225,0.45)",
  "rgba(217,119,6,0.45)",
] as const;

export default function Leaderboard() {
  const mostProjects = [
    { username: "Alex Chen", value: 18 },
    { username: "Maya Patel", value: 16 },
    { username: "Jordan Lee", value: 15 },
    { username: "Sam Rodriguez", value: 14 },
    { username: "Emily Nguyen", value: 13 },
    { username: "Daniel Kim", value: 12 },
    { username: "Priya Shah", value: 11 },
    { username: "Michael Thompson", value: 10 },
    { username: "Sophia Martinez", value: 9 },
    { username: "Ethan Brooks", value: 8 },
  ];

  const mostCompute = [
    { username: "Daniel Kim", value: 182_400 },
    { username: "Jordan Lee", value: 171_250 },
    { username: "Alex Chen", value: 165_900 },
    { username: "Maya Patel", value: 154_320 },
    { username: "Michael Thompson", value: 142_880 },
    { username: "Sam Rodriguez", value: 136_540 },
    { username: "Emily Nguyen", value: 129_600 },
    { username: "Priya Shah", value: 118_450 },
    { username: "Ethan Brooks", value: 107_300 },
    { username: "Sophia Martinez", value: 95_750 },
  ];

  const mostTime = [
    { username: "Maya Patel", value: 1_420 },
    { username: "Alex Chen", value: 1_365 },
    { username: "Emily Nguyen", value: 1_290 },
    { username: "Jordan Lee", value: 1_215 },
    { username: "Daniel Kim", value: 1_180 },
    { username: "Sam Rodriguez", value: 1_090 },
    { username: "Priya Shah", value: 1_010 },
    { username: "Sophia Martinez", value: 945 },
    { username: "Michael Thompson", value: 880 },
    { username: "Ethan Brooks", value: 820 },
  ];

  const formatValue = (value: number, type: string) => {
    if (type === "compute") return `${(value / 1000).toFixed(1)}K CPU hrs`;
    if (type === "time") return `${value} min`;
    return `${value} projects`;
  };

  const rankBadgeStyles = [
    "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-amber-950 font-bold shadow-[0_0_12px_rgba(250,204,21,0.4)]",
    "bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-900 font-bold shadow-[0_0_12px_rgba(203,213,225,0.3)]",
    "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 font-bold shadow-[0_0_12px_rgba(217,119,6,0.35)]",
  ] as const;

  const ContributorList = ({
    contributors,
    title,
    valueType,
    accentColor,
  }: {
    contributors: Array<{ username: string; value: number }>;
    title: string;
    valueType: string;
    accentColor: string;
  }) => (
    <div className="flex-1 min-w-[320px] max-w-[380px] p-6 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.12] hover:border-white/[0.18] hover:shadow-[0_0_48px_rgba(255,255,255,0.06)] transition-all duration-300">
      <div className="mb-5 pb-3 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white/95 text-center">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {contributors.map((contributor, index) => {
          const isTopThree = index < 3;
          const glow = RANK_GLOWS[index];
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                isTopThree
                  ? "bg-white/[0.12] border border-white/25"
                  : "bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
              style={
                isTopThree
                  ? { boxShadow: `0 0 28px ${glow}, 0 0 0 1px rgba(255,255,255,0.06)` }
                  : undefined
              }
            >
              <span
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm tabular-nums ${
                  isTopThree ? rankBadgeStyles[index] : "bg-white/10 text-white/85 font-medium"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`flex-1 truncate font-medium ${
                  isTopThree ? "text-white" : "text-white/92"
                }`}
              >
                {contributor.username}
              </span>
              <span
                className="text-sm font-semibold shrink-0 tabular-nums"
                style={{ color: accentColor }}
              >
                {formatValue(contributor.value, valueType)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 px-6 pt-24 pb-16 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-amber-300/95 text-sm font-medium mb-3 tracking-wider uppercase">
            Top Contributors
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight m-0"
            style={{
              background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 25%, #fde68a 50%, #fcd34d 75%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 24px rgba(251,191,36,0.25))",
            }}
          >
            Leaderboard
          </h1>
          <p className="text-white/65 text-lg mt-3 max-w-xl mx-auto">
            Celebrating the stars who power research forward
          </p>
        </div>

        {/* Podium highlight - top 3 across all categories */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-amber-500/8 via-amber-400/5 to-transparent border border-amber-400/25 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
          <h3 className="text-center text-amber-200/90 text-sm font-medium mb-4 uppercase tracking-wider">
            Hall of Fame
          </h3>
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-900 font-bold flex items-center justify-center text-lg mb-2 shadow-[0_0_14px_rgba(203,213,225,0.35)]">2</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[1]?.username}</span>
              <div className="w-full h-16 mt-2 rounded-t-lg bg-gradient-to-t from-slate-600/70 to-slate-400/40 border border-slate-400/40 shadow-inner" />
              <span className="text-xs text-slate-300 font-medium mt-1">2nd</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[140px]">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-amber-950 font-bold flex items-center justify-center text-xl mb-2 shadow-[0_0_24px_rgba(250,204,21,0.5)]">1</span>
              <span className="text-white font-bold text-center text-base truncate w-full">{mostProjects[0]?.username}</span>
              <div className="w-full h-24 mt-2 rounded-t-lg bg-gradient-to-t from-amber-600/80 via-amber-500/50 to-amber-400/40 border border-amber-400/50 shadow-[0_0_32px_rgba(251,191,36,0.25)]" />
              <span className="text-xs text-amber-300 font-semibold mt-1">1st</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 font-bold flex items-center justify-center text-lg mb-2 shadow-[0_0_14px_rgba(217,119,6,0.4)]">3</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[2]?.username}</span>
              <div className="w-full h-12 mt-2 rounded-t-lg bg-gradient-to-t from-amber-700/70 to-amber-600/40 border border-amber-500/40" />
              <span className="text-xs text-amber-200/90 font-medium mt-1">3rd</span>
            </div>
          </div>
        </div>

        {/* Category columns */}
        <div className="flex flex-wrap justify-center gap-6">
          <ContributorList
            contributors={mostProjects}
            title="Most Projects"
            valueType="projects"
            accentColor="rgb(125, 211, 252)"
          />
          <ContributorList
            contributors={mostCompute}
            title="Most Compute"
            valueType="compute"
            accentColor="rgb(196, 181, 253)"
          />
          <ContributorList
            contributors={mostTime}
            title="Most Time"
            valueType="time"
            accentColor="rgb(134, 239, 172)"
          />
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
