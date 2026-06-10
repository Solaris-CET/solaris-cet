import { useId, useMemo, useState } from 'react';

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const uid = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const list = useMemo(() => items.filter((x) => x.question && x.answer), [items]);

  return (
    <div className={className ?? ''}>
      <div className="divide-y divide-[#1e293b] rounded-3xl border border-[#1e293b] bg-[#0f172a]" data-reveal-stagger>
        {list.map((item, idx) => {
          const open = openIndex === idx;
          const contentId = `${uid}-faq-${idx}`;
          return (
            <div key={contentId} className="group">
              <button
                type="button"
                className="w-full px-5 sm:px-6 py-5 flex items-start gap-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpenIndex((v) => (v === idx ? null : idx))}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-black text-amber-300">
                  {idx + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-white">{item.question}</span>
                </span>
                <span className="mt-1 shrink-0">
                  <span
                    className={`relative block h-5 w-5 text-amber-300 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
                    aria-hidden
                  >
                    <span className="absolute left-1/2 top-1/2 h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-current" />
                  </span>
                </span>
              </button>

              <div
                id={contentId}
                className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 sm:px-6 pb-5 text-sm leading-relaxed text-[#94A3B8]">{item.answer}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
