import { useEffect, useMemo, useState } from 'react';
import AppImage from '@/components/AppImage';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const CINEMATIC_VIDEO_URL = 'https://cdn.coverr.co/videos/coverr-earth-from-space-5178/1080p.mp4';

const CINEMATIC_POSTER_URL =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=ultra%20realistic%20cinematic%20space%20catastrophe%2C%20two%20planets%20colliding%2C%20glowing%20shockwave%20ring%2C%20debris%20field%2C%20volumetric%20nebula%2C%20cyan%20teal%20and%20violet%20highlights%2C%20deep%20black%20space%2C%20anamorphic%20lens%20flare%2C%20subtle%20film%20grain%2C%20high%20detail%2C%2016%3A9%2C%20no%20text%2C%20no%20watermark&image_size=landscape_16_9';

const GLYPH_LINES = [
  '∑ ψ(x) e^{iθ} · 量子 · क्वांटम · квант · 量子纠缠 · ⟂ ⊗ ⟂ · ∫ dt · ϕ(t) → ∞',
  'ΛCDM · Ω_m · Ω_Λ · v/c · ΣΔ · 統計 · गणित · αβγ · δt · ⟨0|H|1⟩ · ΔEΔt ≥ ħ/2',
  'FRAME SHIFT · 視点変更 · تغيير زاوية · zmiana perspektywy · 測地線 · Δψ · ρ(x,t)',
];

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

  const glyphText = useMemo(() => {
    const all = GLYPH_LINES.join('   ·   ');
    return `${all}   ·   ${all}`;
  }, []);

  return (
    <div className="cinematic-bg" aria-hidden>
      <AppImage
        src={CINEMATIC_POSTER_URL}
        alt=""
        className="cinematic-poster"
        loading="eager"
        decoding="async"
      />

      {canUseVideo ? (
        <video
          className={videoReady ? 'cinematic-video is-ready' : 'cinematic-video'}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={CINEMATIC_POSTER_URL}
          onCanPlay={() => setVideoReady(true)}
        >
          <source src={CINEMATIC_VIDEO_URL} type="video/mp4" />
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
