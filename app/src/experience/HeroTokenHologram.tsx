import { Environment, Float, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, DepthOfField,EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { MutableRefObject } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { EntanglementLines, HologramToken } from '@/experience/HologramToken';

type HologramQuality = 'low' | 'high';

type BloomFx = { intensity: number };
type ChromaticFx = { offset?: THREE.Vector2 };
type NoiseFx = { opacity: number };
type VignetteFx = { darkness: number };
type DoFFx = { bokehScale: number; focusDistance: number; focalLength: number };

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function BeatFx({
  quality,
  beatRef,
  baseCaOffset,
  bloomRef,
  caRef,
  noiseRef,
  vignetteRef,
}: {
  quality: HologramQuality;
  beatRef: MutableRefObject<number>;
  baseCaOffset: THREE.Vector2;
  bloomRef: MutableRefObject<BloomFx | null>;
  caRef: MutableRefObject<ChromaticFx | null>;
  noiseRef: MutableRefObject<NoiseFx | null>;
  vignetteRef: MutableRefObject<VignetteFx | null>;
}) {
  useFrame((state) => {
    const b = clamp01(beatRef.current);
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.6 + b * 2.1);
    const k = b * (0.55 + 0.45 * pulse);

    const bloom = bloomRef.current;
    if (bloom) bloom.intensity = (quality === 'high' ? 0.9 : 0.5) + k * (quality === 'high' ? 0.78 : 0.34);

    const ca = caRef.current;
    if (ca?.offset?.set) ca.offset.set(baseCaOffset.x * (1 + 0.9 * k), baseCaOffset.y * (1 + 0.9 * k));

    const noise = noiseRef.current;
    if (noise) noise.opacity = (quality === 'high' ? 0.18 : 0.14) + k * (quality === 'high' ? 0.12 : 0.08);

    const vig = vignetteRef.current;
    if (vig) vig.darkness = (quality === 'high' ? 0.65 : 0.58) + k * 0.08;
  });

  return null;
}

