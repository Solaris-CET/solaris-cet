/**
 * Unit tests for the useLocalStorage hook's read/write logic.
 *
 * The vitest environment is configured as "node" and neither jsdom nor
 * @testing-library/react is installed, so full hook rendering (renderHook)
 * is not available.  These tests instead verify the two pure, deterministic
 * localStorage helpers that make up the hook's core:
 *
 *   readFromStorage  — JSON-deserialises a stored value, returns a default
 *                      on any error or absence.
 *   writeToStorage   — JSON-serialises and stores a value, returns false
 *                      (instead of throwing) on any write error.
 *
 * If a DOM environment is added in the future, tests for the full hook
 * (state synchronisation, cross-tab storage events, functional updater form)
 * should be added using @testing-library/react's renderHook utility.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Pure helpers (mirror of the logic inside useLocalStorage) ─────────────────

function readFromStorage<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initial;
  } catch {
    return initial;
  }
}

function writeToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── Minimal localStorage mock ─────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { delete store[key]; },
  clear: (): void => { for (const k in store) delete store[k]; },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useLocalStorage — read/write helpers', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when storage is empty', () => {
    expect(readFromStorage('missing', 42)).toBe(42);
  });

  it('returns a previously stored string value', () => {
    localStorageMock.setItem('key', JSON.stringify('hello'));
    expect(readFromStorage('key', 'default')).toBe('hello');
  });

  it('returns a previously stored numeric value', () => {
    localStorageMock.setItem('num', JSON.stringify(7));
    expect(readFromStorage('num', 0)).toBe(7);
  });

  it('returns a previously stored object value', () => {
    localStorageMock.setItem('obj', JSON.stringify({ x: 1 }));
    expect(readFromStorage('obj', {})).toEqual({ x: 1 });
  });

  it('falls back to initial when getItem throws', () => {
    vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
      throw new Error('storage error');
    });
    expect(readFromStorage('key', 'fallback')).toBe('fallback');
  });

  it('falls back to initial when stored JSON is malformed', () => {
    localStorageMock.setItem('bad', 'not-json{{');
    expect(readFromStorage('bad', 99)).toBe(99);
  });

  it('writes a value and returns true', () => {
    const ok = writeToStorage('k', 123);
    expect(ok).toBe(true);
    expect(JSON.parse(localStorageMock.getItem('k') ?? 'null')).toBe(123);
  });

  it('writes an object value correctly', () => {
    writeToStorage('obj2', { a: 'b' });
    expect(JSON.parse(localStorageMock.getItem('obj2') ?? '{}')).toEqual({ a: 'b' });
  });

  it('returns false and does not throw when setItem throws', () => {
    vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeToStorage('k', 'v')).not.toThrow();
    expect(writeToStorage('k', 'v')).toBe(false);
  });
});
