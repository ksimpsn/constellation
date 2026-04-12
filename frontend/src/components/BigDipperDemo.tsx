import React from 'react';
import { BigDipperBackground } from './BigDipperBackground';
import PageFooter from './PageFooter';

export default function BigDipperDemo() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-900">
      {/* Big Dipper Background */}
      <BigDipperBackground />

      {/* Content overlay */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center text-center text-white px-6 pb-10">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <h1 className="text-6xl font-bold mb-4">Big Dipper</h1>
          <p className="text-xl opacity-80">Animated constellation background</p>
          <p className="text-sm mt-8 opacity-60">Watch the lines draw themselves...</p>
        </div>
        <PageFooter className="w-full max-w-md justify-center border-white/20" />
      </div>
    </div>
  );
}
