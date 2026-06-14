import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Plane } from '@react-three/drei';
import * as THREE from 'three';

const PHASE_DURATION = 2; // seconds per phase
const TOTAL_PHASES = 3;

function InstallationScene() {
  const groupRef = useRef<THREE.Group>(null!);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % TOTAL_PHASES);
    }, PHASE_DURATION * 1000);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // rotație lentă continuă
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {/* solul */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#3a4a3a" />
      </mesh>

      {/* schelă (phase 0) */}
      {phase >= 0 && (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={`scaffold-vert-${i}`} position={[-0.9 + i * 0.6, 0.2, 0]}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
              <meshStandardMaterial color="#8a9baa" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <mesh key={`scaffold-horiz-${i}`} position={[0, 0.1 + i * 0.3, 0]}>
              <boxGeometry args={[1.2, 0.02, 0.02]} />
              <meshStandardMaterial color="#8a9baa" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}

      {/* schelet (phase 1) */}
      {phase >= 1 && (
        <>
          <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 6, 0, 0]}>
            <boxGeometry args={[1.6, 0.04, 1.2]} />
            <meshStandardMaterial color="#5a6b7c" metalness={0.6} roughness={0.4} />
          </mesh>
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={`beam-${i}`} position={[-0.6 + i * 0.4, 0.25, 0]} rotation={[-Math.PI / 6, 0, 0]}>
              <boxGeometry args={[0.04, 0.02, 1.0]} />
              <meshStandardMaterial color="#7a8c9e" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </>
      )}

      {/* panouri (phase 2) */}
      {phase >= 2 && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <mesh key={`panel-${i}`} position={[-0.5 + i * 0.5, 0.35, 0]} rotation={[-Math.PI / 6, 0, 0]}>
              <boxGeometry args={[0.35, 0.02, 0.8]} />
              <meshStandardMaterial color="#2c3e66" metalness={0.85} roughness={0.3} emissive="#112233" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

export default function InstallationTimelapse() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [2, 1.5, 3], fov: 50 }} gl={{ alpha: true }}>
        <InstallationScene />
      </Canvas>
    </div>
  );
}
