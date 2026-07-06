import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function MetalTileRoof3D() {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
    }
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t) * 4;
      lightRef.current.position.z = Math.cos(t) * 4;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight ref={lightRef} intensity={1.2} color="#ffcc88" position={[5, 10, 3]} />
      {/* suprafață bază */}
      <mesh rotation={[-Math.PI / 6, 0, 0]} position={[0, -0.2, 0]}>
        <boxGeometry args={[3, 0.04, 2.5]} />
        <meshStandardMaterial color="#a0b0c0" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* țigle metalice (scoici) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 6, 0, 0]} position={[-1.2 + i * 0.35, -0.12, 0]}>
          <boxGeometry args={[0.22, 0.03, 2.3]} />
          <meshStandardMaterial color="#c0d0e0" metalness={0.92} roughness={0.12} />
        </mesh>
      ))}
      {/* detalii strălucitoare */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`shine-${i}`} rotation={[-Math.PI / 6, 0, 0]} position={[-0.9 + i * 0.36, -0.05, 0]}>
          <boxGeometry args={[0.05, 0.01, 2.1]} />
          <meshStandardMaterial color="#ffdd99" metalness={0.98} roughness={0.05} emissive="#ffaa33" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default function MetalTileRoofAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [2.5, 1.8, 3.5], fov: 50 }} gl={{ alpha: true }}>
        <MetalTileRoof3D />
      </Canvas>
    </div>
  );
}