function CameraChoreo({
  scrubRef,
  beatRef,
  quality,
}: {
  scrubRef: MutableRefObject<number>;
  beatRef: MutableRefObject<number>;
  quality: HologramQuality;
}) {
  const { camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.Camera | null>(null);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  useFrame((state) => {
    const cam = cameraRef.current;
    if (!cam) return;
    const p = smoothstep(scrubRef.current);
    const b = clamp01(beatRef.current);
    const t = state.clock.elapsedTime;

    const z0 = 4.2;
    const z1 = quality === 'high' ? 3.35 : 3.6;
    const x1 = quality === 'high' ? 0.18 : 0.12;
    const y1 = quality === 'high' ? 0.08 : 0.05;

    const sway = (Math.sin(t * 0.8) * 0.02 + Math.sin(t * 1.7) * 0.01) * (0.35 + b);
    const shake = (Math.sin(t * 7.2) * 0.006 + Math.cos(t * 5.9) * 0.004) * b;

    cam.position.z = THREE.MathUtils.lerp(z0, z1, p);
    cam.position.x = THREE.MathUtils.lerp(0, x1, p) + sway + shake;
    cam.position.y = THREE.MathUtils.lerp(0, y1, p) + Math.cos(t * 0.9) * 0.01 * (0.4 + b);

    cam.rotation.y = THREE.MathUtils.lerp(0, -0.22, p) + Math.sin(t * 0.6) * 0.02 * (0.25 + b);
    cam.rotation.x = THREE.MathUtils.lerp(0, 0.09, p) + Math.cos(t * 0.55) * 0.012 * (0.25 + b);
  });
  return null;
}

function FocusPullFx({
  quality,
  scrubRef,
  dofRef,
}: {
  quality: HologramQuality;
  scrubRef: MutableRefObject<number>;
  dofRef: MutableRefObject<DoFFx | null>;
}) {
  useFrame(() => {
    if (quality !== 'high') return;
    const p = smoothstep(scrubRef.current);
    const dof = dofRef.current;
    if (!dof) return;
    dof.bokehScale = 0.7 + p * 1.45;
    dof.focusDistance = 0.02 + p * 0.08;
    dof.focalLength = 0.02 + p * 0.03;
  });
  return null;
}

function AgentsMesh({ count, pointerScale }: { count: number; pointerScale: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPointerRef = useRef(new THREE.Vector2(0, 0));
  const smoothedPointerRef = useRef(new THREE.Vector2(0, 0));
  const scrollDriveRef = useRef(0);
  const material = useMemo(() => {
    const vertexShader = `
uniform float uTime;
uniform vec2 uPointer;
uniform float uStrength;
uniform float uRadius;
uniform float uTwist;
uniform float uPointSize;
uniform float uDrive;
varying float vGlow;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 p = position;
  vec3 center = vec3(uPointer.x * 1.45, uPointer.y * 0.95, 0.0);
  vec3 d = p - center;
  float dist = length(d) + 1e-4;
  float falloff = exp(-dist * uRadius);

  float drive = clamp(uDrive, 0.0, 1.0);
  float k = 0.72 + drive * 0.78;
  vec3 rep = (d / dist) * (falloff * uStrength) * k;
  vec3 swirl = vec3(-d.z, 0.0, d.x) * (falloff * uTwist) * (0.65 + drive * 1.05);

  float n = hash13(p * 2.2 + vec3(uTime * 0.05, -uTime * 0.03, uTime * 0.04));
  float wave = sin((p.y + p.x * 0.35 + p.z * 0.22) * 1.35 + uTime * 0.7) * 0.5 + 0.5;
  vec3 jitter = normalize(p) * (n - 0.5) * (0.05 + drive * 0.06) + normalize(p) * wave * (0.015 + drive * 0.02);

  vec3 pp = p + rep + swirl + jitter;

  vec4 mvPosition = modelViewMatrix * vec4(pp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float size = uPointSize * (1.0 + falloff * 1.65);
  gl_PointSize = size * (280.0 / max(1.0, -mvPosition.z));
  vGlow = clamp(0.35 + falloff * 1.2, 0.0, 1.5);
}
`;

    const fragmentShader = `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  float core = smoothstep(0.5, 0.12, r);
  float halo = smoothstep(0.5, 0.0, r) * 0.35;
  float alpha = (core + halo) * uOpacity * vGlow;
  vec3 col = uColor * (0.7 + vGlow * 0.55);
  gl_FragColor = vec4(col, alpha);
}
`;

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uStrength: { value: 0.34 },
        uRadius: { value: 1.35 },
        uTwist: { value: 0.12 },
        uPointSize: { value: 2.35 },
        uDrive: { value: 0 },
        uColor: { value: new THREE.Color('#7CF7FF') },
        uOpacity: { value: 0.55 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);

  useEffect(() => {
    let raf = 0;
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;
    let lastT = typeof performance !== 'undefined' ? performance.now() : 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const t = performance.now();
      const dy = Math.abs(y - lastY);
      const dt = Math.max(16, t - lastT);
      const v = dy / dt;
      scrollDriveRef.current = Math.max(0, Math.min(1, v * 0.9));
      lastY = y;
      lastT = t;
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    let seed = (count * 99991) ^ 0x5bf03635;
    const rand = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      const t = rand();
      const r = 0.9 + t * 2.2;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((state) => {
    const p = pointsRef.current;
    if (!p) return;
    targetPointerRef.current.set(state.pointer.x, state.pointer.y);
    smoothedPointerRef.current.lerp(targetPointerRef.current, 0.08);
    const px = smoothedPointerRef.current.x;
    const py = smoothedPointerRef.current.y;
    p.rotation.y = state.clock.elapsedTime * 0.035;
    p.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.05;

    const m = p.material as THREE.ShaderMaterial;
    (m.uniforms.uTime.value as number) = state.clock.elapsedTime;
    (m.uniforms.uPointer.value as THREE.Vector2).set(px * pointerScale, py * pointerScale);
    (m.uniforms.uStrength.value as number) = 0.32 * pointerScale;
    (m.uniforms.uTwist.value as number) = 0.12 * pointerScale;
    const pointerMag = Math.min(1, Math.sqrt(px * px + py * py) * 1.15);
    const drive = Math.min(1, scrollDriveRef.current + pointerMag * 0.85);
    (m.uniforms.uDrive.value as number) = drive;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function HeroTokenHologram({ quality = 'high', seed = 0.5 }: { quality?: HologramQuality; seed?: number }) {
  const [dpr, setDpr] = useState<number | [number, number]>(quality === 'high' ? [1, 1.6] : 1);
  const baseCaOffset = useMemo(
    () => (quality === 'high' ? new THREE.Vector2(0.0011, 0.0007) : new THREE.Vector2(0, 0)),
    [quality],
  );
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);
  const scrubRef = useRef(0);
  const bloomRef = useRef<BloomFx | null>(null);
  const caRef = useRef<ChromaticFx | null>(null);
  const noiseRef = useRef<NoiseFx | null>(null);
  const vignetteRef = useRef<VignetteFx | null>(null);
  const dofRef = useRef<DoFFx | null>(null);
  const agentCount = useMemo(() => {
    const navAny =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as { deviceMemory?: number; connection?: { saveData?: boolean } })
        : null;
    const saveData = navAny?.connection?.saveData === true;
    const dm = typeof navAny?.deviceMemory === 'number' ? navAny.deviceMemory : null;
    if (saveData) return quality === 'high' ? 8_000 : 4_000;
    if (quality === 'low') {
      if (dm !== null && dm <= 4) return 6_000;
      return 10_000;
    }
    if (dm !== null && dm <= 4) return 14_000;
    return 22_000;
  }, [quality]);

  const pointerScale = quality === 'high' ? 1 : 0.55;

  useEffect(() => {
    const onBeat = (ev: Event) => {
      const ce = ev as CustomEvent<{ intensity?: number }>;
      const i = typeof ce.detail?.intensity === 'number' ? ce.detail.intensity : 0;
      const v = clamp01(i);
      beatRef.current = v;
      setBeat(v);
    };
    window.addEventListener('solaris:demoBeat', onBeat as EventListener);
    return () => {
      window.removeEventListener('solaris:demoBeat', onBeat as EventListener);
    };
  }, []);

  useEffect(() => {
    const onScrub = (ev: Event) => {
      const ce = ev as CustomEvent<{ progress?: number }>;
      const p = typeof ce.detail?.progress === 'number' ? ce.detail.progress : 0;
      scrubRef.current = clamp01(p);
    };
    window.addEventListener('solaris:demoScrub', onScrub as EventListener);
    return () => {
      window.removeEventListener('solaris:demoScrub', onScrub as EventListener);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[6] opacity-70 sm:opacity-85 lg:opacity-100"
      style={{
        maskImage:
          'radial-gradient(ellipse 55% 55% at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0) 72%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 55% 55% at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0) 72%)',
      }}
    >
      <Canvas
        dpr={dpr}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 4.2], fov: 44 }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(quality === 'high' ? [1, 1.6] : 1)}
        />
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} color="#FFE3A1" />
        <directionalLight position={[-3, -2, 2]} intensity={0.55} color="#55F0FF" />
        <fog attach="fog" args={['#020512', 2.8, 9]} />
        <AgentsMesh count={agentCount} pointerScale={pointerScale} />
        <CameraChoreo scrubRef={scrubRef} beatRef={beatRef} quality={quality} />
        <Float speed={1.05} rotationIntensity={0.35} floatIntensity={0.35}>
          <EntanglementLines quality={quality} seed={seed} />
          <HologramToken quality={quality} seed={seed} beat={beat} />
        </Float>
        <EffectComposer multisampling={0}>
          <Bloom
            ref={bloomRef as unknown as never}
            intensity={quality === 'high' ? 0.9 : 0.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <ChromaticAberration
            ref={caRef as unknown as never}
            offset={baseCaOffset}
            radialModulation
            modulationOffset={0.2}
          />
          <Noise
            ref={noiseRef as unknown as never}
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={quality === 'high' ? 0.18 : 0.14}
          />
          <Vignette
            ref={vignetteRef as unknown as never}
            eskil={false}
            offset={0.2}
            darkness={quality === 'high' ? 0.65 : 0.58}
          />
          {quality === 'high' ? (
            <DepthOfField
              ref={dofRef as unknown as never}
              focusDistance={0.02}
              focalLength={0.02}
              bokehScale={0.7}
            />
          ) : (
            <></>
          )}
          <BeatFx
            quality={quality}
            beatRef={beatRef}
            baseCaOffset={baseCaOffset}
            bloomRef={bloomRef}
            caRef={caRef}
            noiseRef={noiseRef}
            vignetteRef={vignetteRef}
          />
          <FocusPullFx quality={quality} scrubRef={scrubRef} dofRef={dofRef} />
        </EffectComposer>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

export default memo(HeroTokenHologram);
