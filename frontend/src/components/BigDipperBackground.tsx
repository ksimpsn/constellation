import React from 'react';

interface BigDipperBackgroundProps {
  className?: string;
}

export function BigDipperBackground({ className = '' }: BigDipperBackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Big Dipper Stars */}
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="70%" stopColor="rgba(255, 255, 255, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>
        </defs>

        {/* Big Dipper - Bowl Stars */}
        <circle cx="150" cy="200" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="220" cy="180" r="4" fill="white" filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))" />
        <circle cx="280" cy="220" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="200" cy="280" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />

        {/* Big Dipper - Handle Stars */}
        <circle cx="380" cy="160" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="480" cy="140" r="4" fill="white" filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))" />
        <circle cx="580" cy="120" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />

        {/* Ursa Minor (Little Dipper) - Bottom Left Stars */}
        <circle cx="80" cy="380" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="120" cy="350" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="100" cy="320" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="60" cy="340" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="20" cy="360" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="160" cy="330" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="200" cy="310" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="240" cy="290" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />

        {/* Orion's Belt - Top Left Stars */}
        <circle cx="50" cy="80" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="120" cy="70" r="4" fill="white" filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))" />
        <circle cx="190" cy="60" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />

        {/* Cassiopeia - Top Right Stars */}
        <circle cx="750" cy="60" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="820" cy="40" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="880" cy="50" r="4" fill="white" filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))" />
        <circle cx="940" cy="70" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="990" cy="80" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />

        {/* Lyra - Bottom Right Stars */}
        <circle cx="700" cy="400" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="750" cy="380" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="780" cy="420" r="4" fill="white" filter="drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))" />
        <circle cx="730" cy="440" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />

        {/* Hercules (Keystone) - Center Right Stars */}
        <circle cx="650" cy="250" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="720" cy="230" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />
        <circle cx="740" cy="280" r="3.5" fill="white" filter="drop-shadow(0 0 3.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="670" cy="300" r="3" fill="white" filter="drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))" />

        {/* Draco (Dragon) - Center Stars */}
        <circle cx="400" cy="100" r="2" fill="white" filter="drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))" />
        <circle cx="450" cy="120" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="500" cy="100" r="2" fill="white" filter="drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))" />
        <circle cx="550" cy="130" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="600" cy="110" r="2" fill="white" filter="drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))" />
        <circle cx="470" cy="160" r="2.5" fill="white" filter="drop-shadow(0 0 2.5px rgba(255, 255, 255, 0.8))" />
        <circle cx="510" cy="180" r="2" fill="white" filter="drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))" />

        {/* Extensive scattered starfield */}
        <circle cx="100" cy="150" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="200" cy="120" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="300" cy="150" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="350" cy="200" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="450" cy="180" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="550" cy="220" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="650" cy="190" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="750" cy="240" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="850" cy="210" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="950" cy="260" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />

        <circle cx="50" cy="300" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="150" cy="320" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="250" cy="350" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="350" cy="380" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="450" cy="360" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="550" cy="390" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="650" cy="370" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="750" cy="400" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="850" cy="380" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="950" cy="410" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />

        <circle cx="75" cy="450" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="175" cy="480" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="275" cy="460" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="375" cy="490" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="475" cy="470" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="575" cy="500" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="675" cy="480" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="775" cy="510" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="875" cy="490" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="975" cy="520" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />

        <circle cx="125" cy="50" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="225" cy="80" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="325" cy="60" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="425" cy="90" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="525" cy="70" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="625" cy="100" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="725" cy="80" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />
        <circle cx="825" cy="110" r="1.5" fill="white" filter="drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))" />
        <circle cx="925" cy="90" r="1" fill="white" filter="drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))" />

        {/* Animated Connecting Lines */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes drawLine {
              to {
                stroke-dashoffset: 0;
              }
            }

            @keyframes disappearAndRestart {
              0% {
                opacity: 0.4;
                stroke-dashoffset: 0;
              }
              10% {
                opacity: 0.4;
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

            .animated-line {
              stroke: rgba(255, 255, 255, 0.4);
              stroke-width: 1.5;
              fill: none;
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: drawLine 1s ease-out forwards, disappearAndRestart 6s 2s infinite;
            }

            .line-delay-1 { animation-delay: 0.1s; }
            .line-delay-2 { animation-delay: 0.2s; }
            .line-delay-3 { animation-delay: 0.3s; }
            .line-delay-4 { animation-delay: 0.4s; }
            .line-delay-5 { animation-delay: 0.5s; }
            .line-delay-6 { animation-delay: 0.6s; }
            .line-delay-7 { animation-delay: 0.7s; }
          `
        }} />

        {/* Bowl connections */}
        <line x1="150" y1="200" x2="220" y2="180" className="animated-line line-delay-1" />
        <line x1="220" y1="180" x2="280" y2="220" className="animated-line line-delay-2" />
        <line x1="280" y1="220" x2="200" y2="280" className="animated-line line-delay-3" />
        <line x1="200" y1="280" x2="150" y2="200" className="animated-line line-delay-4" />

        {/* Handle connections */}
        <line x1="220" y1="180" x2="380" y2="160" className="animated-line line-delay-5" />
        <line x1="380" y1="160" x2="480" y2="140" className="animated-line line-delay-6" />
        <line x1="480" y1="140" x2="580" y2="120" className="animated-line line-delay-7" />

        {/* Ursa Minor (Little Dipper) connections - Bowl */}
        <line x1="80" y1="380" x2="120" y2="350" className="animated-line line-delay-1" />
        <line x1="120" y1="350" x2="100" y2="320" className="animated-line line-delay-2" />
        <line x1="100" y1="320" x2="60" y2="340" className="animated-line line-delay-3" />
        <line x1="60" y1="340" x2="80" y2="380" className="animated-line line-delay-4" />

        {/* Ursa Minor (Little Dipper) connections - Handle */}
        <line x1="120" y1="350" x2="160" y2="330" className="animated-line line-delay-5" />
        <line x1="160" y1="330" x2="200" y2="310" className="animated-line line-delay-6" />
        <line x1="200" y1="310" x2="240" y2="290" className="animated-line line-delay-7" />

        {/* Orion's Belt connections */}
        <line x1="50" y1="80" x2="120" y2="70" className="animated-line line-delay-1" />
        <line x1="120" y1="70" x2="190" y2="60" className="animated-line line-delay-2" />

        {/* Cassiopeia (W shape) connections */}
        <line x1="750" y1="60" x2="820" y2="40" className="animated-line line-delay-1" />
        <line x1="820" y1="40" x2="880" y2="50" className="animated-line line-delay-2" />
        <line x1="880" y1="50" x2="940" y2="70" className="animated-line line-delay-3" />
        <line x1="940" y1="70" x2="990" y2="80" className="animated-line line-delay-4" />

        {/* Lyra (diamond) connections */}
        <line x1="700" y1="400" x2="750" y2="380" className="animated-line line-delay-1" />
        <line x1="750" y1="380" x2="780" y2="420" className="animated-line line-delay-2" />
        <line x1="780" y1="420" x2="730" y2="440" className="animated-line line-delay-3" />
        <line x1="730" y1="440" x2="700" y2="400" className="animated-line line-delay-4" />

        {/* Hercules (Keystone) connections */}
        <line x1="650" y1="250" x2="720" y2="230" className="animated-line line-delay-1" />
        <line x1="720" y1="230" x2="740" y2="280" className="animated-line line-delay-2" />
        <line x1="740" y1="280" x2="670" y2="300" className="animated-line line-delay-3" />
        <line x1="670" y1="300" x2="650" y2="250" className="animated-line line-delay-4" />

        {/* Draco (Dragon) connections */}
        <line x1="400" y1="100" x2="450" y2="120" className="animated-line line-delay-1" />
        <line x1="450" y1="120" x2="500" y2="100" className="animated-line line-delay-2" />
        <line x1="500" y1="100" x2="550" y2="130" className="animated-line line-delay-3" />
        <line x1="550" y1="130" x2="600" y2="110" className="animated-line line-delay-4" />
        <line x1="450" y1="120" x2="470" y2="160" className="animated-line line-delay-5" />
        <line x1="470" y1="160" x2="510" y2="180" className="animated-line line-delay-6" />
      </svg>
    </div>
  );
}
