import crypto from 'node:crypto';

export const WHEEL_SPIN_PATH = '/api/gamification/wheel/spin';
export const WHEEL_SPIN_METHODS = 'POST, OPTIONS';

export const WHEEL_SPIN_REWARD_BUCKETS = [
  { reward: 0, weight: 10 },
  { reward: 1, weight: 30 },
  { reward: 2, weight: 25 },
  { reward: 3, weight: 18 },
  { reward: 5, weight: 12 },
  { reward: 10, weight: 5 },
] as const;

export const WHEEL_SPIN_PROBE = {
  path: WHEEL_SPIN_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  wheelReason: 'wheel' as const,
  rewardBuckets: WHEEL_SPIN_REWARD_BUCKETS,
};

export function isWheelSpinUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23505';
}

export function rollWheelReward(randomInt: (min: number, max: number) => number = crypto.randomInt.bind(crypto)): number {
  const buckets = WHEEL_SPIN_REWARD_BUCKETS;
  const total = buckets.reduce((acc, b) => acc + b.weight, 0);
  const r = randomInt(0, total);
  let cur = 0;
  for (const b of buckets) {
    cur += b.weight;
    if (r < cur) return b.reward;
  }
  return 0;
}