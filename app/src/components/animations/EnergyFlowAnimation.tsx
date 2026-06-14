import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 50;

function EnergyFlow() {
  const groupRef = useRef<THREE.Group>(null!);
  const particleRef = useRef<THREE.Points>(null!);

  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const offsets = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.2 + Math.random() * 0.5;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, offsets };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }

    if (particleRef.current) {
      const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const speed = particleData.speeds[i];
        const offset = particleData.offsets[i];
        const angle = time * speed + offset;
        const radius = 0.5 + Math.sin(time * 0.3 + offset) * 0.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(time * 0.5 + offset) * 0.5;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {/* casă */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#5a6b7c" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* panouri */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.5]} />
        <meshStandardMaterial color="#2c3e66" metalness={0.85} roughness={0.3} emissive="#112233" />
      </mesh>

      {/* invertor */}
      <Cylinder args={[0.08, 0.08, 0.15, 8]} position={[0.5, -0.2, 0]}>
        <meshStandardMaterial color="#4a7db5" metalness={0.8} roughness={0.3} />
      </Cylinder>

      {/* rețea */}
      <mesh position={[0.8, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#f2c94c" emissive="#f2c94c" emissiveIntensity={0.3} />
      </mesh>

      {/* baterie */}
      <mesh position={[-0.5, -0.2, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.1]} />
        <meshStandardMaterial color="#4a7db5" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* particule */}
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={particleData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#ffdd44"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function EnergyFlowAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 250 }}>
      <Canvas camera={{ position: [1.5, 0.5, 2], fov: 50 }} gl={{ alpha: true }}>
        <EnergyFlow />
      </Canvas>
    </div>
  );
}
