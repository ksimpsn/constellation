import React, { useMemo } from 'react';

interface BigDipperData {
  id: string;
  stars: Array<{x: number, y: number, size: number}>;
  connections: Array<{x1: number, y1: number, x2: number, y2: number, order: number}>;
  position: { x: number, y: number };
  scale: number;
}

interface ConstellationsBackgroundProps {
  className?: string;
}

export function ConstellationsBackground({ className = '' }: ConstellationsBackgroundProps) {
  const bigDippers = useMemo(() => {
    const bigDipperTemplate = {
      stars: [
        {x: 150, y: 200, size: 3}, // Bowl
        {x: 220, y: 180, size: 4},
        {x: 280, y: 220, size: 3},
        {x: 200, y: 280, size: 3.5},
        {x: 380, y: 160, size: 3}, // Handle
        {x: 480, y: 140, size: 4},
        {x: 580, y: 120, size: 3.5}
      ],
      connections: [
        {from: 0, to: 1, order: 0}, // Bowl connections
        {from: 1, to: 2, order: 1},
        {from: 2, to: 3, order: 2},
        {from: 3, to: 0, order: 3},
        {from: 1, to: 4, order: 4}, // Handle connections
        {from: 4, to: 5, order: 5},
        {from: 5, to: 6, order: 6}
      ]
    };

    const littleDipperTemplate = {
      stars: [
        {x: 450, y: 50, size: 2.5}, // Bowl
        {x: 480, y: 80, size: 3},
        {x: 460, y: 110, size: 2.5},
        {x: 420, y: 90, size: 3},
        {x: 380, y: 120, size: 2.5}, // Handle
        {x: 340, y: 140, size: 3},
        {x: 300, y: 160, size: 2.5}
      ],
      connections: [
        {from: 0, to: 1, order: 0}, // Bowl connections
        {from: 1, to: 2, order: 1},
        {from: 2, to: 3, order: 2},
        {from: 3, to: 0, order: 3},
        {from: 1, to: 4, order: 4}, // Handle connections
        {from: 4, to: 5, order: 5},
        {from: 5, to: 6, order: 6}
      ]
    };

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

    // Big Dipper 1 - top left
    const bigDipper1Scale = 0.9;
    const bigDipper1Position = {
      x: screenWidth * 0.2 - (600 * bigDipper1Scale) / 2,
      y: screenHeight * 0.2 - (400 * bigDipper1Scale) / 2
    };

    // Ursa Minor 1 - top right
    const ursaMinor1Scale = 0.8;
    const ursaMinor1Position = {
      x: screenWidth * 0.75 - (600 * ursaMinor1Scale) / 2,
      y: screenHeight * 0.15 - (400 * ursaMinor1Scale) / 2
    };

    // Big Dipper 2 - bottom left
    const bigDipper2Scale = 1.0;
    const bigDipper2Position = {
      x: screenWidth * 0.15 - (600 * bigDipper2Scale) / 2,
      y: screenHeight * 0.65 - (400 * bigDipper2Scale) / 2
    };

    // Ursa Minor 2 - bottom right
    const ursaMinor2Scale = 0.9;
    const ursaMinor2Position = {
      x: screenWidth * 0.7 - (600 * ursaMinor2Scale) / 2,
      y: screenHeight * 0.7 - (400 * ursaMinor2Scale) / 2
    };

    // Scale and position all constellations
    const bigDipper1ScaledStars = bigDipperTemplate.stars.map(star => ({
      x: star.x * bigDipper1Scale + bigDipper1Position.x,
      y: star.y * bigDipper1Scale + bigDipper1Position.y,
      size: star.size * bigDipper1Scale
    }));

    const bigDipper1Connections = bigDipperTemplate.connections.map(conn => ({
      x1: bigDipper1ScaledStars[conn.from].x,
      y1: bigDipper1ScaledStars[conn.from].y,
      x2: bigDipper1ScaledStars[conn.to].x,
      y2: bigDipper1ScaledStars[conn.to].y,
      order: conn.order
    }));

    const ursaMinor1ScaledStars = littleDipperTemplate.stars.map(star => ({
      x: star.x * ursaMinor1Scale + ursaMinor1Position.x,
      y: star.y * ursaMinor1Scale + ursaMinor1Position.y,
      size: star.size * ursaMinor1Scale
    }));

    const ursaMinor1Connections = littleDipperTemplate.connections.map(conn => ({
      x1: ursaMinor1ScaledStars[conn.from].x,
      y1: ursaMinor1ScaledStars[conn.from].y,
      x2: ursaMinor1ScaledStars[conn.to].x,
      y2: ursaMinor1ScaledStars[conn.to].y,
      order: conn.order
    }));

    const bigDipper2ScaledStars = bigDipperTemplate.stars.map(star => ({
      x: star.x * bigDipper2Scale + bigDipper2Position.x,
      y: star.y * bigDipper2Scale + bigDipper2Position.y,
      size: star.size * bigDipper2Scale
    }));

    const bigDipper2Connections = bigDipperTemplate.connections.map(conn => ({
      x1: bigDipper2ScaledStars[conn.from].x,
      y1: bigDipper2ScaledStars[conn.from].y,
      x2: bigDipper2ScaledStars[conn.to].x,
      y2: bigDipper2ScaledStars[conn.to].y,
      order: conn.order
    }));

    const ursaMinor2ScaledStars = littleDipperTemplate.stars.map(star => ({
      x: star.x * ursaMinor2Scale + ursaMinor2Position.x,
      y: star.y * ursaMinor2Scale + ursaMinor2Position.y,
      size: star.size * ursaMinor2Scale
    }));

    const ursaMinor2Connections = littleDipperTemplate.connections.map(conn => ({
      x1: ursaMinor2ScaledStars[conn.from].x,
      y1: ursaMinor2ScaledStars[conn.from].y,
      x2: ursaMinor2ScaledStars[conn.to].x,
      y2: ursaMinor2ScaledStars[conn.to].y,
      order: conn.order
    }));

    return [
      {
        id: 'big-dipper-1',
        stars: bigDipper1ScaledStars,
        connections: bigDipper1Connections,
        position: bigDipper1Position,
        scale: bigDipper1Scale,
        delay: 0
      },
      {
        id: 'ursa-minor-1',
        stars: ursaMinor1ScaledStars,
        connections: ursaMinor1Connections,
        position: ursaMinor1Position,
        scale: ursaMinor1Scale,
        delay: 0
      },
      {
        id: 'big-dipper-2',
        stars: bigDipper2ScaledStars,
        connections: bigDipper2Connections,
        position: bigDipper2Position,
        scale: bigDipper2Scale,
        delay: 0
      },
      {
        id: 'ursa-minor-2',
        stars: ursaMinor2ScaledStars,
        connections: ursaMinor2Connections,
        position: ursaMinor2Position,
        scale: ursaMinor2Scale,
        delay: 0
      }
    ];
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="constellationGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="70%" stopColor="rgba(255, 255, 255, 0.7)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 197, 253, 0.2)" />
            <stop offset="50%" stopColor="rgba(196, 181, 253, 0.4)" />
            <stop offset="100%" stopColor="rgba(147, 197, 253, 0.2)" />
          </linearGradient>
        </defs>

        {/* Big Dipper Connections */}
        {bigDippers.map((bigDipper) => (
          <g key={`${bigDipper.id}-connections`}>
            {bigDipper.connections.map((connection, index) => (
              <line
                key={`${bigDipper.id}-line-${index}`}
                x1={connection.x1}
                y1={connection.y1}
                x2={connection.x2}
                y2={connection.y2}
                stroke="url(#connectionGradient)"
                strokeWidth="3"
                opacity="0.9"
                className="big-dipper-line"
                style={{
                  strokeDasharray: '1000',
                  strokeDashoffset: '1000',
                  animation: `drawLine 0.8s ease-out ${bigDipper.delay + connection.order * 0.3}s forwards, disappearAndRestart 8s ${bigDipper.delay + 7 * 0.3 + 1}s infinite`
                }}
              />
            ))}
          </g>
        ))}

        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes drawLine {
              to {
                stroke-dashoffset: 0;
              }
            }

            @keyframes disappearAndRestart {
              0% {
                opacity: 0.9;
                stroke-dashoffset: 0;
              }
              10% {
                opacity: 0.9;
              }
              20% {
                opacity: 0;
                stroke-dashoffset: 0;
              }
              100% {
                opacity: 0;
                stroke-dashoffset: 1000;
              }
            }

            .big-dipper-line {
              stroke-linecap: round;
            }
          `
        }} />

        {/* Big Dipper Stars */}
        {bigDippers.map((bigDipper) => (
          <g key={`${bigDipper.id}-stars`}>
            {bigDipper.stars.map((star, index) => (
              <circle
                key={`${bigDipper.id}-star-${index}`}
                cx={star.x}
                cy={star.y}
                r={star.size}
                fill="white"
                filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))"
                opacity="0.9"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
