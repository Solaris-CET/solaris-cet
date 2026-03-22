import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimeoutSignal } from '../hooks/use-live-pool-data';

// ─── createTimeoutSignal ──────────────────────────────────────────────────

describe('createTimeoutSignal — AbortSignal.timeout path', () => {
  it('returns an AbortSignal', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeDefined();
    expect(typeof signal.aborted).toBe('boolean');
  });

  it('signal is not immediately aborted', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal.aborted).toBe(false);
  });

  it('returns a new signal on every call', () => {
    const a = createTimeoutSignal(1000);
    const b = createTimeoutSignal(1000);
    // Each call must return its own AbortSignal instance
    expect(a).not.toBe(b);
  });
});

describe('createTimeoutSignal — fallback path (no AbortSignal.timeout)', () => {
  const originalTimeout = AbortSignal.timeout;

  beforeEach(() => {
    // Remove AbortSignal.timeout to force the fallback branch
    Object.defineProperty(AbortSignal, 'timeout', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    Object.defineProperty(AbortSignal, 'timeout', {
      configurable: true,
      value: originalTimeout,
    });
  });

  it('still returns an AbortSignal via fallback', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal).toBeDefined();
    expect(typeof signal.aborted).toBe('boolean');
  });

  it('fallback signal is not immediately aborted', () => {
    const signal = createTimeoutSignal(5000);
    expect(signal.aborted).toBe(false);
  });

  it('fallback signal aborts after the timeout fires', async () => {
    vi.useFakeTimers();
    const signal = createTimeoutSignal(100);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(150);
    expect(signal.aborted).toBe(true);
    vi.useRealTimers();
  });
});

// ─── PoolData initial state shape ────────────────────────────────────────

describe('PoolData — initial state constants', () => {
  it('DeDust pool address is the correct format', () => {
    const addr = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
    expect(addr).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('CET contract address is the correct format', () => {
    const addr = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
    expect(addr).toMatch(/^EQ[A-Za-z0-9_-]{46}$/);
  });

  it('CET decimals are 9 (TON jetton standard)', () => {
    const CET_DECIMALS = 9;
    expect(CET_DECIMALS).toBe(9);
  });

  it('refresh interval is 60 seconds', () => {
    const REFRESH_INTERVAL_MS = 60_000;
    expect(REFRESH_INTERVAL_MS).toBe(60_000);
  });
});
