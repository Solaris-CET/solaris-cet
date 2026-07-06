import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { buildTwin3DPanels, roofSizeFromKwp } from '@/lib/twin3dScene';
import { cn } from '@/lib/utils';

type Props = {
  capacityKwp: number;
  suitabilityScore?: number;
  className?: string;
};

function SiteModel({ capacityKwp, suitabilityScore = 0 }: { capacityKwp: number; suitabilityScore: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const sunRef = useRef<THREE.DirectionalLight>(null!);
  const panels = useMemo(() => buildTwin3DPanels(capacityKwp), [capacityKwp]);
  const roof = useMemo(() => roofSizeFromKwp(capacityKwp), [capacityKwp]);
  const emissive = suitabilityScore >= 80 ? '#1a3d5c' : suitabilityScore >= 60 ? '#2a3550' : '#3a2a40';

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
      {panels.map((p, i) => (
        <mesh key={i} position={[p.x, 0.04, p.z]}>
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
}

export function Twin3DViewer({ capacityKwp, suitabilityScore, className }: Props) {
  if (capacityKwp <= 0) {
    return (
      <div className={cn('rounded-lg border border-white/10 bg-black/30 px-3 py-6 text-center text-xs text-white/45', className)}>
        Model 3D indisponibil — lipsă date sistem
      </div>
    );
  }

  return (
    <div className={cn('h-44 w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/60', className)}>
      <Canvas camera={{ position: [2.8, 2.2, 3.2], fov: 42 }} gl={{ antialias: true }}>
        <SiteModel capacityKwp={capacityKwp} suitabilityScore={suitabilityScore ?? 0} />
      </Canvas>
    </div>
  );
}