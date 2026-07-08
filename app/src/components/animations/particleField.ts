/** One-time particle field init (module scope — safe for impure RNG). */

export type ParticleField = {
  positions: Float32Array;
  speeds: Float32Array;
  offsets: Float32Array;
  /** Optional per-particle x/z jitter for animation loops */
  jitterX?: Float32Array;
  jitterZ?: Float32Array;
};

export function createParticleField(
  count: number,
  init: (
    i: number,
    positions: Float32Array,
    speeds: Float32Array,
    offsets: Float32Array,
    jitter?: { x: Float32Array; z: Float32Array },
  ) => void,
  withJitter = false,
): ParticleField {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const offsets = new Float32Array(count);
  const jitter = withJitter
    ? { x: new Float32Array(count), z: new Float32Array(count) }
    : undefined;
  for (let i = 0; i < count; i++) {
    init(i, positions, speeds, offsets, jitter);
  }
  return {
    positions,
    speeds,
    offsets,
    jitterX: jitter?.x,
    jitterZ: jitter?.z,
  };
}