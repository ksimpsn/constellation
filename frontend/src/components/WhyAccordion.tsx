import { useState } from 'react';
import { sections, accentBorder } from '../data/whySections';

type WhyAccordionProps = {
  className?: string;
  compact?: boolean;
};

export default function WhyAccordion({ className = '', compact = false }: WhyAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={`${compact ? 'flex flex-col gap-4 flex-1' : 'space-y-5'} ${className}`}>
      {sections.map((section) => {
        const isOpen = openId === section.title;
        return (
          <article
            key={section.title}
            className={`
              rounded-xl border border-white/10 overflow-hidden
              transition-colors duration-200 bg-white/[0.04] hover:bg-white/[0.06]
              border-l-4 ${accentBorder[section.accent]} ${compact ? 'flex-1 min-h-[4.5rem] flex flex-col' : ''}
            `}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : section.title)}
              className={`w-full flex items-center gap-3 sm:gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] ${
                compact ? 'p-4 sm:p-5' : 'p-4 sm:p-5'
              }`}
              aria-expanded={isOpen}
              aria-controls={`why-${section.title.replace(/\s+/g, '-')}`}
              id={`why-heading-${section.title.replace(/\s+/g, '-')}`}
            >
              <span
                className={`flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-white ${
                  compact ? 'w-8 h-8 text-base' : 'w-8 h-8 text-base'
                }`}
                aria-hidden
              >
                {section.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  className={`font-semibold text-white ${
                    compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                  }`}
                >
                  {section.title}
                </h2>
              </div>
              <span
                className={`flex-shrink-0 rounded-lg bg-white/15 flex items-center justify-center text-white transition-transform duration-200 ${
                  compact ? 'w-8 h-8 text-sm' : 'w-8 h-8 text-sm'
                } ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            <div
              id={`why-${section.title.replace(/\s+/g, '-')}`}
              role="region"
              aria-labelledby={`why-heading-${section.title.replace(/\s+/g, '-')}`}
              className={`grid transition-[grid-template-rows] duration-250 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`text-white/70 leading-relaxed ${
                    compact
                      ? 'pl-[3.5rem] sm:pl-[4rem] pr-4 sm:pr-5 pb-5 sm:pb-6 text-sm sm:text-base'
                      : 'pl-[4rem] sm:pl-[4.5rem] pr-4 sm:pr-5 pb-4 sm:pb-5 text-sm sm:text-base'
                  }`}
                >
                  {section.body}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
