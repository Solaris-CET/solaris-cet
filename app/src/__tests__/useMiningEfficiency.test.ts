// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMiningEfficiency } from '../hooks/useMiningEfficiency';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fire a fake `visibilitychange` event with the given `document.hidden` value. */
function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMiningEfficiency', () => {
  beforeEach(() => {
    // Start with tab visible
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
    window.localStorage.removeItem('mining-status');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem('mining-status');
  });

  it('starts with isSuspended = false when tab is visible', () => {
    const { result } = renderHook(() => useMiningEfficiency());
    expect(result.current.isSuspended).toBe(false);
  });

  it('sets isSuspended = true when document becomes hidden', () => {
    const { result } = renderHook(() => useMiningEfficiency());

    act(() => {
      setDocumentHidden(true);
    });

    expect(result.current.isSuspended).toBe(true);
  });

  it('sets isSuspended = false when document becomes visible again', () => {
    const { result } = renderHook(() => useMiningEfficiency());

    act(() => {
      setDocumentHidden(true);
    });
    expect(result.current.isSuspended).toBe(true);

    act(() => {
      setDocumentHidden(false);
    });
    expect(result.current.isSuspended).toBe(false);
  });

  it('writes "suspended" to localStorage when tab hides', () => {
    renderHook(() => useMiningEfficiency());

    act(() => {
      setDocumentHidden(true);
    });

    expect(window.localStorage.getItem('mining-status')).toBe('suspended');
  });

  it('writes "active" to localStorage when tab becomes visible', () => {
    renderHook(() => useMiningEfficiency());

    act(() => {
      setDocumentHidden(true);
    });
    act(() => {
      setDocumentHidden(false);
    });

    expect(window.localStorage.getItem('mining-status')).toBe('active');
  });

  it('posts SUSPEND message to a worker when tab hides', () => {
    const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
    const workerRef = { current: mockWorker };

    renderHook(() => useMiningEfficiency(workerRef));

    act(() => {
      setDocumentHidden(true);
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SUSPEND' });
  });

  it('posts RESUME message to a worker when tab becomes visible', () => {
    const mockWorker = { postMessage: vi.fn() } as unknown as Worker;
    const workerRef = { current: mockWorker };

    renderHook(() => useMiningEfficiency(workerRef));

    act(() => {
      setDocumentHidden(true);
    });
    act(() => {
      setDocumentHidden(false);
    });

    expect(mockWorker.postMessage).toHaveBeenLastCalledWith({ type: 'RESUME' });
  });

  it('exposes a getBatteryInfo function', () => {
    const { result } = renderHook(() => useMiningEfficiency());
    expect(typeof result.current.getBatteryInfo).toBe('function');
  });

  it('getBatteryInfo returns a fallback when Battery API is unavailable', async () => {
    // jsdom does not implement getBattery — the hook should return a safe fallback
    const { result } = renderHook(() => useMiningEfficiency());
    const info = await result.current.getBatteryInfo();

    expect(info).toMatchObject({ level: 100, charging: true });
    expect(info.note).toBeDefined(); // fallback includes a note
  });

  it('removes the visibilitychange listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useMiningEfficiency());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
