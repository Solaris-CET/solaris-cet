import { memo, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function TokenMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const color = useMemo(() => new THREE.Color('#F2C94C'), []);
  const emissive = useMemo(() => new THREE.Color('#7CF7FF'), []);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.35;
    g.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.35}>
      <group ref={groupRef}>
        <mesh>
          <torusKnotGeometry args={[0.8, 0.26, 220, 18]} />
          <meshPhysicalMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.35}
            roughness={0.22}
            metalness={0.65}
            transparent
            opacity={0.92}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
        <mesh scale={1.01}>
          <torusKnotGeometry args={[0.8, 0.26, 140, 12]} />
          <meshBasicMaterial color="#9BE9FF" transparent opacity={0.12} wireframe />
        </mesh>
      </group>
    </Float>
  );
}

function HeroTokenHologram() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[6] hidden lg:block"
      style={{
        maskImage:
          'radial-gradient(ellipse 55% 55% at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0) 72%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 55% 55% at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 35%, rgba(0,0,0,0) 72%)',
      }}
    >
      <Canvas
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 4.2], fov: 44 }}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 2, 4]} intensity={1.25} color="#FFE3A1" />
        <directionalLight position={[-3, -2, 2]} intensity={0.55} color="#55F0FF" />
        <fog attach="fog" args={['#020512', 2.8, 9]} />
        <TokenMesh />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

export default memo(HeroTokenHologram);

