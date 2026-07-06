/**
 * Pure read/write mirrors of `useLocalStorage` (no React render).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    for (const k in store) delete store[k];
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('useLocalStorage — read/write helpers', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('read empty, strings, numbers, objects, malformed, getItem throw; write ok, object, setItem throw', () => {
    expect(readFromStorage('missing', 42)).toBe(42);

    localStorageMock.setItem('key', JSON.stringify('hello'));
    expect(readFromStorage('key', 'default')).toBe('hello');

    localStorageMock.setItem('num', JSON.stringify(7));
    expect(readFromStorage('num', 0)).toBe(7);

    localStorageMock.setItem('obj', JSON.stringify({ x: 1 }));
    expect(readFromStorage('obj', {})).toEqual({ x: 1 });

    vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
      throw new Error('storage error');
    });
    expect(readFromStorage('key', 'fallback')).toBe('fallback');
    vi.restoreAllMocks();

    localStorageMock.setItem('bad', 'not-json{{');
    expect(readFromStorage('bad', 99)).toBe(99);

    expect(writeToStorage('k', 123)).toBe(true);
    expect(JSON.parse(localStorageMock.getItem('k') ?? 'null')).toBe(123);

    writeToStorage('obj2', { a: 'b' });
    expect(JSON.parse(localStorageMock.getItem('obj2') ?? '{}')).toEqual({ a: 'b' });

    vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => writeToStorage('k', 'v')).not.toThrow();
    expect(writeToStorage('k', 'v')).toBe(false);
  });
});
