import { describe, expect,it } from 'vitest';

import {
  COMPETITION_SCARCITY_CHART_ROWS,
  COMPETITION_TPS_CHART_ROWS,
} from '@/lib/competitionChartData';

describe('competitionChartData', () => {
  it('keeps CET as first bar in both series with canonical figures', () => {
    expect(COMPETITION_TPS_CHART_ROWS[0]).toEqual(
      expect.objectContaining({ name: 'CET', value: 100, isCET: true }),
    );
    expect(COMPETITION_SCARCITY_CHART_ROWS[0]).toEqual(
      expect.objectContaining({ name: 'CET', value: 9_000, isCET: true }),
    );
  });

  it('includes ASI in TPS chart for matrix parity', () => {
    const symbols = COMPETITION_TPS_CHART_ROWS.map((r) => r.name);
    expect(symbols).toContain('ASI');
  });
});
