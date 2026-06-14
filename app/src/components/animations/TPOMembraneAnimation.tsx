import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const WATER_PARTICLE_COUNT = 40;

function TPOMembrane() {
  const groupRef = useRef<THREE.Group>(null!);
  const waterRef = useRef<THREE.Points>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  // Inițializare particule de apă
  const waterData = useMemo(() => {
    const positions = new Float32Array(WATER_PARTICLE_COUNT * 3);
    const speeds = new Float32Array(WATER_PARTICLE_COUNT);
    const offsets = new Float32Array(WATER_PARTICLE_COUNT);
    for (let i = 0; i < WATER_PARTICLE_COUNT; i++) {
      // Poziție inițială de-a lungul burlanului (axa Y)
      const y = Math.random() * 2.5 - 0.5; // -0.5 .. 2.0
      const x = 1.2 + (Math.random() - 0.5) * 0.3;
      const z = (Math.random() - 0.5) * 0.3;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      speeds[i] = 0.5 + Math.random() * 0.8;
      offsets[i] = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, offsets };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // rotație lentă
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.06;
    }
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t) * 4;
      lightRef.current.position.z = Math.cos(t) * 4;
    }

    // Actualizare particule de apă
    if (waterRef.current) {
      const positions = waterRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      for (let i = 0; i < WATER_PARTICLE_COUNT; i++) {
        const speed = waterData.speeds[i];
        const offset = waterData.offsets[i];
        // Mișcare descendentă (Y) cu viteză variabilă
        const y = ((time * speed + offset) % 2.5) - 0.5; // -0.5 .. 2.0
        const x = 1.2 + (Math.random() - 0.5) * 0.3;
        const z = (Math.random() - 0.5) * 0.3;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      waterRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight ref={lightRef} intensity={1.2} color="#ffcc88" position={[5, 10, 3]} />

      {/* suprafața TPO */}
      <mesh rotation={[-Math.PI / 8, 0, 0]} position={[0, -0.3, 0]}>
        <boxGeometry args={[4, 0.04, 3]} />
        <meshStandardMaterial color="#5a6b7c" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* burlane (țevi de scurgere) */}
      <Cylinder args={[0.08, 0.08, 2.5, 8]} position={[1.2, 0.8, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#7a8c9e" metalness={0.8} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 2.5, 8]} position={[-1.2, 0.8, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#7a8c9e" metalness={0.8} roughness={0.3} />
      </Cylinder>

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

      {/* Particule de apă */}
      <points ref={waterRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={WATER_PARTICLE_COUNT}
            array={waterData.positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#4a9eff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function TPOMembraneAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [3, 2, 4], fov: 50 }} gl={{ alpha: true }}>
        <TPOMembrane />
      </Canvas>
    </div>
  );
}
