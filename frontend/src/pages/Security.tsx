import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/AppNav';

export default function Security() {
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
          <linearGradient id="securityLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
          </linearGradient>
        </defs>
        {connections.map((connection, index) => (
          <line
            key={index}
            x1={connection.x1}
            y1={connection.y1}
            x2={connection.x2}
            y2={connection.y2}
            stroke="url(#securityLineGradient)"
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
            className="absolute w-2 h-2 bg-green-200 rounded-full animate-pulse"
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

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <AppNav variant="dark" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white/90 leading-tight">
              Privacy & Security
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* Main Security Statement */}
          <div className="space-y-8">
            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                Your Privacy is Protected
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Constellation is built with privacy and security as core design principles. When you choose to volunteer your computing power, your personal information, identity, and browsing data remain fully protected.
              </p>
            </div>

            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                Sandboxed Environments
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                All third-party projects run inside secure, sandboxed environments, ensuring that no harmful code, malware, or unauthorized processes can ever access your device.
              </p>
            </div>

            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                Modern Security Practices
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                Distributed systems have a long history of being safe and effective when implemented correctly, and Constellation strengthens this model with modern security practices, continuous verification, and strict isolation between tasks.
              </p>
            </div>

            <div className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
              <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-6 group-hover:text-white transition-colors duration-300">
                Contribute Safely
              </h2>
              <p className="text-xl text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                You can contribute to scientific and technological progress without ever compromising your privacy or the safety of your machine.
              </p>
            </div>
          </div>

          {/* Navigation to Security Research */}
          <div className="pt-8">
            <Link
              to="/security-research"
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
            >
              <span>Security Research</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>

          {/* Bottom navigation */}
          <div className="pt-8 flex justify-center">
            <Link
              to="/why"
              className="text-white/60 hover:text-white/90 transition-colors duration-300 text-lg hover:scale-110 transition-transform duration-200"
            >
              Why Constellation? ↑
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements with swirling motion */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full opacity-60 animate-swirl"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-swirl-delayed"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-50 animate-swirl-reverse"></div>

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
