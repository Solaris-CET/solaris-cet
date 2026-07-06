// @vitest-environment jsdom
import { afterEach,describe, expect, it, vi } from 'vitest';

import { defaultGenerateEvent,useAgentBoard } from '../hooks/useAgentBoard';
import { act,renderHook } from './renderHook';

describe('useAgentBoard + defaultGenerateEvent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hook: length, fields, timers, cap, custom gen; generator: shape, learned, ids, skill', async () => {
    const { resultRef: r5, unmount: u5 } = await renderHook(() =>
      useAgentBoard({ maxEvents: 5, intervalMs: 10_000 }),
    );
    expect(r5.current).toHaveLength(5);
    await u5();

    vi.useFakeTimers();
    const { resultRef: r7, unmount: u7 } = await renderHook(() =>
      useAgentBoard({ intervalMs: 10_000 }),
    );
    expect(r7.current).toHaveLength(7);
    await u7();
    vi.useRealTimers();

    const { resultRef: r3, unmount: u3 } = await renderHook(() =>
      useAgentBoard({ maxEvents: 3, intervalMs: 10_000 }),
    );
    for (const ev of r3.current) {
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('kind');
      expect(ev).toHaveProperty('dept');
      expect(ev).toHaveProperty('agentId');
      expect(ev).toHaveProperty('message');
      expect(ev).toHaveProperty('ts');
      expect(typeof ev.id).toBe('string');
      expect(typeof ev.ts).toBe('number');
      expect(['solved', 'learned', 'talking', 'alert', 'skill']).toContain(ev.kind);
    }
    await u3();

    vi.useFakeTimers();
    const { resultRef: rt, rerender, unmount: ut } = await renderHook(() =>
      useAgentBoard({ maxEvents: 5, intervalMs: 500 }),
    );
    const firstId = rt.current[0].id;
    await act(() => {
      vi.advanceTimersByTime(600);
    });
    await rerender();
    expect(rt.current[0].id).not.toBe(firstId);
    await ut();

    const { resultRef: rc, rerender: rrc, unmount: uc } = await renderHook(() =>
      useAgentBoard({ maxEvents: 3, intervalMs: 100 }),
    );
    await act(() => {
      vi.advanceTimersByTime(1_500);
    });
    await rrc();
    expect(rc.current.length).toBeLessThanOrEqual(3);
    await uc();
    vi.useRealTimers();

    const customEvent = {
      id: 'test-42',
      kind: 'solved' as const,
      dept: 'Engineering',
      agentId: 'ENG-00001',
      message: 'Custom test event',
      ts: Date.now(),
    };
    const generator = vi.fn().mockReturnValue(customEvent);
    const { resultRef: rg, unmount: ug } = await renderHook(() =>
      useAgentBoard({ maxEvents: 2, intervalMs: 10_000, generateEvent: generator }),
    );
    expect(generator).toHaveBeenCalled();
    expect(rg.current.every((e) => e.id === 'test-42')).toBe(true);
    await ug();

    const ev = defaultGenerateEvent();
    expect(ev.id).toBeTruthy();
    expect(['solved', 'learned', 'talking', 'alert', 'skill']).toContain(ev.kind);
    expect(ev.dept).toBeTruthy();
    expect(ev.agentId).toMatch(/^[A-Z&]+-\d{5}$/);
    expect(ev.message.length).toBeGreaterThan(5);
    expect(ev.ts).toBeGreaterThan(0);

    const learned = Array.from({ length: 100 }, defaultGenerateEvent).filter((e) => e.kind === 'learned');
    expect(learned.length).toBeGreaterThan(0);
    learned.forEach((e) => expect(e.message).not.toContain('$COLLAB'));

    expect(new Set(Array.from({ length: 20 }, () => defaultGenerateEvent().id)).size).toBe(20);

    const skills = Array.from({ length: 200 }, defaultGenerateEvent).filter((e) => e.kind === 'skill');
    expect(skills.length).toBeGreaterThan(0);
    skills.forEach((e) => {
      expect(e.roleTitle).toBeTruthy();
      expect(typeof e.roleTitle).toBe('string');
    });
  });
});
