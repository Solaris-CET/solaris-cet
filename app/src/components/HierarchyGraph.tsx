import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import MermaidDiagram from './MermaidDiagram';

type MermaidAgentResponse = {
  format: 'mermaid';
  graph: string;
  render: 'client';
};

function buildLocalGraph(query: string) {
  const safe = query.replace(/"/g, "'").slice(0, 120);
  return [
    'graph TD',
    `  A[User asks: "${safe}"] --> B{Is wallet connected?}`,
    '  B -->|Yes| C[Show CET balance / staking options]',
    '  B -->|No| D[Show connect wallet]',
    '  C --> E[Show next actions: Buy / Stake / Learn]',
    '  E --> F[Show links + calculators]',
  ].join('\n');
}

export default function HierarchyGraph({
  className,
  query = 'How to stake CET?',
}: {
  className?: string;
  query?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<MermaidAgentResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [renderDiagram, setRenderDiagram] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('solaris_mermaid_render');
      if (v === '1') setRenderDiagram(true);
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsActive(true);
      return;
    }
    const fallback = window.setTimeout(() => setIsActive(true), 2000);
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          window.clearTimeout(fallback);
          setIsActive(true);
        }
      },
      { root: null, threshold: 0.15 },
    );
    obs.observe(el);
    return () => {
      window.clearTimeout(fallback);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    let alive = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const res = await fetch('/api/mermaid/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('bad response');
        const json = (await res.json()) as MermaidAgentResponse;
        if (!alive) return;
        setData(json);
        setFailed(false);
      } catch {
        if (!alive) return;
        setData({ format: 'mermaid', render: 'client', graph: buildLocalGraph(query) });
        setFailed(false);
      }
    };

    void run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [isActive, query]);

  const graph = data?.graph ?? null;
  const lines = useMemo(() => {
    if (!graph) return [];
    return graph.split('\n').slice(0, 10);
  }, [graph]);

  const canCopy = typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

  return (
    <div
      ref={rootRef}
      data-testid="mermaid-decision-map"
      className={cn('rounded-xl bg-white/5 border border-white/10 p-4', className)}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="hud-label text-solaris-muted">DECISION MAP (MERMAID)</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRenderDiagram(true);
              try {
                localStorage.setItem('solaris_mermaid_render', '1');
              } catch {
                void 0;
              }
            }}
            className="px-2.5 h-8 rounded-lg border border-white/10 bg-white/5 text-[11px] text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled={renderDiagram}
          >
            {renderDiagram ? 'Rendered' : 'Render'}
          </button>
          <button
            type="button"
            data-testid="mermaid-copy-graph"
            onClick={async () => {
              if (!graph) return;
              if (!canCopy) {
                toast.error('Clipboard unavailable');
                return;
              }
              try {
                await navigator.clipboard.writeText(graph);
                toast.success('Mermaid graph copied');
              } catch {
                toast.error('Copy failed');
              }
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled={!graph}
            aria-label="Copy Mermaid graph"
          >
            <Copy className="w-4 h-4" aria-hidden />
          </button>
          <a
            href="https://mermaid.live/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
            aria-label="Open Mermaid Live Editor"
          >
            <ExternalLink className="w-4 h-4" aria-hidden />
          </a>
        </div>
      </div>

      {!isActive ? (
        <Skeleton className="h-20 w-full bg-white/10" />
      ) : !data && !failed ? (
        <Skeleton className="h-20 w-full bg-white/10" />
      ) : failed ? (
        <div className="text-solaris-muted text-xs">
          Mermaid graph unavailable right now.
        </div>
      ) : (
        <div className="space-y-3">
          {graph && renderDiagram ? (
            <MermaidDiagram graph={graph} />
          ) : (
            <div className="rounded-xl bg-black/20 border border-white/10 p-3 text-xs text-solaris-muted">
              Render is optional to keep performance tight. Use the Render button if you want the SVG.
            </div>
          )}
          <details className="group">
            <summary className="cursor-pointer select-none text-solaris-text text-xs font-mono">
              <span className="text-solaris-muted">Source</span> ·{' '}
              <span className="group-open:hidden">expand</span>
              <span className="hidden group-open:inline">collapse</span>
            </summary>
            <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed font-mono text-solaris-text/90">
              {graph}
            </pre>
          </details>
        </div>
      )}

      {lines.length > 0 && (
        <div className="mt-3 text-[10px] font-mono text-solaris-muted/90 line-clamp-4">
          {lines.join(' · ')}
        </div>
      )}
    </div>
  );
}
