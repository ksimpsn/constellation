import React, { useMemo } from 'react';

interface ConstellationStarfieldBackgroundProps {
  children: React.ReactNode;
}

export default function ConstellationStarfieldBackground({ children }: ConstellationStarfieldBackgroundProps) {
  const { stars, connections } = useMemo(() => {
    const starCount = 100;
    const largeStarCount = 20;
    const connectionDistance = 150;

    const allStars: Array<{ x: number; y: number; size: number; isLarge: boolean }> = [];

    for (let i = 0; i < starCount; i++) {
      allStars.push({
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        size: 1,
        isLarge: false,
      });
    }

    for (let i = 0; i < largeStarCount; i++) {
      allStars.push({
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
        size: 2,
        isLarge: true,
      });
    }

    const connectionsList: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < allStars.length; i++) {
      for (let j = i + 1; j < allStars.length; j++) {
        const dx = allStars[i].x - allStars[j].x;
        const dy = allStars[i].y - allStars[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < connectionDistance) {
          connectionsList.push({
            x1: allStars[i].x,
            y1: allStars[i].y,
            x2: allStars[j].x,
            y2: allStars[j].y,
          });
        }
      }
    }

    return { stars: allStars, connections: connectionsList };
  }, []);

  return (
    <div
      data-constellation-background
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom right, #0f172a 0%, #581c87 50%, #0f172a 100%)',
      }}
    >
      {/* Constellation Lines */}
      <svg
        className="absolute pointer-events-none"
        style={{ top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="constellationLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.3)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
          </linearGradient>
        </defs>
        {connections.map((connection, index) => (
          <line
            key={index}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke="url(#constellationLineGradient)"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
            style={{
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          />
        ))}
      </svg>

      {/* Animated Starfield Background */}
      <div className="absolute inset-0" style={{ inset: 0 }}>
        {stars.filter((star) => !star.isLarge).map((star, i) => (
          <div
            key={`small-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: 4,
              height: 4,
              background: 'white',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0" style={{ inset: 0 }}>
        {stars.filter((star) => star.isLarge).map((star, i) => (
          <div
            key={`large-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: 8,
              height: 8,
              background: '#bfdbfe',
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Decorative elements with swirling motion */}
      <div className="absolute rounded-full animate-swirl" style={{ top: '25%', left: '25%', width: 8, height: 8, background: '#60a5fa', opacity: 0.6 }} />
      <div className="absolute rounded-full animate-swirl-delayed" style={{ top: '33%', right: '33%', width: 4, height: 4, background: '#c084fc', opacity: 0.4 }} />
      <div className="absolute rounded-full animate-swirl-reverse" style={{ bottom: '25%', left: '33%', width: 6, height: 6, background: '#818cf8', opacity: 0.5 }} />

      {/* Content */}
      <div className="relative z-10" style={{ minHeight: '100vh' }}>
        {children}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes swirl {
            0%, 100% { transform: rotate(0deg) translateX(0px) translateY(0px); }
            25% { transform: rotate(90deg) translateX(20px) translateY(-10px); }
            50% { transform: rotate(180deg) translateX(0px) translateY(-20px); }
            75% { transform: rotate(270deg) translateX(-20px) translateY(-10px); }
          }
          @keyframes swirl-delayed {
            0%, 100% { transform: rotate(0deg) translateX(0px) translateY(0px); }
            25% { transform: rotate(90deg) translateX(-15px) translateY(20px); }
            50% { transform: rotate(180deg) translateX(0px) translateY(15px); }
            75% { transform: rotate(270deg) translateX(15px) translateY(20px); }
          }
          @keyframes swirl-reverse {
            0%, 100% { transform: rotate(0deg) translateX(0px) translateY(0px); }
            25% { transform: rotate(-90deg) translateX(25px) translateY(15px); }
            50% { transform: rotate(-180deg) translateX(0px) translateY(30px); }
            75% { transform: rotate(-270deg) translateX(-25px) translateY(15px); }
          }
          .animate-swirl { animation: swirl 8s ease-in-out infinite; }
          .animate-swirl-delayed { animation: swirl-delayed 10s ease-in-out infinite; animation-delay: 2s; }
          .animate-swirl-reverse { animation: swirl-reverse 12s ease-in-out infinite; animation-delay: 1s; }
        `,
        }}
      />
    </div>
  );
}
