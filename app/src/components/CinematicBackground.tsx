import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useReducedMotion } from '@/hooks/useReducedMotion';

const VIDEO_CANDIDATES = ['/cinematic/cosmic-loop.webm', '/cinematic/cosmic-loop.mp4'];

const POSTER_FALLBACK = '/cinematic/cosmic-poster-768.jpg';

const GLYPH_LINES = [
  '∑ ψ(x) e^{iθ} · 量子 · क्वांटम · квант · 量子纠缠 · ⟂ ⊗ ⟂ · ∫ dt · ϕ(t) → ∞',
  'ΛCDM · Ω_m · Ω_Λ · v/c · ΣΔ · 統計 · गणित · αβγ · δt · ⟨0|H|1⟩ · ΔEΔt ≥ ħ/2',
  'FRAME SHIFT · 視点変更 · تغيير زاوية · zmiana perspektywy · 測地線 · Δψ · ρ(x,t)',
];

function useFirstAvailableAsset(enabled: boolean, candidates: string[], accept?: (res: Response) => boolean) {
  const [url, setUrl] = useState<string | null>(() => (enabled ? candidates[0] ?? null : null));

  useEffect(() => {
    if (!enabled) {
      setUrl(null);
      return;
    }
    if (typeof window === 'undefined') return;

    let alive = true;
    const controller = new AbortController();

    const pick = async () => {
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
          if (!alive) return;
          if (res.ok && (!accept || accept(res))) {
            setUrl(candidate);
            return;
          }
        } catch {
          void 0;
        }
      }
      if (alive) setUrl(null);
    };

    void pick();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [accept, candidates, enabled]);

  return url;
}

function useCinematicEligibility(reduceMotion: boolean) {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyEligible = (value: boolean) => setEligible(value);

    if (reduceMotion) {
      applyEligible(false);
      return;
    }

    const mql = window.matchMedia('(min-width: 1024px)');
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    const saveData = !!conn?.saveData;

    const apply = () => {
      applyEligible(mql.matches && !saveData);
    };

    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [reduceMotion]);

  return eligible;
}

export function CinematicBackground() {
  const reduceMotion = useReducedMotion();
  const canUseVideo = useCinematicEligibility(reduceMotion);
  const [videoReady, setVideoReady] = useState(false);
  const videoUrl = useFirstAvailableAsset(canUseVideo, VIDEO_CANDIDATES, (res) => {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return ct.startsWith('video/');
  });

  const portalTarget =
    typeof document !== 'undefined' ? document.getElementById('solaris-cinematic-bg') : null;

  const glyphText = useMemo(() => {
    const all = GLYPH_LINES.join('   ·   ');
    return `${all}   ·   ${all}`;
  }, []);

  const content = (
    <>
      {canUseVideo && videoUrl ? (
        <video
          className={videoReady ? 'cinematic-video is-ready' : 'cinematic-video'}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER_FALLBACK}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={videoUrl} type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : null}

      <div className="planet-impact planet-impact--a" aria-hidden />
      <div className="planet-impact planet-impact--b" aria-hidden />
      <div className="planet-collision" aria-hidden />

      <div className="quantum-glyph-stream" aria-hidden>
        <div className="quantum-glyph-stream__col" style={{ ['--glyph-delay' as never]: '0s' }}>
          <div className="quantum-glyph-stream__track">{glyphText}</div>
          <div className="quantum-glyph-stream__track" aria-hidden>
            {glyphText}
          </div>
        </div>
        <div className="quantum-glyph-stream__col" style={{ ['--glyph-delay' as never]: '-1.6s' }}>
          <div className="quantum-glyph-stream__track">{glyphText}</div>
          <div className="quantum-glyph-stream__track" aria-hidden>
            {glyphText}
          </div>
        </div>
        <div className="quantum-glyph-stream__col" style={{ ['--glyph-delay' as never]: '-3.2s' }}>
          <div className="quantum-glyph-stream__track">{glyphText}</div>
          <div className="quantum-glyph-stream__track" aria-hidden>
            {glyphText}
          </div>
        </div>
      </div>
    </>
  );

  if (portalTarget) {
    return createPortal(content, portalTarget);
  }

  return <div className="cinematic-bg" aria-hidden>{content}</div>;
}
