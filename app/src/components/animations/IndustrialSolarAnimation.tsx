import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function IndustrialRoof() {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // rotație lentă pentru efect vizual
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
    }
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t) * 5;
      lightRef.current.position.z = Math.cos(t) * 5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* lumină ambientală */}
      <ambientLight intensity={0.5} />
      <directionalLight ref={lightRef} intensity={1.2} color="#ffcc88" position={[5, 10, 3]} />

      {/* suprafața acoperișului TPO */}
      <mesh rotation={[-Math.PI / 8, 0, 0]} position={[0, -0.3, 0]}>
        <boxGeometry args={[4, 0.04, 3]} />
        <meshStandardMaterial color="#5a6b7c" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* rânduri de panouri solare */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            rotation={[-Math.PI / 8, 0, 0]}
            position={[-1.2 + col * 1.2, -0.25, -0.9 + row * 0.9]}
          >
            <boxGeometry args={[0.9, 0.03, 0.6]} />
            <meshStandardMaterial
              color="#2c3e66"
              metalness={0.85}
              roughness={0.3}
              emissive="#112233"
            />
          </mesh>
        ))
      )}

      {/* detalii structură metalică */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`beam-${i}`}
          rotation={[-Math.PI / 8, 0, 0]}
          position={[-1.6 + i * 0.8, -0.28, 0]}
        >
          <boxGeometry args={[0.04, 0.02, 2.6]} />
          <meshStandardMaterial color="#8a9baa" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default function IndustrialSolarAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }} gl={{ alpha: true }}>
        <IndustrialRoof />
      </Canvas>
    </div>
  );
}
