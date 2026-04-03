/**
 * Chart series for `CompetitionCharts` — kept separate for tests and copy parity with the comparison matrix.
 * CET row must stay aligned with immutable supply / throughput messaging.
 */
export const COMPETITION_TPS_CHART_ROWS = [
  { name: 'CET', value: 100_000, isCET: true },
  { name: 'FET', value: 1_000, isCET: false },
  { name: 'TAO', value: 1_000, isCET: false },
  { name: 'ASI', value: 1_000, isCET: false },
  { name: 'AGIX', value: 15, isCET: false },
  { name: 'OCEAN', value: 15, isCET: false },
] as const;

export const COMPETITION_SCARCITY_CHART_ROWS = [
  { name: 'CET', value: 9_000, isCET: true },
  { name: 'TAO', value: 21_000_000, isCET: false },
  { name: 'ASI', value: 4_600_000_000, isCET: false },
  { name: 'FET', value: 1_150_000_000, isCET: false },
  { name: 'OCEAN', value: 1_410_000_000, isCET: false },
  { name: 'AGIX', value: 2_000_000_000, isCET: false },
] as const;
