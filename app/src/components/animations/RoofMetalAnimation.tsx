import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function MetalRoof() {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* suprafața principală a acoperișului */}
      <mesh rotation={[-Math.PI / 6, 0, 0]} position={[0, -0.2, 0]}>
        <boxGeometry args={[3, 0.05, 2.5]} />
        <meshStandardMaterial color="#7a8c9e" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* benzi metalice (țigle) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 6, 0, 0]} position={[-1.2 + i * 0.35, -0.15, 0]}>
          <boxGeometry args={[0.25, 0.02, 2.3]} />
          <meshStandardMaterial color="#a0b0c0" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

export default function RoofMetalAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [2, 1.5, 3], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 3]} intensity={1} />
        <MetalRoof />
      </Canvas>
    </div>
  );
}
