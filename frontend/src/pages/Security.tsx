import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const highlights = [
  {
    title: 'Your privacy is protected',
    body: 'Constellation is built with privacy and security as core design principles. Your personal information, identity, and browsing data stay on your device.',
    tag: 'Privacy first',
  },
  {
    title: 'Sandboxed environments',
    body: 'All third-party projects run inside secure, isolated environments. No harmful code, malware, or unauthorized processes can access your device.',
    tag: 'Isolation',
  },
  {
    title: 'Modern security practices',
    body: 'We use continuous verification, strict isolation between tasks, and industry-standard safeguards so distributed computing stays safe at scale.',
    tag: 'Verification',
  },
  {
    title: 'Contribute safely',
    body: 'You can contribute to scientific and technological progress without compromising your privacy or the safety of your machine.',
    tag: 'Peace of mind',
  },
];

export default function Security() {
  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto w-full">
          {/* Hero */}
          <header className="text-center mb-12 sm:mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50 mb-4">Safety first</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white/95 leading-tight tracking-tight">
              Privacy &amp; Security
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto mt-6 rounded-full opacity-80" />
            <p className="text-lg text-white/70 mt-8 max-w-xl mx-auto leading-relaxed">
              We never see your files, your identity, or your browsing. Research runs in locked-down environments you can trust.
            </p>
          </header>

          {/* Highlight cards */}
          <div className="grid gap-4 sm:gap-5 mb-12">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="group p-5 sm:p-6 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md hover:bg-white/[0.1] hover:border-white/20 transition-all duration-500"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                  {item.tag}
                </span>
                <h2 className="text-lg sm:text-xl font-semibold text-white/95 mt-1 mb-2 group-hover:text-white">
                  {item.title}
                </h2>
                <p className="text-white/75 leading-relaxed group-hover:text-white/90">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Primary CTA: full safety details */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-6 sm:p-8 text-center">
            <h3 className="text-lg font-semibold text-white/95 mb-2">
              Why is this safe? Full details
            </h3>
            <p className="text-sm text-white/70 mb-5 max-w-md mx-auto">
              Sandboxing, zero-access design, container isolation, and how we verify results—all in one place.
            </p>
            <Link
              to="/security-research"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 hover:border-emerald-400/60 hover:text-white transition-all duration-300 font-medium"
            >
              <span>Privacy &amp; security research</span>
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              to="/why"
              className="text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              ← Why Constellation?
            </Link>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
