import { describe, expect, it } from 'vitest';

import { formatEur, formatMinutes, laborEurPerReport } from '@/lib/softCostRoi';

describe('softCostRoi', () => {
  it('computes labor € per report from minutes and hourly rate', () => {
    expect(laborEurPerReport(40, 35)).toBe(23.33);
  });

  it('formats EUR for Romanian locale', () => {
    const formatted = formatEur(23.33);
    expect(formatted).toMatch(/23/);
    expect(formatted).toMatch(/€|EUR/);
  });

  it('formats minutes', () => {
    expect(formatMinutes(80.4)).toBe('80 min');
  });
});