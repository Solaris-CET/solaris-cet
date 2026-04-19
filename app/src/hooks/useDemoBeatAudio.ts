import { useEffect, useRef } from 'react';

type DemoBeatDetail = { intensity?: number };

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function useDemoBeatAudio(enabled: boolean) {
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);
  const lastBeatAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (import.meta.env.VITE_LHCI === '1') return;
    if (typeof navigator !== 'undefined') {
      const navAny = navigator as Navigator & { webdriver?: boolean };
      if (navAny.webdriver === true) return;
    }

    const ensureContext = async () => {
      if (!enabledRef.current) return null;
      if (ctxRef.current) {
        if (ctxRef.current.state !== 'running') await ctxRef.current.resume();
        return ctxRef.current;
      }
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 1.2;
      filter.connect(master);

      const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

      ctxRef.current = ctx;
      masterRef.current = master;
      filterRef.current = filter;
      noiseRef.current = noiseBuf;

      await ctx.resume();
      return ctx;
    };

    const onUserGesture = () => {
      void ensureContext();
    };

    const playBeat = async (intensity: number) => {
      const ctx = await ensureContext();
      if (!ctx) return;
      const master = masterRef.current;
      const filter = filterRef.current;
      const noiseBuf = noiseRef.current;
      if (!master || !filter || !noiseBuf) return;
      if (ctx.state !== 'running') return;

      const now = performance.now();
      if (now - lastBeatAtRef.current < 120) return;
      lastBeatAtRef.current = now;

      const i = clamp01(intensity);
      if (i <= 0.02) return;

      const t = ctx.currentTime;
      const vol = 0.015 + i * 0.03;
      const burst = 0.06 + i * 0.07;
      filter.frequency.setTargetAtTime(800 + i * 2400, t, 0.015);
      filter.Q.setTargetAtTime(0.9 + i * 5.0, t, 0.02);

      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.playbackRate.value = 0.95 + i * 0.55;
      src.connect(filter);

      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(vol, t + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0008, t + burst);

      src.start(t);
      src.stop(t + burst + 0.02);
    };

    const onBeat = (ev: Event) => {
      if (!enabledRef.current) return;
      const ce = ev as CustomEvent<DemoBeatDetail>;
      const i = typeof ce.detail?.intensity === 'number' ? ce.detail.intensity : 0;
      void playBeat(i);
    };

    window.addEventListener('pointerdown', onUserGesture, { passive: true });
    window.addEventListener('keydown', onUserGesture);
    window.addEventListener('solaris:demoBeat', onBeat as EventListener);

    return () => {
      window.removeEventListener('pointerdown', onUserGesture);
      window.removeEventListener('keydown', onUserGesture);
      window.removeEventListener('solaris:demoBeat', onBeat as EventListener);
      const ctx = ctxRef.current;
      ctxRef.current = null;
      masterRef.current = null;
      filterRef.current = null;
      noiseRef.current = null;
      if (ctx && ctx.state !== 'closed') void ctx.close();
    };
  }, [enabled]);
}
