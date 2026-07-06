export type StakingPlan = {
  id: number;
  label: string;
  durationSeconds: number;
  apyBps: number;
};

export const DEFAULT_STAKING_PLANS: StakingPlan[] = [
  { id: 1, label: '7 zile', durationSeconds: 7 * 24 * 60 * 60, apyBps: 1200 },
  { id: 2, label: '30 zile', durationSeconds: 30 * 24 * 60 * 60, apyBps: 2200 },
  { id: 3, label: '90 zile', durationSeconds: 90 * 24 * 60 * 60, apyBps: 3600 },
];

export function apyFromBps(apyBps: number): number {
  return apyBps / 100;
}

