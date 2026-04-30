import { Download, ExternalLink, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import type { RwaDocType,RwaDocument } from '@/lib/rwaPortfolio';

function setGlowVars(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  el.style.setProperty('--glow-x', `${x}px`);
  el.style.setProperty('--glow-y', `${y}px`);
  el.style.setProperty('--glow-on', '1');
}

function clearGlowVars(el: HTMLElement) {
  el.style.setProperty('--glow-on', '0');
}

function labelForType(t: RwaDocType, tx: ReturnType<typeof useLanguage>['t']['rwaUi']['documents']): string {
  if (t === 'whitepaper') return tx.typeWhitepaper;
  if (t === 'land_registry') return tx.typeRegistry;
  if (t === 'audit') return tx.typeAudit;
  if (t === 'ipfs_proof') return tx.typeIpfs;
  return tx.typeTimeline;
}

export function RwaDocumentsPanel({
  documents,
  title,
}: {
  documents: readonly RwaDocument[];
  title?: string;
}) {
  const { t } = useLanguage();
  const tx = t.rwaUi.documents;
  const resolvedTitle = title ?? tx.title;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RwaDocType | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      const typeOk = typeFilter === 'all' ? true : d.docType === typeFilter;
      const qOk = !q ? true : d.title.toLowerCase().includes(q);
      return typeOk && qOk;
    });
  }, [documents, query, typeFilter]);

  return (
    <section
      id="documente"
      className="bento-card border border-white/10 p-6 shadow-depth scroll-mt-28"
      aria-label={tx.ariaLabel}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display font-bold text-base text-solaris-text">{resolvedTitle}</h3>
          <p className="text-solaris-muted text-sm mt-1">
            {tx.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="relative">
            <span className="sr-only">{tx.searchSr}</span>
            <Search className="w-4 h-4 text-solaris-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-11 w-full sm:w-64 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 text-sm text-solaris-text placeholder:text-solaris-muted focus:outline-none focus:ring-1 focus:ring-solaris-gold/40"
              placeholder={tx.searchPlaceholder}
            />
          </label>
          <label className="relative">
            <span className="sr-only">{tx.filterSr}</span>
            <select
              className="min-h-11 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-solaris-text focus:outline-none focus:ring-1 focus:ring-solaris-gold/40"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as RwaDocType | 'all')}
            >
              <option value="all">{tx.filterAll}</option>
              <option value="whitepaper">{tx.filterWhitepaper}</option>
              <option value="audit">{tx.filterAudit}</option>
              <option value="ipfs_proof">{tx.filterIpfs}</option>
              <option value="land_registry">{tx.filterRegistry}</option>
              <option value="timeline">{tx.filterTimeline}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((d) => (
          <article
            key={d.id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-black/40 transition-colors"
            onPointerMove={(e) => setGlowVars(e.currentTarget, e.clientX, e.clientY)}
            onPointerLeave={(e) => clearGlowVars(e.currentTarget)}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
              style={{
                opacity: 'var(--glow-on, 0)' as unknown as number,
                background:
                  'radial-gradient(240px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(16,185,129,0.18), rgba(242,201,76,0.08) 42%, transparent 70%)',
              }}
            />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-solaris-gold" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-semibold text-sm text-solaris-text truncate">{d.title}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-solaris-muted">
                    {labelForType(d.docType, tx)}
                  </span>
                  <span className="text-[10px] font-mono text-solaris-muted">{d.publishedAt}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 text-xs font-semibold text-solaris-text hover:border-solaris-gold/30 hover:text-solaris-gold transition-colors btn-quantum"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                {tx.preview}
              </a>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 text-xs font-semibold text-solaris-text hover:border-emerald-500/30 hover:text-emerald-300 transition-colors btn-quantum"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                {tx.download}
              </a>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-solaris-muted">
          {tx.empty}
        </div>
      ) : null}
    </section>
  );
}
