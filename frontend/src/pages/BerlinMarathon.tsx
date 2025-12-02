import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const projectData: Record<string, { name: string; progress: number }> = {
  'NeuroStream': { name: 'NeuroStream: Adaptive Modeling', progress: 60 },
  'HelixCompute': { name: 'HelixCompute: Task-Sharding', progress: 40 },
  'AuroraML': { name: 'AuroraML: Diagnostic Prediction', progress: 80 },
  'Berlin Marathon Analytics': { name: 'Berlin Marathon Analytics', progress: 100 },
  'Deep Learning Research': { name: 'Deep Learning Research', progress: 100 },
  'PTSD Detection Model': { name: 'PTSD Detection Model', progress: 100 },
};

export default function BerlinMarathon() {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const project = projectData[projectName || 'Berlin Marathon Analytics'] || { name: 'Unknown Project', progress: 0 };

  // Random number of other stars between 16 and 31
  const numOtherStars = Math.floor(Math.random() * 16) + 16; // 16 to 31
  const totalStars = numOtherStars + 1; // +1 for YOU

  // Generate positions for stars
  const stars = Array.from({ length: totalStars }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10, // 10% to 90%
    y: Math.random() * 60 + 20, // 20% to 80%
    bright: i === 0, // First star is bright (YOU)
  }));

  // Create lines connecting stars (simple connections for constellation effect)
  const lines = [];
  for (let i = 0; i < stars.length - 1; i++) {
    lines.push({
      x1: stars[i].x,
      y1: stars[i].y,
      x2: stars[i + 1].x,
      y2: stars[i + 1].y,
    });
  }

  return (
    <div style={nightSkyContainer}>
      <div style={container}>
        <button style={backButton} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 style={title}>{project.name}</h1>
        <p style={subtitle}>You and {numOtherStars} other stars are making this project possible!</p>
        <div style={constellationContainer}>
          <svg style={svgStyle}>
            {lines.map((line, index) => (
              <line
                key={index}
                x1={`${line.x1}%`}
                y1={`${line.y1}%`}
                x2={`${line.x2}%`}
                y2={`${line.y2}%`}
                stroke="#FFFFFF"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
          </svg>
          {stars.map((star) => (
            <div
              key={star.id}
              style={{
                ...starStyle,
                left: `${star.x}%`,
                top: `${star.y}%`,
                backgroundColor: star.bright ? '#FFD700' : '#FFFFFF',
                boxShadow: star.bright ? '0 0 30px #FFD700, 0 0 60px #FFD700, 0 0 90px #FFD700' : '0 0 15px #FFFFFF',
                animation: star.bright ? 'twinkle 1.5s ease-in-out infinite, glow 2s ease-in-out infinite' : 'twinkle 4s ease-in-out infinite',
                width: star.bright ? '15px' : '8px',
                height: star.bright ? '15px' : '8px',
              }}
            >
              {star.bright && (
                <div style={label}>
                  This is your contribution
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={progressContainer}>
          <div style={progressLabel}>Project Progress</div>
          <div style={progressBarBackground}>
            <div style={{
              ...progressBarFill,
              width: `${project.progress}%`,
              background: project.progress === 100 ? 'linear-gradient(90deg, #4CAF50, #81C784)' : 'linear-gradient(90deg, #2196F3, #21CBF3)',
            }}></div>
          </div>
          <div style={progressText}>{project.progress}%</div>
        </div>
      </div>
    </div>
  );
}

const backButton: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: '#FFFFFF',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '5px',
  fontSize: '16px',
  cursor: 'pointer',
  zIndex: 2,
  transition: 'background-color 0.3s ease',
  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
};

(backButton as any)[':hover'] = {
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
};

const nightSkyContainer: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  background: 'linear-gradient(135deg, #0c0c0c, #000000, #1a1a2e)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative',
};

const container: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  boxSizing: 'border-box',
  position: 'relative',
  zIndex: 1,
};

const svgStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 0,
};

const title: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  textAlign: 'center',
  margin: '0 0 10px 0',
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
};

const subtitle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'normal',
  color: '#CCCCCC',
  textAlign: 'center',
  margin: '0 0 20px 0',
  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
};

const constellationContainer: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '60vh',
  flexGrow: 1,
};

const starStyle: React.CSSProperties = {
  position: 'absolute',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
};

const label: React.CSSProperties = {
  position: 'absolute',
  top: '-30px',
  left: '50%',
  transform: 'translateX(-50%)',
  color: '#FFD700',
  fontSize: '14px',
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
};

const progressContainer: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '20px',
};

const progressLabel: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginBottom: '10px',
  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
};

const progressBarBackground: React.CSSProperties = {
  width: '80%',
  height: '20px',
  backgroundColor: 'rgba(255,255,255,0.3)',
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
};

const progressBarFill: React.CSSProperties = {
  width: '75%',
  height: '100%',
  background: 'linear-gradient(90deg, #4CAF50, #81C784)',
  borderRadius: '10px',
  transition: 'width 0.5s ease',
};

const progressText: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#FFFFFF',
  marginTop: '10px',
  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
};

// Add CSS for animations
const styles = `
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 30px #FFD700, 0 0 60px #FFD700, 0 0 90px #FFD700; }
  50% { box-shadow: 0 0 40px #FFD700, 0 0 80px #FFD700, 0 0 120px #FFD700; }
}

@keyframes pulse {
  0%, 100% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
