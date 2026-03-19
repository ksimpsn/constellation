import React from 'react';
import { BigDipperBackground } from './BigDipperBackground';

export default function BigDipperDemo() {
  return (
    <div className="relative min-h-screen bg-slate-900 flex items-center justify-center">
      {/* Big Dipper Background */}
      <BigDipperBackground />

      {/* Content overlay */}
      <div className="relative z-10 text-center text-white">
        <h1 className="text-6xl font-bold mb-4">Big Dipper</h1>
        <p className="text-xl opacity-80">Animated constellation background</p>
        <p className="text-sm mt-8 opacity-60">Watch the lines draw themselves...</p>
      </div>
    </div>
  );
}
