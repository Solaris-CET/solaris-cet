import { CET_FIXED_SUPPLY_CAP } from '@/lib/domainPillars';

/**
 * Chart series for `CompetitionCharts` — kept separate for tests and copy parity with the comparison matrix.
 * CET row must stay aligned with immutable supply messaging.
 */
export const COMPETITION_TPS_CHART_ROWS = [
  { name: 'CET', value: 100, isCET: true },
  { name: 'FET', value: 40, isCET: false },
  { name: 'TAO', value: 40, isCET: false },
  { name: 'ASI', value: 35, isCET: false },
  { name: 'AGIX', value: 25, isCET: false },
  { name: 'OCEAN', value: 25, isCET: false },
] as const;

export const COMPETITION_SCARCITY_CHART_ROWS = [
  { name: 'CET', value: CET_FIXED_SUPPLY_CAP, isCET: true },
  { name: 'TAO', value: 21_000_000, isCET: false },
  { name: 'ASI', value: 4_600_000_000, isCET: false },
  { name: 'FET', value: 1_150_000_000, isCET: false },
  { name: 'OCEAN', value: 1_410_000_000, isCET: false },
  { name: 'AGIX', value: 2_000_000_000, isCET: false },
] as const;
