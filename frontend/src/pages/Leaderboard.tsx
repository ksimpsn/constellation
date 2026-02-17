import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import AppNav from "../components/AppNav";

const RANK_MEDALS = ["🥇", "🥈", "🥉"] as const;
const RANK_GLOWS = [
  "rgba(251,191,36,0.4)",
  "rgba(148,163,184,0.35)",
  "rgba(180,83,9,0.35)",
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

  const ContributorList = ({
    contributors,
    title,
    valueType,
    icon,
    accentColor,
  }: {
    contributors: Array<{ username: string; value: number }>;
    title: string;
    valueType: string;
    icon: string;
    accentColor: string;
  }) => (
    <div className="flex-1 min-w-[320px] max-w-[380px] p-6 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)] transition-all duration-300">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold text-white/95 text-center">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {contributors.map((contributor, index) => {
          const isTopThree = index < 3;
          const medal = RANK_MEDALS[index];
          const glow = RANK_GLOWS[index];
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                isTopThree
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/5 border border-white/10 hover:border-white/15 hover:bg-white/8"
              }`}
              style={
                isTopThree
                  ? { boxShadow: `0 0 24px ${glow}` }
                  : undefined
              }
            >
              <span className="text-xl w-8 shrink-0 text-center tabular-nums">
                {medal ?? index + 1}
              </span>
              <span
                className={`flex-1 truncate font-medium ${
                  isTopThree ? "text-white" : "text-white/90"
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
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      <div className="px-6 py-24 pt-36 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-amber-400/90 text-sm font-medium mb-3 tracking-wider uppercase">
            <span className="opacity-80">✦</span> Top Contributors <span className="opacity-80">✦</span>
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight m-0"
            style={{
              background: "linear-gradient(135deg, #fff 0%, #e2e8f0 40%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 60px rgba(255,255,255,0.2)",
            }}
          >
            Leaderboard
          </h1>
          <p className="text-white/60 text-lg mt-3 max-w-xl mx-auto">
            Celebrating the stars who power research forward
          </p>
        </div>

        {/* Podium highlight - top 3 across all categories */}
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/5 border border-amber-400/20">
          <h3 className="text-center text-white/80 text-sm font-medium mb-4 uppercase tracking-wider">
            Hall of Fame
          </h3>
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="text-3xl mb-1">🥈</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[1]?.username}</span>
              <div className="w-full h-16 mt-2 rounded-t-lg bg-gradient-to-t from-slate-600/60 to-slate-400/30 border border-slate-400/30" />
              <span className="text-xs text-white/60 mt-1">2nd</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[140px]">
              <span className="text-4xl mb-1">🥇</span>
              <span className="text-white font-bold text-center text-base truncate w-full">{mostProjects[0]?.username}</span>
              <div className="w-full h-24 mt-2 rounded-t-lg bg-gradient-to-t from-amber-700/70 to-amber-400/40 border border-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.3)]" />
              <span className="text-xs text-amber-300/90 font-semibold mt-1">1st</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="text-3xl mb-1">🥉</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostProjects[2]?.username}</span>
              <div className="w-full h-12 mt-2 rounded-t-lg bg-gradient-to-t from-amber-800/60 to-amber-700/30 border border-amber-600/30" />
              <span className="text-xs text-white/60 mt-1">3rd</span>
            </div>
          </div>
        </div>

        {/* Category columns */}
        <div className="flex flex-wrap justify-center gap-6">
          <ContributorList
            contributors={mostProjects}
            title="Most Projects"
            valueType="projects"
            icon="📂"
            accentColor="rgb(96, 165, 250)"
          />
          <ContributorList
            contributors={mostCompute}
            title="Most Compute"
            valueType="compute"
            icon="⚡"
            accentColor="rgb(167, 139, 250)"
          />
          <ContributorList
            contributors={mostTime}
            title="Most Time"
            valueType="time"
            icon="⏱"
            accentColor="rgb(74, 222, 128)"
          />
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
