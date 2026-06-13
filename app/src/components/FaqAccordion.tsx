import { useMemo } from 'react';

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const list = useMemo(() => items.filter((x) => x.question && x.answer), [items]);

  return (
    <div className={className ?? ''}>
      <div className="divide-y divide-[#1e293b] rounded-3xl border border-[#1e293b] bg-[#0f172a]" data-reveal-stagger>
        {list.map((item, idx) => {
          return (
            <details key={item.question} className="group" open={idx === 0}>
              <summary className="flex cursor-pointer list-none items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 sm:px-6">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[11px] font-black text-amber-300">
                  {idx + 1}
                </span>
                <span className="flex-1 text-base font-semibold text-white">{item.question}</span>
                <span className="mt-1 shrink-0 text-lg font-bold leading-none text-amber-300 transition-transform duration-300 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-relaxed text-[#94A3B8] sm:px-6">{item.answer}</div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
