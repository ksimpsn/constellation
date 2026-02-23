import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const zeroAccessItems = [
  'Files on your computer',
  'Browser data or history',
  'Webcam or microphone',
  'Environment variables',
  'Personal information or identity',
];

const allowedInSandbox = [
  'Numeric computation (math, ML, encoding)',
  'Temporary in-memory storage',
  'Self-termination when the task completes',
];

const blockedInSandbox = [
  'File system access (read/write)',
  'Network connections (in or out)',
  'Spawning other processes',
  'Privilege escalation or system calls',
  'Access to your personal data',
];

const weCollect = ['CPU time contributed', 'Task completion status (success/fail)', 'Anonymized aggregate stats'];

const weNeverCollect = [
  'Personal data or identity',
  'System information or hardware IDs',
  'Network activity or IP for tracking',
  'Location or device identifiers',
];

export default function SecurityResearch() {
  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto w-full">
          {/* Back */}
          <div className="mb-8">
            <Link
              to="/security"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <span aria-hidden>←</span> Privacy &amp; Security
            </Link>
          </div>

          {/* Hero */}
          <header className="text-center mb-12 sm:mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50 mb-4">Technical overview</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white/95 leading-tight tracking-tight">
              Why This Is Safe
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto mt-6 rounded-full opacity-80" />
            <p className="text-lg text-white/70 mt-8 max-w-xl mx-auto leading-relaxed">
              Sandboxing, zero-access design, container isolation, and consensus verification—so you know exactly how we protect you.
            </p>
          </header>

          <div className="space-y-8 sm:space-y-10">
            {/* Zero-access */}
            <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mb-1">Zero-access principle</h2>
              <p className="text-white/75 mb-4">
                Constellation only uses CPU time. We never access:
              </p>
              <ul className="space-y-2">
                {zeroAccessItems.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Multi-layer security */}
            <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mb-4">Multi-layer security</h2>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 text-blue-200 font-semibold flex items-center justify-center">1</span>
                  <div>
                    <strong className="text-white/90">Code validation</strong>
                    <p className="text-white/75 text-sm mt-0.5">Only safe workloads (math, ML, encoding) are accepted and executed.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-200 font-semibold flex items-center justify-center">2</span>
                  <div>
                    <strong className="text-white/90">Sandbox inspection</strong>
                    <p className="text-white/75 text-sm mt-0.5">Every task runs in an isolated environment with no system access.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 text-violet-200 font-semibold flex items-center justify-center">3</span>
                  <div>
                    <strong className="text-white/90">Result verification</strong>
                    <p className="text-white/75 text-sm mt-0.5">Redundant execution across multiple machines; mismatches are rejected.</p>
                  </div>
                </li>
              </ol>
            </section>

            {/* Sandboxing / container isolation */}
            <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mb-2">Sandboxing &amp; container isolation</h2>
              <p className="text-white/75 mb-6">
                Tasks run in Docker-like containers with industry-standard security. The sandbox defines exactly what can and cannot happen on your machine.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20">
                  <p className="text-sm font-semibold text-emerald-300 mb-3">Allowed inside sandbox</p>
                  <ul className="space-y-2">
                    {allowedInSandbox.map((item) => (
                      <li key={item} className="text-sm text-white/85 flex gap-2">
                        <span className="text-emerald-400">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/20">
                  <p className="text-sm font-semibold text-red-300 mb-3">Blocked</p>
                  <ul className="space-y-2">
                    {blockedInSandbox.map((item) => (
                      <li key={item} className="text-sm text-white/85 flex gap-2">
                        <span className="text-red-400">✕</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Consensus verification */}
            <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mb-2">Consensus verification</h2>
              <p className="text-white/75">
                Results are cross-checked across multiple volunteers. Mismatches are automatically rejected, making tampering or malicious results mathematically improbable. Only consensus results are accepted.
              </p>
            </section>

            {/* Data collection */}
            <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mb-4">What we collect (and what we don’t)</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-emerald-300 mb-3">We collect</p>
                  <ul className="space-y-2">
                    {weCollect.map((item) => (
                      <li key={item} className="text-sm text-white/85 flex gap-2">
                        <span className="text-emerald-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-amber-300 mb-3">We never collect</p>
                  <ul className="space-y-2">
                    {weNeverCollect.map((item) => (
                      <li key={item} className="text-sm text-white/85 flex gap-2">
                        <span className="text-amber-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 hover:border-emerald-400/60 hover:text-white transition-all duration-300 font-medium"
            >
              Join secure computing
            </Link>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
