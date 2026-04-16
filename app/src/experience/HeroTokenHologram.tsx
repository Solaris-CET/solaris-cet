import { memo, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, PerformanceMonitor } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { EntanglementLines, HologramToken } from '@/experience/HologramToken';

type HologramQuality = 'low' | 'high';

function AgentsMesh({ count, pointerScale }: { count: number; pointerScale: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPointerRef = useRef(new THREE.Vector2(0, 0));
  const smoothedPointerRef = useRef(new THREE.Vector2(0, 0));
  const material = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.012,
      color: new THREE.Color('#7CF7FF'),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    return m;
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
    const t = state.clock.elapsedTime;
    targetPointerRef.current.set(state.pointer.x, state.pointer.y);
    smoothedPointerRef.current.lerp(targetPointerRef.current, 0.08);
    const px = smoothedPointerRef.current.x;
    const py = smoothedPointerRef.current.y;
    p.rotation.y = t * 0.06 + px * 0.18 * pointerScale;
    p.rotation.x = Math.sin(t * 0.18) * 0.08 + py * 0.14 * pointerScale;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function HeroTokenHologram({ quality = 'high', seed = 0.5 }: { quality?: HologramQuality; seed?: number }) {
  const [dpr, setDpr] = useState<number | [number, number]>(quality === 'high' ? [1, 1.6] : 1);
  const caOffset = useMemo(
    () => (quality === 'high' ? new THREE.Vector2(0.0011, 0.0007) : new THREE.Vector2(0, 0)),
    [quality],
  );
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
        <Float speed={1.05} rotationIntensity={0.35} floatIntensity={0.35}>
          <EntanglementLines quality={quality} seed={seed} />
          <HologramToken quality={quality} seed={seed} />
        </Float>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={quality === 'high' ? 0.9 : 0.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.2} />
          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={quality === 'high' ? 0.18 : 0.14}
          />
          <Vignette eskil={false} offset={0.2} darkness={quality === 'high' ? 0.65 : 0.58} />
        </EffectComposer>
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

export default memo(HeroTokenHologram);
