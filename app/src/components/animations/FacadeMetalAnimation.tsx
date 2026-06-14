import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function MetalFacade() {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // rotație lentă pentru efect vizual
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.06;
    }
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      // raze de soare alunecând pe fațadă
      lightRef.current.position.x = Math.sin(t) * 6;
      lightRef.current.position.z = Math.cos(t) * 6;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight ref={lightRef} intensity={1.5} color="#ffcc88" position={[5, 10, 3]} />

      {/* peretele principal al fațadei */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial color="#5a6b7c" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* placări metalice verticale */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`vertical-${i}`} position={[-1.35 + i * 0.3, 0.5, 0.06]}>
          <boxGeometry args={[0.15, 1.8, 0.02]} />
          <meshStandardMaterial color="#8a9baa" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* placări metalice orizontale */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`horizontal-${i}`} position={[0, -0.4 + i * 0.4, 0.06]}>
          <boxGeometry args={[2.8, 0.04, 0.02]} />
          <meshStandardMaterial color="#a0b0c0" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* detalii structură metalică (colțuri) */}
      <mesh position={[-1.5, 0.5, 0]}>
        <boxGeometry args={[0.04, 2, 0.1]} />
        <meshStandardMaterial color="#7a8c9e" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.5, 0.5, 0]}>
        <boxGeometry args={[0.04, 2, 0.1]} />
        <meshStandardMaterial color="#7a8c9e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* bază (sol) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#3a4a3a" />
      </mesh>
    </group>
  );
}

export default function FacadeMetalAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [2.5, 1.5, 3.5], fov: 50 }} gl={{ alpha: true }}>
        <MetalFacade />
      </Canvas>
    </div>
  );
}
