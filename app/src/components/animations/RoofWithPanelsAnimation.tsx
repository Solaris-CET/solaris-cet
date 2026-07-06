import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function RoofWithPanels() {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // rotație lentă pentru efect vizual
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.12) * 0.08;
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

      {/* suprafața acoperișului metalic */}
      <mesh rotation={[-Math.PI / 6, 0, 0]} position={[0, -0.2, 0]}>
        <boxGeometry args={[3, 0.05, 2.5]} />
        <meshStandardMaterial color="#7a8c9e" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* benzi metalice (țigle) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`strip-${i}`} rotation={[-Math.PI / 6, 0, 0]} position={[-1.2 + i * 0.35, -0.15, 0]}>
          <boxGeometry args={[0.25, 0.02, 2.3]} />
          <meshStandardMaterial color="#a0b0c0" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* rânduri de panouri solare */}
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <mesh
            key={`panel-${row}-${col}`}
            rotation={[-Math.PI / 6, 0, 0]}
            position={[-1.0 + col * 0.6, -0.05, -0.8 + row * 0.8]}
          >
            <boxGeometry args={[0.45, 0.03, 0.55]} />
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
          rotation={[-Math.PI / 6, 0, 0]}
          position={[-1.2 + i * 0.6, -0.18, 0]}
        >
          <boxGeometry args={[0.04, 0.02, 2.2]} />
          <meshStandardMaterial color="#8a9baa" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default function RoofWithPanelsAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [2.5, 1.8, 3.5], fov: 50 }} gl={{ alpha: true }}>
        <RoofWithPanels />
      </Canvas>
    </div>
  );
}
