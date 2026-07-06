import { describe, expect,it } from 'vitest';

import type { AnalyticsInput, AnalyticsOutput, MemoryStats } from '../workers/aiWorker';

describe('aiWorker — AnalyticsInput / AnalyticsOutput / MemoryStats', () => {
  it('shapes, optional label, CET feature layout, softmax, backends, heap', () => {
    const bare: AnalyticsInput = { features: [0.5, 1.2, 3.4, 0.8, 2.1] };
    expect(bare.features).toHaveLength(5);
    expect(bare.label).toBeUndefined();

    const labeled: AnalyticsInput = { features: [1, 2, 3], label: 'test-batch-1' };
    expect(labeled.label).toBe('test-batch-1');

    const emptyFeatures: AnalyticsInput = { features: [] };
    expect(emptyFeatures.features).toHaveLength(0);

    const cet: AnalyticsInput = {
      features: [0.042, 12_000, 85_000, 0.15, 0.0001],
      label: 'cet-snapshot',
    };
    expect(cet.features[0]).toBeCloseTo(0.042, 3);
    expect(cet.features[1]).toBe(12_000);

    const out: AnalyticsOutput = {
      scores: [0.92, 0.07, 0.01],
      latencyMs: 14,
      backend: 'wasm',
    };
    expect(out.scores.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 1);

    const zeroLat: AnalyticsOutput = { scores: [], latencyMs: 0, backend: 'js-fallback' };
    expect(zeroLat.latencyMs).toBeGreaterThanOrEqual(0);

    const echoed: AnalyticsOutput = {
      scores: [0.9],
      latencyMs: 5,
      label: 'cet-snapshot',
      backend: 'webgpu',
    };
    expect(echoed.label).toBe('cet-snapshot');

    const validBackends = ['webgpu', 'wasm', 'js-fallback'] as const;
    expect(validBackends).toContain(out.backend);

    const mem: MemoryStats = { jsHeapUsedBytes: 48_000_000, timestamp: Date.now() };
    expect(mem.jsHeapUsedBytes).toBeGreaterThan(0);

    const memNull: MemoryStats = { jsHeapUsedBytes: null, timestamp: Date.now() };
    expect(memNull.jsHeapUsedBytes).toBeNull();

    const before = Date.now();
    const ts: MemoryStats = { jsHeapUsedBytes: null, timestamp: Date.now() };
    expect(ts.timestamp).toBeGreaterThanOrEqual(before);
    expect(ts.timestamp).toBeLessThanOrEqual(Date.now() + 10);
  });
});
