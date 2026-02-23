import { Link } from 'react-router-dom';
import ConstellationStarfieldBackground from '../components/ConstellationStarfieldBackground';
import FlowNav from '../components/FlowNav';

const sections = [
  {
    title: 'What is Distributed Computing?',
    body: 'Distributed computing allows thousands of individual devices—laptops, desktops, and phones—to work together on large computational problems.',
    icon: '◇',
    gradient: 'from-blue-400/20 to-cyan-400/20',
    border: 'border-blue-400/30',
  },
  {
    title: 'What Works Today',
    body: 'Platforms like BOINC and Folding@home have proven the power of this model, enabling major breakthroughs in areas such as protein folding and disease research.',
    icon: '◆',
    gradient: 'from-violet-400/20 to-purple-400/20',
    border: 'border-violet-400/30',
  },
  {
    title: 'The Limitation',
    body: 'These systems depend almost entirely on volunteer altruism, making participation difficult to sustain at scale over long periods of time.',
    icon: '▷',
    gradient: 'from-amber-400/20 to-orange-400/20',
    border: 'border-amber-400/30',
  },
  {
    title: 'The Constellation Approach',
    body: 'Constellation builds on the success of volunteer computing by introducing a meaningful incentive structure—unlocking consistent participation and transforming distributed computing into a scalable, dependable network.',
    icon: '★',
    gradient: 'from-emerald-400/20 to-teal-400/20',
    border: 'border-emerald-400/30',
  },
];

export default function Why() {
  return (
    <ConstellationStarfieldBackground>
      <FlowNav />
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto w-full">
          {/* Hero */}
          <header className="text-center mb-16 sm:mb-20">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50 mb-4">The vision</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white/95 leading-tight tracking-tight">
              Why Constellation?
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mt-6 rounded-full opacity-80" />
            <p className="text-lg sm:text-xl text-white/70 mt-8 max-w-xl mx-auto leading-relaxed">
              Turning idle devices into a global research network—with incentives that make participation sustainable.
            </p>
          </header>

          {/* Content cards */}
          <div className="space-y-6 sm:space-y-8">
            {sections.map((section, i) => (
              <article
                key={section.title}
                className={`
                  group relative p-6 sm:p-8 rounded-2xl border backdrop-blur-md
                  bg-white/[0.06] hover:bg-white/[0.1] transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20
                  ${section.gradient} ${section.border}
                `}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl text-white/90 font-medium">
                    {section.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white/95 mt-1 mb-3 group-hover:text-white transition-colors">
                      {section.title}
                    </h2>
                    <p className="text-base sm:text-lg text-white/75 leading-relaxed group-hover:text-white/90 transition-colors">
                      {section.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 sm:mt-16 text-center">
            <Link
              to="/security"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl
                bg-white/10 border border-white/20 text-white/90
                hover:bg-white/20 hover:text-white hover:border-white/30
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="font-medium">Privacy &amp; Security</span>
              <span className="text-white/70 group-hover:translate-y-0.5 transition-transform" aria-hidden>↓</span>
            </Link>
            <p className="text-sm text-white/50 mt-3">How we keep you and your device safe</p>
          </div>
        </div>
      </div>
    </ConstellationStarfieldBackground>
  );
}
