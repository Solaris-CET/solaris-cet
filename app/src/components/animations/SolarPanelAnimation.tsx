import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';

function SolarPanel3D() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // ușoară rotație lentă
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
    if (lightRef.current) {
      // lumina care se mișcă simulează soarele
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t) * 3;
      lightRef.current.position.z = Math.cos(t) * 3;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} intensity={1.2} color="#ffcc88" />
      <ambientLight intensity={0.5} />
      <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[2, 0.05, 1.5]} />
        <meshStandardMaterial color="#2c3e66" metalness={0.85} roughness={0.3} emissive="#112233" />
      </mesh>
      {/* grila de celule */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.24, 0.03, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.18, 0.01, 1.2]} />
          <meshStandardMaterial color="#4a7db5" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export default function SolarPanelAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }} gl={{ alpha: true }}>
        <SolarPanel3D />
      </Canvas>
    </div>
  );
}
