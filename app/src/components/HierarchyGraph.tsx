import { Copy, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

type LocalGraphUi = {
  localUserAsks: string;
  localIsWalletConnected: string;
  localShowBalance: string;
  localShowConnect: string;
  localNextActions: string;
  localLinks: string;
};

function buildLocalGraph(query: string, tx: LocalGraphUi) {
  const safe = query.replace(/"/g, "'").slice(0, 120);
  return [
    'graph TD',
    `  A[${tx.localUserAsks}: "${safe}"] --> B{${tx.localIsWalletConnected}}`,
    `  B -->|Rezidențial| C[${tx.localShowBalance}]`,
    `  B -->|Business| D[${tx.localShowConnect}]`,
    '  C --> E{Acoperiș bun și consum clar?}',
    '  D --> F{Consum stabil ziua și acces tehnic bun?}',
    `  E -->|Da| G[${tx.localNextActions}]`,
    '  E -->|Nu| H[Cere evaluare la locație și poze detaliate]',
    `  F -->|Da| G`,
    '  F -->|Nu| H',
    `  G --> I[${tx.localLinks}]`,
    '  H --> I',
  ].join('\n');
}

export default function HierarchyGraph({
  className,
  query,
}: {
  className?: string;
  query?: string;
}) {
  const { t } = useLanguage();
  const tx = t.hierarchyGraphUi;
  const resolvedQuery = query ?? t.highIntelligenceUi.neural.defaultQuestion;
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const effectiveGraph = useMemo(() => buildLocalGraph(resolvedQuery, tx), [resolvedQuery, tx]);
  const lines = useMemo(() => {
    return effectiveGraph.split('\n').slice(0, 10);
  }, [effectiveGraph]);

  const copyGraph = async () => {
    const text = effectiveGraph;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        toast.success(tx.graphCopied);
        return;
      }
    } catch {
      void 0;
    }

    try {
      if (typeof document === 'undefined') throw new Error('no document');
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', 'true');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      if (ok) {
        toast.success(tx.graphCopied);
        return;
      }
    } catch {
      void 0;
    }

    toast.error(tx.clipboardUnavailable);
  };

  return (
    <div
      data-testid="mermaid-decision-map"
      className={cn('rounded-xl bg-white/5 border border-white/10 p-4', className)}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="hud-label text-solaris-muted">{tx.title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2.5 h-8 rounded-lg border border-white/10 bg-white/5 text-[11px] text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled
          >
            {tx.render}
          </button>
          <button
            type="button"
            data-testid="mermaid-copy-graph"
            onClick={copyGraph}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled={!effectiveGraph}
            aria-label={tx.ariaCopyGraph}
          >
            <Copy className="w-4 h-4" aria-hidden />
          </button>
          <a
            href="https://mermaid.live/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
            aria-label={tx.ariaOpenMermaid}
          >
            <ExternalLink className="w-4 h-4" aria-hidden />
          </a>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl bg-black/20 border border-white/10 p-3 text-xs text-solaris-muted">
          {tx.renderOptional}
        </div>
        <details
          className="group"
          onToggle={(e) => {
            setIsSourceOpen((e.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className="cursor-pointer select-none text-solaris-text text-xs font-mono">
            <span className="text-solaris-muted">{tx.source}</span> ·{' '}
            <span className="group-open:hidden">{tx.expand}</span>
            <span className="hidden group-open:inline">{tx.collapse}</span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed font-mono text-solaris-text/90">
            {effectiveGraph}
          </pre>
        </details>
      </div>

      {lines.length > 0 && !isSourceOpen && (
        <div className="mt-3 text-[10px] font-mono text-solaris-muted/90 line-clamp-4">
          {lines.join(' · ')}
        </div>
      )}
    </div>
  );
}
