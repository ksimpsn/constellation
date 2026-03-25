import ConstellationStarfieldBackground from "../components/ConstellationStarfieldBackground";
import FlowNav from "../components/FlowNav";


export default function Leaderboard() {
  const mostProjects = [
    { username: "John Smith", value: 1 },
    { username: "Jane Doe", value: 1 },
  ];

  const mostCompute = [
    { username: "John Smith", value: 26 },
    { username: "Jane Doe", value: 22 },
  ];

  const mostTime = [
    { username: "Jane Doe", value: 22 },
    { username: "John Smith", value: 18 },
  ];

  const formatValue = (value: number, type: string) => {
    if (type === "compute") return `${value} CPU sec`;
    if (type === "time") return `${value} sec`;
    return `${value} projects`;
  };

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
          return (
            <div
              key={index}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                isTopThree
                  ? "bg-white/[0.12] border border-white/25"
                  : "bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm tabular-nums bg-white/10 text-white/85 font-medium">
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
            Hall of Fame — Most Compute, CPU sec
          </h3>
          <p className="text-center text-white/60 text-sm -mt-2 mb-4 max-w-xl mx-auto">
            Ranked by total compute contributed (fairer than time on slower machines).
          </p>
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-xl mx-auto">
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-12 h-12 rounded-full bg-white/10 text-white/85 font-bold flex items-center justify-center text-xl mb-2">1</span>
              <span className="text-white font-bold text-center text-base truncate w-full">{mostCompute[0]?.username}</span>
              <div className="w-full h-24 mt-2 rounded-t-lg bg-white/10 border border-white/20 shadow-inner" />
              <span className="text-xs text-white/70 font-semibold mt-1">1st</span>
            </div>
            <div className="flex flex-col items-center flex-1 max-w-[120px]">
              <span className="w-10 h-10 rounded-full bg-white/10 text-white/85 font-bold flex items-center justify-center text-lg mb-2">2</span>
              <span className="text-white font-semibold text-center text-sm truncate w-full">{mostCompute[1]?.username}</span>
              <div className="w-full h-16 mt-2 rounded-t-lg bg-white/10 border border-white/20 shadow-inner" />
              <span className="text-xs text-white/70 font-medium mt-1">2nd</span>
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
