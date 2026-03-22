import { describe, it, expect } from 'vitest';
import type { AnalyticsInput, AnalyticsOutput, MemoryStats } from '../workers/aiWorker';

// ─── AnalyticsInput ────────────────────────────────────────────────────────

describe('AnalyticsInput type', () => {
  it('accepts a basic features array without label', () => {
    const input: AnalyticsInput = {
      features: [0.5, 1.2, 3.4, 0.8, 2.1],
    };
    expect(input.features).toHaveLength(5);
    expect(input.label).toBeUndefined();
  });

  it('accepts features with optional label', () => {
    const input: AnalyticsInput = {
      features: [1, 2, 3],
      label: 'test-batch-1',
    };
    expect(input.label).toBe('test-batch-1');
  });

  it('features array can be empty (edge case)', () => {
    const input: AnalyticsInput = { features: [] };
    expect(input.features).toHaveLength(0);
  });

  it('CET analytics features layout: [price, vol24h, liquidity, priceChange7d, mcRatio]', () => {
    const input: AnalyticsInput = {
      features: [0.042, 12_000, 85_000, 0.15, 0.0001],
      label: 'cet-snapshot',
    };
    expect(input.features[0]).toBeCloseTo(0.042, 3); // price
    expect(input.features[1]).toBe(12_000);            // volume24h
  });
});

// ─── AnalyticsOutput ──────────────────────────────────────────────────────

describe('AnalyticsOutput type', () => {
  it('accepts a valid output object', () => {
    const output: AnalyticsOutput = {
      scores: [0.92, 0.07, 0.01],
      latencyMs: 14,
      backend: 'wasm',
    };
    expect(output.scores).toHaveLength(3);
    expect(output.latencyMs).toBeGreaterThan(0);
  });

  it('scores sum to approximately 1 for softmax outputs', () => {
    const scores = [0.92, 0.07, 0.01];
    const sum = scores.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('latencyMs is non-negative', () => {
    const output: AnalyticsOutput = { scores: [], latencyMs: 0, backend: 'js-fallback' };
    expect(output.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('echoes the input label', () => {
    const output: AnalyticsOutput = {
      scores: [0.9],
      latencyMs: 5,
      label: 'cet-snapshot',
      backend: 'webgpu',
    };
    expect(output.label).toBe('cet-snapshot');
  });

  it('backend is one of the three recognised values', () => {
    const validBackends = ['webgpu', 'wasm', 'js-fallback'];
    const output: AnalyticsOutput = {
      scores: [0.8],
      latencyMs: 3,
      backend: 'wasm',
    };
    expect(validBackends).toContain(output.backend);
  });
});

// ─── MemoryStats ──────────────────────────────────────────────────────────

describe('MemoryStats type', () => {
  it('accepts a full memory snapshot', () => {
    const stats: MemoryStats = {
      jsHeapUsedBytes: 48_000_000,
      timestamp: Date.now(),
    };
    expect(stats.jsHeapUsedBytes).toBeGreaterThan(0);
    expect(stats.timestamp).toBeGreaterThan(0);
  });

  it('accepts null jsHeapUsedBytes (non-Chromium browsers)', () => {
    const stats: MemoryStats = {
      jsHeapUsedBytes: null,
      timestamp: Date.now(),
    };
    expect(stats.jsHeapUsedBytes).toBeNull();
  });

  it('timestamp is a valid Unix epoch milliseconds', () => {
    const before = Date.now();
    const stats: MemoryStats = {
      jsHeapUsedBytes: null,
      timestamp: Date.now(),
    };
    expect(stats.timestamp).toBeGreaterThanOrEqual(before);
    expect(stats.timestamp).toBeLessThanOrEqual(Date.now() + 10);
  });
});
