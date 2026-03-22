// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useAgentBoard, defaultGenerateEvent } from '../hooks/useAgentBoard';

describe('useAgentBoard', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initialises with maxEvents events', async () => {
    const { resultRef, unmount } = await renderHook(() =>
      useAgentBoard({ maxEvents: 5, intervalMs: 10_000 })
    );
    expect(resultRef.current).toHaveLength(5);
    await unmount();
  });

  it('defaults to 7 events when maxEvents not provided', async () => {
    vi.useFakeTimers();
    const { resultRef, unmount } = await renderHook(() =>
      useAgentBoard({ intervalMs: 10_000 })
    );
    expect(resultRef.current).toHaveLength(7);
    await unmount();
  });

  it('each event has required fields', async () => {
    const { resultRef, unmount } = await renderHook(() =>
      useAgentBoard({ maxEvents: 3, intervalMs: 10_000 })
    );
    for (const ev of resultRef.current) {
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('kind');
      expect(ev).toHaveProperty('dept');
      expect(ev).toHaveProperty('agentId');
      expect(ev).toHaveProperty('message');
      expect(ev).toHaveProperty('ts');
      expect(typeof ev.id).toBe('string');
      expect(typeof ev.ts).toBe('number');
      expect(['solved', 'learned', 'talking', 'alert']).toContain(ev.kind);
    }
    await unmount();
  });

  it('prepends a new event when interval fires', async () => {
    vi.useFakeTimers();
    const { resultRef, rerender, unmount } = await renderHook(() =>
      useAgentBoard({ maxEvents: 5, intervalMs: 500 })
    );
    const firstId = resultRef.current[0].id;
    await act(() => { vi.advanceTimersByTime(600); });
    await rerender();
    expect(resultRef.current[0].id).not.toBe(firstId);
    await unmount();
  });

  it('never exceeds maxEvents entries', async () => {
    vi.useFakeTimers();
    const { resultRef, rerender, unmount } = await renderHook(() =>
      useAgentBoard({ maxEvents: 3, intervalMs: 100 })
    );
    await act(() => { vi.advanceTimersByTime(1_500); });
    await rerender();
    expect(resultRef.current.length).toBeLessThanOrEqual(3);
    await unmount();
  });

  it('uses custom generateEvent when provided', async () => {
    const customEvent = {
      id: 'test-42',
      kind: 'solved' as const,
      dept: 'Engineering',
      agentId: 'ENG-00001',
      message: 'Custom test event',
      ts: Date.now(),
    };
    const generator = vi.fn().mockReturnValue(customEvent);
    const { resultRef, unmount } = await renderHook(() =>
      useAgentBoard({ maxEvents: 2, intervalMs: 10_000, generateEvent: generator })
    );
    expect(generator).toHaveBeenCalled();
    expect(resultRef.current.every(e => e.id === 'test-42')).toBe(true);
    await unmount();
  });
});

describe('defaultGenerateEvent', () => {
  it('returns a valid AgentEvent', () => {
    const ev = defaultGenerateEvent();
    expect(ev.id).toBeTruthy();
    expect(['solved', 'learned', 'talking', 'alert']).toContain(ev.kind);
    expect(ev.dept).toBeTruthy();
    expect(ev.agentId).toMatch(/^[A-Z&]+-\d{5}$/);
    expect(ev.message.length).toBeGreaterThan(5);
    expect(ev.ts).toBeGreaterThan(0);
  });

  it('learned events include a collab agent reference in the message', () => {
    // Run many iterations to get at least one 'learned' event
    const events = Array.from({ length: 100 }, defaultGenerateEvent);
    const learned = events.filter(e => e.kind === 'learned');
    expect(learned.length).toBeGreaterThan(0);
    learned.forEach(e => {
      // collab ID should be embedded in message (after replace)
      expect(e.message).not.toContain('$COLLAB');
    });
  });

  it('generates unique ids on every call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => defaultGenerateEvent().id));
    expect(ids.size).toBe(20);
  });
});
