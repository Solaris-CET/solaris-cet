import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';

function RoofSide({ type, position }: { type: 'click' | 'metalic'; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  const color = type === 'click' ? '#7a8c9e' : '#a0b0c0';
  const stripColor = type === 'click' ? '#8a9baa' : '#b0c0d0';

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 6, 0, 0]}>
        <boxGeometry args={[2, 0.05, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 6, 0, 0]} position={[-0.8 + i * 0.35, -0.12, 0]}>
          <boxGeometry args={[0.2, 0.02, 1.6]} />
          <meshStandardMaterial color={stripColor} metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

export default function RoofComparisonAnimation() {
  const [selected, setSelected] = useState<'click' | 'metalic'>('click');

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setSelected('click')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: selected === 'click' ? '2px solid #f2c94c' : '1px solid rgba(255,255,255,0.2)',
            background: selected === 'click' ? 'rgba(242,201,76,0.2)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Tablă click
        </button>
        <button
          onClick={() => setSelected('metalic')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: selected === 'metalic' ? '2px solid #f2c94c' : '1px solid rgba(255,255,255,0.2)',
            background: selected === 'metalic' ? 'rgba(242,201,76,0.2)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Țiglă metalică
        </button>
      </div>
      <Canvas camera={{ position: [2, 1.5, 3], fov: 50 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 3]} intensity={1} />
        <RoofSide type={selected} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
