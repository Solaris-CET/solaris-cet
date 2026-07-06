import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 30;

function SolarPanel3D() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const particleRef = useRef<THREE.Points>(null!);

  // Inițializare particule
  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const offsets = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Poziție inițială pe suprafața panoului (în planul rotit)
      const x = (Math.random() - 0.5) * 1.8;
      const z = (Math.random() - 0.5) * 1.3;
      // Aplicăm aceeași rotație ca panoul
      const angle = -Math.PI / 4;
      const y = Math.sin(angle) * z;
      const zRot = Math.cos(angle) * z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y + 0.03;
      positions[i * 3 + 2] = zRot;
      speeds[i] = 0.3 + Math.random() * 0.5;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, offsets };
  }, []);

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

    // Actualizare particule
    if (particleRef.current) {
      const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Mișcare de-a lungul axei X cu viteză variabilă
        const speed = particleData.speeds[i];
        const offset = particleData.offsets[i];
        const x = ((time * speed + offset) % 2) - 1; // -1 .. 1
        const z = (Math.random() - 0.5) * 1.3;
        const angle = -Math.PI / 4;
        const y = Math.sin(angle) * z;
        const zRot = Math.cos(angle) * z;
        positions[i * 3] = x * 0.9;
        positions[i * 3 + 1] = y + 0.03;
        positions[i * 3 + 2] = zRot;
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
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
      {/* Particule luminoase */}
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
          size={0.06}
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

export default function SolarPanelAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }} gl={{ alpha: true }}>
        <SolarPanel3D />
      </Canvas>
    </div>
  );
}
