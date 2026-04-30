import { useEffect, useMemo, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import FooterSection from '@/sections/FooterSection';

type ReleaseNotesPayload = {
  generatedAt: string;
  source: string;
  releases: {
    version: string;
    date: string | null;
    sections: Record<string, string[]>;
  }[];
};

function sortSections(sections: Record<string, string[]>) {
  const order = ['Security', 'Added', 'Changed', 'Fixed', 'Deprecated', 'Removed'];
  const keys = Object.keys(sections);
  return keys.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export default function ReleaseNotesPage() {
  const { t } = useLanguage();
  const [payload, setPayload] = useState<ReleaseNotesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/release-notes.json', { cache: 'no-cache' });
        if (!res.ok) {
          throw new Error(`Failed to load release notes (${res.status})`);
        }
        const data = (await res.json()) as ReleaseNotesPayload;
        if (cancelled) return;
        setPayload(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load release notes');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const releases = useMemo(() => payload?.releases ?? [], [payload]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0"
    >
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pt-24 pb-10">
        <div className="mb-6">
          <p className="hud-label text-[10px]">{t.nav?.home ?? 'Solaris CET'}</p>
          <h1 className="font-display text-3xl md:text-4xl text-white mt-2">Release Notes</h1>
          <p className="text-slate-200/80 mt-3 max-w-2xl leading-relaxed">
            What changed, version by version. Source: <span className="font-mono">CHANGELOG.md</span>.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-100/90">
            <div className="font-semibold">Could not load release notes</div>
            <div className="text-sm mt-1 font-mono">{error}</div>
          </div>
        ) : null}

        {!payload && !error ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-slate-200/70">
            Loading release notes…
          </div>
        ) : null}

        {payload ? (
          <div className="mt-8 space-y-8">
            {releases.map((r) => {
              const sectionKeys = sortSections(r.sections);
              return (
                <article
                  key={r.version}
                  className="rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5"
                >
                  <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="font-display text-xl text-white">
                        {r.version === 'Unreleased' ? 'Unreleased' : `v${r.version}`}
                      </h2>
                      <p className="text-slate-200/70 text-sm">
                        {r.date ? r.date : 'Rolling changes on main'}
                      </p>
                    </div>
                    <a
                      className="text-sm text-solaris-cyan/90 hover:text-solaris-cyan transition-colors"
                      href={`https://github.com/Solaris-CET/solaris-cet/releases${
                        r.version === 'Unreleased' ? '' : `/tag/v${r.version}`
                      }`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on GitHub
                    </a>
                  </header>

                  <div className="mt-4 space-y-5">
                    {sectionKeys.map((k) => {
                      const items = r.sections[k] ?? [];
                      if (items.length === 0) return null;
                      return (
                        <section key={k} className="space-y-2">
                          <h3 className="hud-label text-[10px]">{k}</h3>
                          <ul className="space-y-2 text-sm text-slate-100/85">
                            {items.map((it, idx) => (
                              <li key={`${k}-${idx}`} className="leading-relaxed">
                                <span className="text-solaris-gold/80">•</span> {it}
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
      <FooterSection />
    </main>
  );
}
