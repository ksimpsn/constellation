import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';
import PageFooter from '../components/PageFooter';
import { useGoBack } from '../hooks/useGoBack';
import { sections, accentBorder } from '../data/whySections';

const accentIconRing: Record<string, string> = {
  violet: 'ring-violet-400/35 shadow-[0_0_20px_rgba(139,92,246,0.25)]',
  emerald: 'ring-emerald-400/35 shadow-[0_0_20px_rgba(52,211,153,0.2)]',
};

const accentIconBg: Record<string, string> = {
  violet: 'bg-violet-500/15 text-violet-200',
  emerald: 'bg-emerald-500/15 text-emerald-200',
};

export default function Why() {
  const [openId, setOpenId] = useState<string | null>(null);
  const goBack = useGoBack();

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24 overflow-hidden">
        {/* Soft ambient orbs, depth without clutter */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-[40%] -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[90px] sm:right-[10%]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-20 -left-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-[80px] sm:left-[5%]"
          aria-hidden
        />

        <div className="relative flex min-h-0 max-w-4xl flex-1 flex-col mx-auto w-full">
          {/* Hero */}
          <header className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/55 backdrop-blur-md mb-6">
              The vision
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-[1.08] tracking-tight">
              Why Constellation?
            </h1>
            <div className="flex justify-center items-center gap-2.5 mt-7 mb-8" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
              <span className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
            </div>
            <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
              The world&apos;s biggest supercomputer already exists. It&apos;s scattered across billions of pockets and desks.{' '}
              <span className="text-white/90">We&apos;re turning it on.</span>
            </p>
          </header>

          {/* Intro band */}
          <div className="mb-10 sm:mb-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 sm:p-8 backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
            <p className="text-sm sm:text-base text-white/70 leading-relaxed text-center max-w-3xl mx-auto">
              Distributed computing works. The open question is how to keep people contributing, year after year, without burning out
              goodwill. Here&apos;s how we think about it.
            </p>
          </div>

          {/* Accordion sections */}
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section, index) => {
              const isOpen = openId === section.title;
              const headingId = `why-heading-${section.title.replace(/\s+/g, '-')}`;
              const panelId = `why-${section.title.replace(/\s+/g, '-')}`;
              return (
                <article
                  key={section.title}
                  className={`
                    group rounded-2xl border overflow-hidden
                    backdrop-blur-md transition-all duration-300
                    shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                    ${isOpen
                      ? 'bg-white/[0.1] border-white/25 ring-1 ring-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.35)]'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/18'}
                    border-l-[3px] ${accentBorder[section.accent]}
                  `}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : section.title)}
                    className="w-full flex items-start gap-4 sm:gap-5 p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    id={headingId}
                  >
                    <span
                      className={`
                        flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg font-medium
                        ring-1 ring-inset
                        ${accentIconBg[section.accent]}
                        ${accentIconRing[section.accent]}
                      `}
                      aria-hidden
                    >
                      {section.icon}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40 tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                          {section.title}
                        </h2>
                      </div>
                      <p
                        className={`text-sm mt-1.5 leading-snug ${
                          isOpen ? 'text-white/55' : 'text-white/50 group-hover:text-white/60'
                        }`}
                      >
                        {section.subtitle}
                      </p>
                    </div>
                    <span
                      className={`
                        flex-shrink-0 mt-1 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80
                        transition-transform duration-300 ring-1 ring-white/10
                        ${isOpen ? 'rotate-180 bg-white/15' : 'group-hover:bg-white/12'}
                      `}
                      aria-hidden
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-[4.25rem] sm:pl-[4.75rem] pr-5 sm:pr-6 pb-6 sm:pb-7 text-[15px] sm:text-base text-white/72 leading-relaxed border-t border-white/5 bg-white/[0.02]">
                        <div className="pt-5 sm:pt-6 space-y-4 [&_p]:mb-0 [&_strong]:text-white/95">
                          {section.body}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-14 sm:mt-16 rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-transparent p-8 sm:p-10 text-center backdrop-blur-md shadow-[0_8px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/85 mb-2">Next</p>
            <h3 className="text-xl sm:text-2xl font-semibold text-white/95 mb-2">Privacy &amp; security</h3>
            <p className="text-sm sm:text-base text-white/65 max-w-xl mx-auto mb-6 leading-relaxed">
              We focus on what the platform actually does: organizational trust where you already have it,
              Semgrep scanning on uploaded code, and replicated verification of task outputs, alongside policies
              and review that your institution controls.
            </p>
            <Link
              to="/security"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-white/12 border border-white/25 text-white hover:bg-white/20 hover:border-white/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-[0_0_24px_rgba(255,255,255,0.06)]"
            >
              <span className="font-semibold">Privacy &amp; Security</span>
            </Link>
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={goBack}
              className="text-sm text-white/50 hover:text-white/85 transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-white/40 bg-transparent border-0 cursor-pointer font-inherit p-0"
            >
              ← Back
            </button>
          </div>

          <PageFooter className="w-full max-w-3xl mx-auto" />
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
