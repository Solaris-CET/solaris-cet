/**
 * Shared test utilities for the Solaris CET test suite.
 *
 * Import helpers from this module in test files to avoid duplication.
 */

// ---------------------------------------------------------------------------
// localStorage mock for `node` test environment
// ---------------------------------------------------------------------------

/** In-memory localStorage substitute compatible with the `node` vitest environment. */
export function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = value; },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { store = {}; },
  };
}

/**
 * Install an in-memory localStorage on `globalThis` and return the mock so
 * tests can inspect stored values directly.
 *
 * Call `installedMock.clear()` in `beforeEach` / `afterEach` to reset state.
 */
export function installLocalStorageMock() {
  const mock = createLocalStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true,
  });
  return mock;
}
