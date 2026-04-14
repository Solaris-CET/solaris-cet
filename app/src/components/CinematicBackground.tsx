import { useEffect, useMemo, useState } from 'react';
import AppImage from '@/components/AppImage';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const VIDEO_CANDIDATES = ['/cinematic/cosmic-loop.webm', '/cinematic/cosmic-loop.mp4'];

const POSTER_CANDIDATES = ['/cinematic/cosmic-poster.jpg', '/cinematic/cosmic-poster.webp', '/og-image.png'];

const GLYPH_LINES = [
  '∑ ψ(x) e^{iθ} · 量子 · क्वांटम · квант · 量子纠缠 · ⟂ ⊗ ⟂ · ∫ dt · ϕ(t) → ∞',
  'ΛCDM · Ω_m · Ω_Λ · v/c · ΣΔ · 統計 · गणित · αβγ · δt · ⟨0|H|1⟩ · ΔEΔt ≥ ħ/2',
  'FRAME SHIFT · 視点変更 · تغيير زاوية · zmiana perspektywy · 測地線 · Δψ · ρ(x,t)',
];

function useFirstAvailableAsset(candidates: string[]) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let alive = true;
    const controller = new AbortController();

    const pick = async () => {
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
          if (!alive) return;
          if (res.ok) {
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
  }, [candidates]);

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
  const posterUrl = useFirstAvailableAsset(POSTER_CANDIDATES);
  const videoUrl = useFirstAvailableAsset(VIDEO_CANDIDATES);

  const glyphText = useMemo(() => {
    const all = GLYPH_LINES.join('   ·   ');
    return `${all}   ·   ${all}`;
  }, []);

  return (
    <div className="cinematic-bg" aria-hidden>
      <AppImage
        src={posterUrl ?? '/og-image.png'}
        alt=""
        className="cinematic-poster"
        loading="eager"
        decoding="async"
      />

      {canUseVideo && videoUrl ? (
        <video
          className={videoReady ? 'cinematic-video is-ready' : 'cinematic-video'}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterUrl ?? '/og-image.png'}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={videoUrl} type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        </video>
      ) : null}

      <div className="cinematic-grade" aria-hidden />

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
    </div>
  );
}
