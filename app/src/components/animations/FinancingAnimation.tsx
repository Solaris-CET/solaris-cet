import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { createParticleField } from './particleField';

const COIN_COUNT = 20;
const LEAF_COUNT = 10;

const coinData = createParticleField(
  COIN_COUNT,
  (i, positions, speeds, offsets, jitter) => {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = Math.random() * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    speeds[i] = 0.3 + Math.random() * 0.5;
    offsets[i] = Math.random() * Math.PI * 2;
    if (jitter) {
      jitter.x[i] = positions[i * 3];
      jitter.z[i] = positions[i * 3 + 2];
    }
  },
  true,
);

const leafData = createParticleField(
  LEAF_COUNT,
  (i, positions, speeds, offsets, jitter) => {
    positions[i * 3] = (Math.random() - 0.5) * 2.5;
    positions[i * 3 + 1] = Math.random() * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    speeds[i] = 0.2 + Math.random() * 0.4;
    offsets[i] = Math.random() * Math.PI * 2;
    if (jitter) {
      jitter.x[i] = positions[i * 3];
      jitter.z[i] = positions[i * 3 + 2];
    }
  },
  true,
);

function FinancingScene() {
  const groupRef = useRef<THREE.Group>(null!);
  const coinRef = useRef<THREE.Points>(null!);
  const leafRef = useRef<THREE.Points>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
    }

    if (coinRef.current) {
      const positions = coinRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < COIN_COUNT; i++) {
        const speed = coinData.speeds[i];
        const offset = coinData.offsets[i];
        const y = ((time * speed + offset) % 2) - 0.5;
        positions[i * 3] = coinData.jitterX?.[i] ?? 0;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = coinData.jitterZ?.[i] ?? 0;
      }
      coinRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (leafRef.current) {
      const positions = leafRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < LEAF_COUNT; i++) {
        const speed = leafData.speeds[i];
        const offset = leafData.offsets[i];
        const y = ((time * speed + offset) % 2) - 0.5;
        positions[i * 3] = leafData.jitterX?.[i] ?? 0;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = leafData.jitterZ?.[i] ?? 0;
      }
      leafRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {/* monede */}
      <points ref={coinRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={COIN_COUNT}
            array={coinData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#f2c94c"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* frunze */}
      <points ref={leafRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={LEAF_COUNT}
            array={leafData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#4a9eff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* sumă */}
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.12}
        color="#f2c94c"
        anchorX="center"
        anchorY="middle"
      >
        20.000 RON
      </Text>
    </group>
  );
}

export default function FinancingAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 250 }}>
      <Canvas camera={{ position: [0, 0.5, 2], fov: 50 }} gl={{ alpha: true }}>
        <FinancingScene />
      </Canvas>
    </div>
  );
}
