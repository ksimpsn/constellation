import GradientBackground from "../components/GradientBackground";
import shootingstar from "../assets/falling-shooting-stars.png";

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
    { username: "Ethan Brooks", value: 8 }
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
    { username: "Sophia Martinez", value: 95_750 }
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
    { username: "Ethan Brooks", value: 820 }
  ];

  const formatValue = (value: number, type: string) => {
    if (type === 'compute') {
      return `${(value / 1000).toFixed(1)}K CPU hours`;
    } else if (type === 'time') {
      return `${value} minutes`;
    }
    return `${value} projects`;
  };

  const ContributorList = ({ contributors, title, valueType }: {
    contributors: Array<{username: string, value: number}>,
    title: string,
    valueType: string
  }) => (
    <div style={{
      flex: 1,
      padding: "20px",
      backgroundColor: "rgba(255,255,255,0.1)",
      borderRadius: "10px",
      border: "2px solid rgba(255,255,255,0.3)",
      margin: "0 10px",
      minWidth: "300px"
    }}>
      <h2 style={{
        fontSize: "24px",
        marginBottom: "10px",
        color: "#000",
        textAlign: "center",
        whiteSpace: "nowrap",
        lineHeight: "1.2"
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {contributors.map((contributor, index) => (
          <div key={index} style={{
            fontSize: "16px",
            marginBottom: "8px",
            color: "#000",
            backgroundColor: "#fff",
            padding: "8px 16px",
            borderRadius: "5px",
            width: "100%",
            maxWidth: "320px",
            fontWeight: index < 3 ? "bold" : "normal",
            boxShadow: index < 3 ? "0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.4)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ minWidth: "30px", fontWeight: "bold" }}>{index + 1})</span>
            <span style={{ flex: 1, textAlign: "center", whiteSpace: "nowrap" }}>{contributor.username}</span>
            <span style={{ minWidth: "80px", textAlign: "right" }}>{formatValue(contributor.value, valueType)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <GradientBackground>
      <div style={{ width: "100%", textAlign: "center", marginTop: "10px", position: "relative" }}>
        {/* Shooting Star Element */}
        <div style={{
          position: "absolute",
          left: "10%",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10
        }}>
          <img
            src={shootingstar}
            alt="Shooting Star"
            style={{
              width: "80px",
              height: "80px"
            }}
            onError={(e) => {
              console.log('Image failed to load:', shootingstar);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <h1 style={{
          fontSize: "48px",
          color: "#000",
          border: "3px solid #000",
          borderRadius: "10px",
          padding: "15px",
          backgroundColor: "rgba(255,255,255,0.5)",
          display: "inline-block",
          margin: "0"
        }}>
          Top Contributors Leaderboard
        </h1>
      </div>

      <div style={{
        marginTop: "40px",
        maxWidth: "1200px",
        margin: "40px auto 0",
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <ContributorList
          contributors={mostProjects}
          title="Most Projects Contributed To"
          valueType="projects"
        />

        <ContributorList
          contributors={mostCompute}
          title="Most Compute Contributed"
          valueType="compute"
        />

        <ContributorList
          contributors={mostTime}
          title="Most Time Contributed"
          valueType="time"
        />
      </div>
    </GradientBackground>
  );
}
