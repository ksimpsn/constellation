import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';
import PageFooter from '../components/PageFooter';
import { useGoBack } from '../hooks/useGoBack';

const highlights = [
  {
    title: 'Trust within your organization',
    body:
      'Many deployments run inside a single trusted institution, for example a university or research lab, where who may participate and how data is used are already governed by that organization. On those networks, that institutional trust is the practical foundation for sharing work.',
    tag: 'Institutional trust',
    accent: 'from-emerald-400/80 to-teal-500/40',
  },
  {
    title: 'When it is not just one organization',
    body:
      'If a project reaches beyond a single campus or lab, expectations still come from your project lead, institution, and any agreements participants accept. The platform adds technical safeguards (see below). It does not replace ethics review, consent, or your own vetting processes where those apply.',
    tag: 'Governance',
    accent: 'from-sky-400/80 to-indigo-500/40',
  },
  {
    title: 'Semgrep on code researchers upload',
    body:
      'When researchers submit code, the server runs Semgrep static analysis with security oriented rules to help surface common vulnerability patterns before workloads are accepted. Submissions with findings can be blocked until addressed. If Semgrep is not available on a given deployment, that scan may be skipped. Check your environment.',
    tag: 'Static analysis',
    accent: 'from-violet-400/80 to-purple-500/40',
  },
  {
    title: 'Results checked across multiple workers',
    body:
      'Tasks can be configured to run multiple replicas on different workers. The system compares outputs to verify consistency before treating results as final, so work is not accepted from a single run alone when replication and verification are in use.',
    tag: 'Verification across workers',
    accent: 'from-amber-400/80 to-orange-500/40',
  },
] as const;

export default function Security() {
  const goBack = useGoBack();
  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24">
        {/* soft ambient glow behind hero */}
        <div
          className="pointer-events-none fixed inset-x-0 top-24 h-96 max-w-4xl mx-auto rounded-full bg-gradient-to-b from-emerald-500/10 via-violet-500/5 to-transparent blur-3xl opacity-70"
          aria-hidden
        />

        <div className="flex min-h-0 max-w-3xl flex-1 flex-col mx-auto w-full relative">
          {/* Hero */}
          <header className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 mb-6 shadow-[0_0_32px_rgba(16,185,129,0.12)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" aria-hidden />
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-emerald-200/90 font-semibold m-0">
                Safety first
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/75 leading-[1.1] tracking-tight">
              Privacy &amp; Security
            </h1>
            <div className="flex justify-center gap-1 mt-7 mb-2">
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-emerald-400/90 to-teal-400/60" />
              <span className="h-1 w-6 rounded-full bg-white/25" />
              <span className="h-1 w-10 rounded-full bg-gradient-to-r from-violet-400/70 to-indigo-400/50" />
            </div>
            <p className="text-base sm:text-lg text-white/72 mt-6 max-w-xl mx-auto leading-relaxed">
              We focus on what the platform actually does: organizational trust where you already have it,
              Semgrep scanning on uploaded code, and replicated verification of task outputs, alongside policies
              and review that your institution controls.
            </p>
          </header>

          {/* Highlight cards */}
          <div className="grid gap-5 sm:gap-6 mb-14">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-500 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(0,0,0,0.35)] hover:from-white/[0.11]"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.accent} opacity-90`}
                  aria-hidden
                />
                <div className="relative pl-6 sm:pl-8 pr-5 sm:pr-8 py-6 sm:py-7">
                  <span className="inline-block rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    {item.tag}
                  </span>
                  <h2 className="text-lg sm:text-xl font-semibold text-white mt-3 mb-2.5 leading-snug group-hover:text-white">
                    {item.title}
                  </h2>
                  <p className="text-white/72 text-[15px] sm:text-base leading-relaxed group-hover:text-white/85 m-0">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-white/55 hover:text-white/90 transition-colors bg-transparent border-0 cursor-pointer font-inherit p-0 underline-offset-4 hover:underline"
            >
              ← Back
            </button>
          </div>

          <PageFooter className="w-full mt-12" />
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
