import React, { useMemo } from 'react';

export default function Why() {
  // Generate star positions and connections
  const { stars, connections } = useMemo(() => {
    const starCount = 100;
    const largeStarCount = 20;
    const connectionDistance = 150; // Maximum distance for connections

    const allStars: Array<{x: number, y: number, size: number, isLarge: boolean}> = [];

    // Generate small stars
    for (let i = 0; i < starCount; i++) {
      allStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1,
        isLarge: false
      });
    }

    // Generate large stars
    for (let i = 0; i < largeStarCount; i++) {
      allStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 2,
        isLarge: true
      });
    }

    // Generate connections between nearby stars
    const connectionsList: Array<{x1: number, y1: number, x2: number, y2: number}> = [];

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
            y2: allStars[j].y
          });
        }
      }
    }

    return {
      stars: allStars,
      connections: connectionsList
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Constellation Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
            stroke="url(#lineGradient)"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
            style={{
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </svg>

      {/* Animated Starfield Background */}
      <div className="absolute inset-0">
        {stars.filter(star => !star.isLarge).map((star, i) => (
          <div
            key={`small-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Additional larger stars */}
      <div className="absolute inset-0">
        {stars.filter(star => star.isLarge).map((star, i) => (
          <div
            key={`large-${i}`}
            className="absolute w-2 h-2 bg-blue-200 rounded-full animate-pulse"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Primary Logo Navigation */}
      <div className="absolute top-8 left-8 z-20">
        <a href="/" style={{
          display: 'block',
          width: '60px',
          height: '60px',
          cursor: 'pointer',
          opacity: 0.9,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
        >
          <img
            src="/src/assets/logo.png"
            alt="Constellation Home"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </a>
      </div>

      {/* Logo and Home Up Arrow */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4">
        <a
          href="/"
          className="text-white/60 hover:text-white/90 transition-colors duration-300 text-lg hover:scale-110 transition-transform duration-200"
          title="Back to Home"
        >
          Home ↑
        </a>
        <a href="/" className="hover:opacity-80 transition-opacity duration-200">
          <img
            src="/src/assets/logo.png"
            alt="Constellation Logo"
            className="h-10 w-auto"
          />
        </a>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white/90 leading-tight">
              Why Constellation?
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* What is Distributed Computing */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                What is Distributed Computing?
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Distributed computing allows thousands of individual devices—laptops, desktops, and phones—to work together on large computational problems.
              </p>
            </div>

            {/* What Works Today */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                What Works Today
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Platforms like BOINC and Folding@home have proven the power of this model, enabling major breakthroughs in areas such as protein folding and disease research.
              </p>
            </div>

            {/* The Limitation */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                The Limitation
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                These systems depend almost entirely on volunteer altruism, making participation difficult to sustain at scale over long periods of time.
              </p>
            </div>

            {/* The Constellation Approach */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                The Constellation Approach
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Constellation builds on the success of volunteer computing by introducing a meaningful incentive structure—unlocking consistent participation and transforming distributed computing into a scalable, dependable network.
              </p>
            </div>
          </div>

          {/* Navigation to next page */}
          <div className="pt-8">
            <a
              href="/security"
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
            >
              <span>Privacy and Security Concerns</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">↓</span>
            </a>
          </div>


        </div>
      </div>

      {/* Decorative elements with swirling motion */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-swirl"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-swirl-delayed"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-50 animate-swirl-reverse"></div>

      {/* Custom CSS for swirling animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes swirl {
            0%, 100% {
              transform: rotate(0deg) translateX(0px) translateY(0px);
            }
            25% {
              transform: rotate(90deg) translateX(20px) translateY(-10px);
            }
            50% {
              transform: rotate(180deg) translateX(0px) translateY(-20px);
            }
            75% {
              transform: rotate(270deg) translateX(-20px) translateY(-10px);
            }
          }

          @keyframes swirl-delayed {
            0%, 100% {
              transform: rotate(0deg) translateX(0px) translateY(0px);
            }
            25% {
              transform: rotate(90deg) translateX(-15px) translateY(20px);
            }
            50% {
              transform: rotate(180deg) translateX(0px) translateY(15px);
            }
            75% {
              transform: rotate(270deg) translateX(15px) translateY(20px);
            }
          }

          @keyframes swirl-reverse {
            0%, 100% {
              transform: rotate(0deg) translateX(0px) translateY(0px);
            }
            25% {
              transform: rotate(-90deg) translateX(25px) translateY(15px);
            }
            50% {
              transform: rotate(-180deg) translateX(0px) translateY(30px);
            }
            75% {
              transform: rotate(-270deg) translateX(-25px) translateY(15px);
            }
          }

          .animate-swirl {
            animation: swirl 8s ease-in-out infinite;
          }

          .animate-swirl-delayed {
            animation: swirl-delayed 10s ease-in-out infinite;
            animation-delay: 2s;
          }

          .animate-swirl-reverse {
            animation: swirl-reverse 12s ease-in-out infinite;
            animation-delay: 1s;
          }
        `
      }} />
    </div>
  );
}
