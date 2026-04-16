import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01, mulberry32 } from '@/lib/seed';

type Quality = 'low' | 'high';

const vertexShader = `
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDirW;
varying vec2 vUv;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec3 camPos = cameraPosition;
  vViewDirW = normalize(camPos - vWorldPos);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec2 uPointer;
uniform float uOpacity;
uniform float uScanDensity;
uniform float uScanSpeed;
uniform float uNoiseAmount;
uniform float uFresnelPow;
uniform float uGlitch;
uniform float uPulse;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec3 vViewDirW;
varying vec2 vUv;
varying vec3 vLocalPos;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vViewDirW)), 0.0, 1.0), uFresnelPow);

  float scanPos = (vWorldPos.y + uTime * uScanSpeed) * uScanDensity;
  float scan = 0.5 + 0.5 * sin(scanPos);
  scan = pow(scan, 3.0);

  vec2 p = vUv * 12.0 + vec2(uTime * 0.08, -uTime * 0.05);
  float n = noise(p);

  float glitch = uGlitch * (0.35 + 0.65 * sin(uTime * 1.7));
  vec2 uvG = vUv + vec2((n - 0.5) * 0.02 * glitch, 0.0);
  float stripe = smoothstep(0.48, 0.52, fract((uvG.y + uTime * 0.12) * 18.0));

  float pointerPulse = 0.18 * (1.0 - smoothstep(0.0, 0.9, length(uPointer)));
  float pulse = 0.12 * sin(uTime * 1.4 + vLocalPos.y * 2.2) + 0.12 * uPulse;
  float aura = fresnel + scan * 0.85 + pointerPulse + pulse;

  vec3 base = mix(uColorA, uColorB, clamp(0.15 + 0.85 * (0.5 + 0.5 * sin(vWorldPos.y * 0.8 + uTime * 0.6)), 0.0, 1.0));
  base += uNoiseAmount * (n - 0.5) * vec3(0.8, 1.0, 1.2);
  base += stripe * 0.06 * vec3(0.2, 0.9, 1.0);

  float alpha = uOpacity * clamp(aura, 0.0, 1.4);
  alpha *= 0.88 + 0.12 * scan;

  gl_FragColor = vec4(base * clamp(0.35 + aura, 0.0, 2.0), alpha);
}
`;

function makeMaterial(quality: Quality, seed: number) {
  const rand = mulberry32(Math.floor(seed * 4294967295) >>> 0);
  const hueShift = (rand() - 0.5) * (quality === 'high' ? 0.08 : 0.05);
  const satA = clamp01(0.62 + (rand() - 0.5) * 0.18);
  const satB = clamp01(0.68 + (rand() - 0.5) * 0.18);
  const lumA = clamp01(0.72 + (rand() - 0.5) * 0.12);
  const lumB = clamp01(0.6 + (rand() - 0.5) * 0.12);
  const colorA = new THREE.Color().setHSL(0.52 + hueShift, satA, lumA);
  const colorB = new THREE.Color().setHSL(0.12 + hueShift * 0.6, satB, lumB);
  const uniforms = {
    uTime: { value: 0 },
    uColorA: { value: colorA },
    uColorB: { value: colorB },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uOpacity: { value: quality === 'high' ? 0.85 : 0.72 },
    uScanDensity: { value: (quality === 'high' ? 110 : 80) * (0.92 + rand() * 0.18) },
    uScanSpeed: { value: (quality === 'high' ? 0.9 : 0.7) * (0.92 + rand() * 0.18) },
    uNoiseAmount: { value: (quality === 'high' ? 0.22 : 0.16) * (0.9 + rand() * 0.22) },
    uFresnelPow: { value: (quality === 'high' ? 3.2 : 2.6) * (0.9 + rand() * 0.22) },
    uGlitch: { value: (quality === 'high' ? 0.65 : 0.3) * (0.85 + rand() * 0.3) },
    uPulse: { value: 0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function HologramToken({
  quality,
  seed,
}: {
  quality: Quality;
  seed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mat = useMemo(() => makeMaterial(quality, seed), [quality, seed]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (g) {
      g.rotation.y += delta * (quality === 'high' ? 0.36 : 0.28);
      g.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * (quality === 'high' ? 0.12 : 0.09);
    }
    (mat.uniforms.uTime.value as number) = state.clock.elapsedTime;
    (mat.uniforms.uPointer.value as THREE.Vector2).set(state.pointer.x, state.pointer.y);
    (mat.uniforms.uPulse.value as number) =
      (0.55 + 0.45 * Math.sin(state.clock.elapsedTime * 0.9)) *
      (quality === 'high' ? 1 : 0.7);
  });

  return (
    <group ref={groupRef}>
      <mesh material={mat}>
        <torusKnotGeometry args={[0.8, 0.26, quality === 'high' ? 260 : 180, quality === 'high' ? 18 : 14]} />
      </mesh>
    </group>
  );
}

export function EntanglementLines({
  quality,
  seed,
}: {
  quality: Quality;
  seed: number;
}) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const { geometry, material } = useMemo(() => {
    const seedRng = mulberry32(Math.floor(seed * 4294967295) >>> 0);
    const countBase = quality === 'high' ? 240 : 120;
    const pointsBase = quality === 'high' ? 140 : 90;
    const count = Math.max(60, Math.floor(countBase * (0.85 + seedRng() * 0.35)));
    const points = Math.max(40, Math.floor(pointsBase * (0.85 + seedRng() * 0.35)));
    let seed2 = ((count + points) * 2654435761) ^ 0x1b873593;
    const rand2 = () => {
      seed2 |= 0;
      seed2 = (seed2 + 0x6d2b79f5) | 0;
      let t = Math.imul(seed2 ^ (seed2 >>> 15), 1 | seed2);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const cloud: THREE.Vector3[] = [];
    for (let i = 0; i < points; i += 1) {
      const r = 1.15 + rand2() * 2.0;
      const theta = rand2() * Math.PI * 2;
      const phi = Math.acos(2 * rand2() - 1);
      cloud.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ),
      );
    }
    const positions = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i += 1) {
      const a = cloud[Math.floor(rand2() * cloud.length)];
      const b = cloud[Math.floor(rand2() * cloud.length)];
      positions[i * 6 + 0] = a.x;
      positions[i * 6 + 1] = a.y;
      positions[i * 6 + 2] = a.z;
      positions[i * 6 + 3] = b.x;
      positions[i * 6 + 4] = b.y;
      positions[i * 6 + 5] = b.z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const hue = 0.52 + (seedRng() - 0.5) * 0.08;
    const col = new THREE.Color().setHSL(hue, 0.75, 0.7);
    const m = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: quality === 'high' ? 0.18 : 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geometry: g, material: m };
  }, [quality, seed]);

  useFrame((state) => {
    const l = linesRef.current;
    if (!l) return;
    const t = state.clock.elapsedTime;
    l.rotation.y = t * 0.04 + state.pointer.x * 0.12;
    l.rotation.x = Math.sin(t * 0.16) * 0.06 + state.pointer.y * 0.08;
    const m = l.material as THREE.LineBasicMaterial;
    m.opacity = (quality === 'high' ? 0.18 : 0.12) * (0.75 + 0.25 * Math.sin(t * 1.6));
  });

  return <lineSegments ref={linesRef} geometry={geometry} material={material} />;
}

export default memo(HologramToken);
