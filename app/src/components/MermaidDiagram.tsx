import { useEffect, useMemo, useState } from 'react';
import { SafeHtml } from './SafeHtml';

export default function MermaidDiagram({ graph }: { graph: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'dark',
        });
        const id = `mermaid-${Math.random().toString(16).slice(2)}`;
        const { svg } = await mermaid.render(id, graph);
        if (!alive) return;
        setSvg(svg);
        setFailed(false);
      } catch {
        if (!alive) return;
        setFailed(true);
      }
    };

    setSvg(null);
    setFailed(false);
    void run();
    return () => {
      alive = false;
    };
  }, [graph]);

  const content = useMemo(() => {
    if (failed) return null;
    if (!svg) return null;
    return svg;
  }, [failed, svg]);

  if (failed) return null;
  if (!content) return null;

  return (
    <SafeHtml
      html={content}
      config={{ kind: 'svg' }}
      dataTestId="mermaid-svg"
      className="w-full overflow-x-auto rounded-xl bg-black/20 border border-white/10 p-3"
    />
  );
}
