import { Megaphone, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    void 0;
  }
}

export default function AnnouncementBanner() {
  const text = String(import.meta.env.VITE_ANNOUNCEMENT_TEXT ?? '').trim();
  const href = String(import.meta.env.VITE_ANNOUNCEMENT_HREF ?? '').trim();
  const cta = String(import.meta.env.VITE_ANNOUNCEMENT_CTA ?? '').trim();
  const id = String(import.meta.env.VITE_ANNOUNCEMENT_ID ?? 'v1').trim() || 'v1';

  const dismissKey = useMemo(() => `solaris_announcement_dismissed_${id}`, [id]);
  const [dismissed, setDismissed] = useState(() => (text ? readDismissed(dismissKey) : true));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!text || dismissed) {
      document.documentElement.style.setProperty('--solaris-announcement-offset', '0px');
      return;
    }

    const el = ref.current;
    if (!el) return;

    const applyHeight = () => {
      const h = Math.max(0, Math.round(el.getBoundingClientRect().height));
      document.documentElement.style.setProperty('--solaris-announcement-offset', `${h}px`);
    };

    applyHeight();

    const ro = new ResizeObserver(() => applyHeight());
    ro.observe(el);

    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--solaris-announcement-offset', '0px');
    };
  }, [text, dismissed]);

  if (!text || dismissed) return null;

  return (
    <div
      ref={ref}
      className="fixed left-0 right-0 top-0 z-[1100] border-b border-white/10 bg-slate-950/80 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-solaris-gold shrink-0">
          <Megaphone className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 text-xs text-white/80">
          {href ? (
            <a
              href={href}
              className="underline underline-offset-4 decoration-white/20 hover:decoration-white/60 hover:text-white transition-colors"
            >
              {text}
            </a>
          ) : (
            <span>{text}</span>
          )}
        </div>
        {href && cta ? (
          <a
            href={href}
            className="hidden sm:inline-flex items-center rounded-lg border border-solaris-gold/25 bg-solaris-gold/10 px-3 py-1.5 text-[11px] font-semibold text-solaris-gold hover:bg-solaris-gold/15 transition-colors"
          >
            {cta}
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            writeDismissed(dismissKey);
            setDismissed(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Închide anunțul"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

