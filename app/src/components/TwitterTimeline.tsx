import { useEffect, useMemo, useRef } from 'react';

type Props = {
  handle: string;
  height?: number;
  theme?: 'dark' | 'light';
};

function ensureScript(): void {
  if (document.getElementById('twitter-wjs')) return;
  const s = document.createElement('script');
  s.id = 'twitter-wjs';
  s.src = 'https://platform.twitter.com/widgets.js';
  s.async = true;
  document.body.appendChild(s);
}

export function TwitterTimeline({ handle, height = 620, theme = 'dark' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const href = useMemo(() => `https://twitter.com/${handle.replace(/^@/, '')}`, [handle]);

  useEffect(() => {
    ensureScript();
    const el = ref.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      const twttr = (window as unknown as { twttr?: { widgets?: { load?: (e?: HTMLElement) => void } } }).twttr;
      const load = twttr?.widgets?.load;
      if (typeof load === 'function') load(el);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [href]);

  return (
    <div ref={ref} className="w-full">
      <a
        className="twitter-timeline"
        data-theme={theme}
        data-height={String(height)}
        data-dnt="true"
        href={href}
      >
        Posts by {handle}
      </a>
    </div>
  );
}

