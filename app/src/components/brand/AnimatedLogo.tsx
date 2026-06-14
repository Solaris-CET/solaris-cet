import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const RAY_COUNT = 16;
const RAY_LENGTH = 1.4;
const RAY_WIDTH = 0.025;

function SunRays() {
  const groupRef = useRef<THREE.Group>(null!);

  const positions = useMemo(() => {
    const pos: number[] = [];
    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * RAY_LENGTH;
      const y = Math.sin(angle) * RAY_LENGTH;
      pos.push(0, 0, 0);
      pos.push(x, y, 0);
    }
    return new Float32Array(pos);
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.6;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#ffaa33" linewidth={RAY_WIDTH} transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}

function LogoText() {
  return (
    <Text
      position={[0, 0, 0.15]}
      fontSize={0.42}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
      font="/fonts/Inter-Bold.woff"
      letterSpacing={0.05}
    >
      Solaris CET
    </Text>
  );
}

export default function AnimatedLogo() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 120,
        minWidth: 40,
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[8, 8, 8]} />
        <SunRays />
        <LogoText />
      </Canvas>
    </div>
  );
}
