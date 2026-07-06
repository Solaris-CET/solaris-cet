import { describe, expect,it } from 'vitest';

import { BRIDGE_SIM_LIMITS, CET_SCALE, computeFeeMicro, microToCET, parseCETToMicro } from '@/lib/bridgeMath';

describe('bridgeMath', () => {
  it('parses CET decimal strings into micro units (6 decimals)', () => {
    expect(parseCETToMicro('0')).toBe(0n);
    expect(parseCETToMicro('1')).toBe(1n * CET_SCALE);
    expect(parseCETToMicro('1.2')).toBe(1n * CET_SCALE + 200_000n);
    expect(parseCETToMicro('1.234567')).toBe(1n * CET_SCALE + 234_567n);
    expect(parseCETToMicro('1.23456789')).toBe(1n * CET_SCALE + 234_567n);
    expect(parseCETToMicro(' 12.000001 ')).toBe(12n * CET_SCALE + 1n);
    expect(parseCETToMicro('')).toBeNull();
    expect(parseCETToMicro('1.')).toBeNull();
    expect(parseCETToMicro('.1')).toBeNull();
    expect(parseCETToMicro('abc')).toBeNull();
  });

  it('computes fee as max(baseFee, bps)', () => {
    const baseFeeMicro = BigInt(Math.round(BRIDGE_SIM_LIMITS.baseFeeCET * Number(CET_SCALE)));
    expect(computeFeeMicro(10n * CET_SCALE)).toBe(baseFeeMicro);
    expect(computeFeeMicro(100n * CET_SCALE)).toBe(200_000n);
  });

  it('microToCET produces stable display values for simulator range', () => {
    expect(microToCET(0n)).toBe(0);
    expect(microToCET(1n * CET_SCALE)).toBe(1);
    expect(microToCET(123_456n)).toBeCloseTo(0.123456, 6);
  });
});

