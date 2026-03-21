// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useMiningEfficiency } from '../hooks/useMiningEfficiency';

// ---------------------------------------------------------------------------
// Helpers — simulate Page Visibility API events
// ---------------------------------------------------------------------------

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', {
    value: hidden,
    writable: true,
    configurable: true,
  });
}

async function fireVisibilityChange() {
  await act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

beforeEach(() => {
  setDocumentHidden(false);
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMiningEfficiency', () => {
  it('starts not suspended when the document is visible', async () => {
    setDocumentHidden(false);
    const { resultRef } = await renderHook(() => useMiningEfficiency());
    expect(resultRef.current.isSuspended).toBe(false);
  });

  it('starts suspended when the document is hidden on mount', async () => {
    setDocumentHidden(true);
    const { resultRef } = await renderHook(() => useMiningEfficiency());
    expect(resultRef.current.isSuspended).toBe(true);
  });

  it('suspends when the tab becomes hidden', async () => {
    setDocumentHidden(false);
    const { resultRef } = await renderHook(() => useMiningEfficiency());
    expect(resultRef.current.isSuspended).toBe(false);

    setDocumentHidden(true);
    await fireVisibilityChange();

    expect(resultRef.current.isSuspended).toBe(true);
  });

  it('resumes when the tab becomes visible again', async () => {
    setDocumentHidden(true);
    const { resultRef } = await renderHook(() => useMiningEfficiency());

    setDocumentHidden(false);
    await fireVisibilityChange();

    expect(resultRef.current.isSuspended).toBe(false);
  });

  it('updates localStorage when visibility changes', async () => {
    setDocumentHidden(false);
    await renderHook(() => useMiningEfficiency());

    setDocumentHidden(true);
    await fireVisibilityChange();
    expect(localStorage.getItem('mining-status')).toBe('suspended');

    setDocumentHidden(false);
    await fireVisibilityChange();
    expect(localStorage.getItem('mining-status')).toBe('active');
  });

  it('posts SUSPEND/RESUME messages to a provided worker ref', async () => {
    const mockWorker = { postMessage: vi.fn() };
    const workerRef = { current: mockWorker as unknown as Worker };

    setDocumentHidden(false);
    await renderHook(() => useMiningEfficiency(workerRef));

    setDocumentHidden(true);
    await fireVisibilityChange();
    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SUSPEND' });

    setDocumentHidden(false);
    await fireVisibilityChange();
    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'RESUME' });
  });

  it('getBatteryInfo returns a fallback when Battery API is unavailable', async () => {
    const { resultRef } = await renderHook(() => useMiningEfficiency());
    const info = await resultRef.current.getBatteryInfo();
    // jsdom does not implement the Battery API — expect the graceful fallback
    expect(info.level).toBe(100);
    expect(info.charging).toBe(true);
    expect(info.note).toMatch(/unavailable/i);
  });
});
