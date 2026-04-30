import { useEffect, useId, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    TradingView?: { widget: (opts: Record<string, unknown>) => unknown };
  }
}

function clampSymbol(v: string): string {
  const s = v.trim().toUpperCase();
  if (!s) return 'BINANCE:TONUSDT';
  return s.replace(/[^A-Z0-9:_-]/g, '').slice(0, 40) || 'BINANCE:TONUSDT';
}

export default function TechnicalAnalysisPage() {
  const [symbol, setSymbol] = useState('BINANCE:TONUSDT');
  const [draft, setDraft] = useState('BINANCE:TONUSDT');

  const reactId = useId();
  const containerId = useMemo(() => `tv_${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId]);

  useEffect(() => {
    const id = containerId;
    const mount = () => {
      const tv = window.TradingView;
      if (!tv?.widget) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      tv.widget({
        autosize: true,
        symbol,
        interval: '60',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#0A0A1E',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: id,
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-tv="tvjs"]');
    if (existing) {
      mount();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.dataset.tv = 'tvjs';
    script.onload = () => mount();
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [symbol, containerId]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Analiză tehnică</h1>
            <p className="mt-2 text-white/70 text-sm">TradingView chart (educațional). Ex: BINANCE:TONUSDT</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-[220px]" />
            <Button onClick={() => setSymbol(clampSymbol(draft))} className="rounded-xl">
              Load
            </Button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div id={containerId} className="h-[520px] w-full" />
        </div>
      </div>
    </main>
  );
}
