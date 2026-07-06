import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

const LAYERS = [
  { name: 'Țiglă metalică', color: '#7a8c9e', height: 0.04, y: 0.2 },
  { name: 'Contra-zăpadă', color: '#5a6b7c', height: 0.02, y: 0.14 },
  { name: 'Folie anti-condens', color: '#4a5b6c', height: 0.01, y: 0.08 },
  { name: 'Izolație termică', color: '#8a9baa', height: 0.08, y: 0.0 },
  { name: 'Barieră vapori', color: '#3a4a5a', height: 0.01, y: -0.08 },
  { name: 'Structură lemn', color: '#6a5a3a', height: 0.06, y: -0.14 },
  { name: 'Placă OSB', color: '#5a4a2a', height: 0.03, y: -0.2 },
];

function CrossSection() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  useFrame(({ clock }) => {
    // rotație lentă
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {LAYERS.map((layer, idx) => (
        <mesh
          key={idx}
          position={[0, layer.y, 0]}
          onPointerOver={() => setHoveredLayer(idx)}
          onPointerOut={() => setHoveredLayer(null)}
        >
          <boxGeometry args={[2.5, layer.height, 1.5]} />
          <meshStandardMaterial
            color={hoveredLayer === idx ? '#f2c94c' : layer.color}
            metalness={0.6}
            roughness={0.4}
            transparent
            opacity={hoveredLayer === idx ? 1 : 0.85}
          />
        </mesh>
      ))}

      {hoveredLayer !== null && (
        <mesh position={[0, LAYERS[hoveredLayer].y + 0.3, 0]}>
          <boxGeometry args={[1.2, 0.02, 0.02]} />
          <meshStandardMaterial color="#f2c94c" />
        </mesh>
      )}
    </group>
  );
}

export default function RoofCrossSectionAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 250 }}>
      <Canvas camera={{ position: [2, 1, 3], fov: 50 }} gl={{ alpha: true }}>
        <CrossSection />
      </Canvas>
    </div>
  );
}
