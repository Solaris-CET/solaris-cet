import { Component, memo, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildTwin3DPanels, roofSizeFromKwp } from '@/lib/twin3dScene';
import { cn } from '@/lib/utils';

const LABELS = {
  unavailable: 'Model 3D indisponibil — lipsă date sistem',
  loadError: 'Previzualizarea 3D nu s-a putut încărca',
  viewerDesc: 'Vizualizare decorativă a panourilor pe acoperiș, fără interacțiune.',
  viewerLabel: (kwp: number, score: number) =>
    `Model 3D site fotovoltaic ${kwp} kWp, scor potrivire ${score} din 100`,
} as const;

export type Twin3DViewerProps = {
  capacityKwp: number;
  suitabilityScore?: number;
  className?: string;
};

type SiteModelProps = {
  capacityKwp: number;
  suitabilityScore: number;
};

export function emissiveFromScore(score: number): string {
  if (score >= 80) return '#1a3d5c';
  if (score >= 60) return '#2a3550';
  return '#3a2a40';
}

const SiteModel = memo(function SiteModel({ capacityKwp, suitabilityScore }: SiteModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const sunRef = useRef<THREE.DirectionalLight>(null!);
  const panels = useMemo(() => buildTwin3DPanels(capacityKwp), [capacityKwp]);
  const roof = useMemo(() => roofSizeFromKwp(capacityKwp), [capacityKwp]);
  const emissive = emissiveFromScore(suitabilityScore);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.12;
    }
    if (sunRef.current) {
      const t = clock.getElapsedTime();
      sunRef.current.position.set(Math.sin(t * 0.4) * 4, 3 + Math.cos(t * 0.25), Math.cos(t * 0.4) * 3);
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.35, 0.2, 0]}>
      <directionalLight ref={sunRef} intensity={1.1} color="#ffdd99" />
      <ambientLight intensity={0.45} />
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[roof.w, 0.12, roof.d]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.85} metalness={0.1} />
      </mesh>
      {panels.map((p) => (
        <mesh key={`${p.x}-${p.z}`} position={[p.x, 0.04, p.z]}>
          <boxGeometry args={[p.w, 0.03, p.d]} />
          <meshStandardMaterial color="#2f5f8f" metalness={0.9} roughness={0.25} emissive={emissive} />
        </mesh>
      ))}
      <mesh position={[0, -0.35, roof.d * 0.35]}>
        <boxGeometry args={[0.5, 0.7, 0.5]} />
        <meshStandardMaterial color="#8a9aaa" roughness={0.7} />
      </mesh>
    </group>
  );
});

type Twin3DCanvasBoundaryProps = { children: ReactNode; fallback: ReactNode };
type Twin3DCanvasBoundaryState = { hasError: boolean };

class Twin3DCanvasBoundary extends Component<Twin3DCanvasBoundaryProps, Twin3DCanvasBoundaryState> {
  state: Twin3DCanvasBoundaryState = { hasError: false };

  static getDerivedStateFromError(): Twin3DCanvasBoundaryState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function Twin3DViewer({ capacityKwp, suitabilityScore, className }: Twin3DViewerProps) {
  const score = suitabilityScore ?? 0;
  const viewerLabel = useMemo(
    () => LABELS.viewerLabel(capacityKwp, score),
    [capacityKwp, score],
  );

  if (capacityKwp <= 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-black/30 px-3 py-6 text-center text-xs text-white/45',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {LABELS.unavailable}
      </div>
    );
  }

  const errorFallback = (
    <div
      className="flex h-44 w-full items-center justify-center rounded-lg border border-white/10 bg-black/30 px-3 text-center text-xs text-white/45"
      role="alert"
    >
      {LABELS.loadError}
    </div>
  );

  return (
    <figure
      className={cn(
        'h-44 w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/60',
        className,
      )}
      aria-label={viewerLabel}
    >
      <Twin3DCanvasBoundary fallback={errorFallback}>
        <div className="h-full w-full" aria-hidden="true">
          <Canvas camera={{ position: [2.8, 2.2, 3.2], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
            <SiteModel capacityKwp={capacityKwp} suitabilityScore={score} />
          </Canvas>
        </div>
      </Twin3DCanvasBoundary>
      <figcaption className="sr-only">
        {viewerLabel}. {LABELS.viewerDesc}
      </figcaption>
    </figure>
  );
}