import React, { useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';

const STEPS = [
  { label: 'Formular', color: '#4a7db5', position: [-1.5, 0, 0] },
  { label: 'Evaluare', color: '#5a8cc5', position: [-0.5, 0, 0] },
  { label: 'Montaj', color: '#6a9cd5', position: [0.5, 0, 0] },
  { label: 'PIF', color: '#7aace5', position: [1.5, 0, 0] },
];

function JourneyPath() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ clock }) => {
    // rotație lentă
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 3]} intensity={1} color="#ffcc88" />

      {/* linia de legătură */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3.2, 0.02, 0.02]} />
        <meshStandardMaterial color="#4a7db5" transparent opacity={0.5} />
      </mesh>

      {STEPS.map((step, idx) => (
        <group key={idx}>
          <mesh position={[step.position[0], step.position[1], step.position[2]]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color={idx === activeStep ? '#f2c94c' : step.color}
              emissive={idx === activeStep ? '#f2c94c' : '#000000'}
              emissiveIntensity={idx === activeStep ? 0.5 : 0}
            />
          </mesh>
          <Text
            position={[step.position[0], step.position[1] - 0.3, step.position[2]]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {step.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function ClientJourneyAnimation() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
      <Canvas camera={{ position: [0, 0.5, 2.5], fov: 50 }} gl={{ alpha: true }}>
        <JourneyPath />
      </Canvas>
    </div>
  );
}
