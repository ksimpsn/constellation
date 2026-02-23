import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const sections = [
  {
    title: 'What is Distributed Computing?',
    summary: 'Thousands of devices working together on large problems.',
    body: (
      <>
        <p className="mb-4">
          Distributed computing spreads a single large computational problem across many devices: laptops, desktops, phones, and even Raspberry Pis. Instead of one supercomputer running for years, you get millions of smaller machines each doing a tiny slice of the work and returning results to a central project.
        </p>
        <p className="mb-4">
          This approach is ideal for tasks that can be split into independent chunks: simulating protein folding, searching for prime numbers, analyzing radio telescope data, or training machine-learning models. No single machine needs the full picture; the network assembles the results.
        </p>
        <p>
          The catch has always been getting enough people to participate and keep their devices available. That’s where incentive design becomes critical.
        </p>
      </>
    ),
    icon: '◇',
    accent: 'violet',
  },
  {
    title: 'What Works Today',
    summary: 'Volunteer projects have already driven real breakthroughs.',
    body: (
      <>
        <p className="mb-4">
          Platforms like <strong className="text-white/90">BOINC</strong> (Berkeley Open Infrastructure for Network Computing) and <strong className="text-white/90">Folding@home</strong> have been running for decades. They’ve contributed to published research in areas such as protein folding, disease modeling, climate prediction, and gravitational-wave detection. Researchers get compute they couldn’t otherwise afford; volunteers get the satisfaction of contributing to science.
        </p>
        <p>
          These projects prove that the technical model works: tasks can be split, sent to volunteers, and aggregated reliably. The bottleneck isn’t the tech. It’s sustaining participation at scale over many years without burning out the goodwill of volunteers.
        </p>
      </>
    ),
    icon: '◆',
    accent: 'emerald',
  },
  {
    title: 'The Limitation',
    summary: 'Relying only on altruism makes long-term scale hard.',
    body: (
      <>
        <p className="mb-4">
          Current volunteer systems depend almost entirely on altruism. People run BOINC or Folding@home because they want to help. That’s powerful, but it’s also fragile. Participation fluctuates with news cycles, personal motivation, and economic pressure. When life gets busy, the first thing to go is often “background compute for a cause.”
        </p>
        <p className="mb-4">
          That makes it hard for researchers to plan. They can’t assume a stable, predictable amount of compute month over month. Projects that need sustained capacity over years face an inherent ceiling: how many people will keep donating spare cycles with no tangible return?
        </p>
        <p>
          The question isn’t whether volunteer computing is valuable (it is), but whether we can add a layer that makes participation more consistent and scalable without losing the spirit of contributing to science.
        </p>
      </>
    ),
    icon: '▷',
    accent: 'violet',
  },
  {
    title: 'The Constellation Approach',
    summary: 'Incentives that make participation sustainable and scalable.',
    body: (
      <>
        <p className="mb-4">
          Constellation keeps everything that works about volunteer computing: the same kind of tasks, the same ability to contribute from your own device. It adds a clear incentive structure. Participants earn rewards for the compute they contribute, so there’s a reason to stay involved even when life gets busy or attention shifts.
        </p>
        <p className="mb-4">
          For researchers, that means a more dependable network. Instead of hoping enough volunteers show up, projects can plan around a base of participants who are motivated to keep their devices available. The result is distributed computing that can scale reliably and last for the long term.
        </p>
        <p>
          Constellation doesn’t replace volunteer spirit; it gives it a sustainable engine so that more people can participate, more consistently, and more research can get done.
        </p>
      </>
    ),
    icon: '★',
    accent: 'emerald',
  },
];

const accentBorder: Record<string, string> = {
  violet: 'border-l-violet-400/50',
  emerald: 'border-l-emerald-400/50',
};

export default function Why() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto w-full">
          {/* Hero */}
          <header className="text-center mb-14 sm:mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50 mb-4">The vision</p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white/95 leading-tight tracking-tight">
              Why Constellation?
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-violet-400/70 via-white/50 to-emerald-400/70 mx-auto mt-6 rounded-full opacity-90" />
            <p className="text-lg sm:text-xl text-white/70 mt-8 max-w-2xl mx-auto leading-relaxed">
              The world's biggest supercomputer already exists. It's scattered across billions of pockets and desks. We're turning it on.
            </p>
          </header>

          {/* Dropdowns */}
          <div className="space-y-1">
            {sections.map((section) => {
              const isOpen = openId === section.title;
              return (
                <article
                  key={section.title}
                  className={`
                    rounded-xl border border-white/10 overflow-hidden
                    transition-colors duration-200
                    ${isOpen ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.04] hover:bg-white/[0.06]'}
                    ${accentBorder[section.accent]}
                  `}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : section.title)}
                    className="w-full flex items-center gap-4 sm:gap-5 p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                    aria-expanded={isOpen}
                    aria-controls={`why-${section.title.replace(/\s+/g, '-')}`}
                    id={`why-heading-${section.title.replace(/\s+/g, '-')}`}
                  >
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-base text-white"
                      aria-hidden
                    >
                      {section.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold text-white">
                        {section.title}
                      </h2>
                      {!isOpen && (
                        <p className="text-sm text-white/80 mt-1 truncate sm:whitespace-normal">
                          {section.summary}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    id={`why-${section.title.replace(/\s+/g, '-')}`}
                    role="region"
                    aria-labelledby={`why-heading-${section.title.replace(/\s+/g, '-')}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-[4.25rem] sm:pl-[4.5rem] pr-5 sm:pr-6 pb-5 sm:pb-6 text-[15px] sm:text-base text-white/70 leading-relaxed space-y-0">
                        {section.body}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 sm:mt-14 pt-2 text-center">
            <Link
              to="/security"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl
                bg-white/15 border border-white/30 text-white
                hover:bg-white/25 hover:border-white/40
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="font-semibold">Privacy &amp; Security</span>
              <span className="text-white/90 group-hover:translate-y-0.5 transition-transform" aria-hidden>↓</span>
            </Link>
            <p className="text-sm text-white/60 mt-3">How we keep you and your device safe</p>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
