import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

function Shield() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.1;
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {/* scut exterior */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.02, 32]} />
        <meshStandardMaterial color="#f2c94c" metalness={0.8} roughness={0.2} transparent opacity={0.6} />
      </mesh>

      {/* scut interior */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
        <meshStandardMaterial color="#4a7db5" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
      </mesh>

      {/* numărul 10 */}
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        10
      </Text>

      {/* text garanție */}
      <Text
        position={[0, -0.4, 0.05]}
        fontSize={0.06}
        color="#f2c94c"
        anchorX="center"
        anchorY="middle"
      >
        ANI GARANȚIE
      </Text>
    </group>
  );
}

export default function WarrantyShieldAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [0, 0, 1.5], fov: 50 }} gl={{ alpha: true }}>
        <Shield />
      </Canvas>
    </div>
  );
}
