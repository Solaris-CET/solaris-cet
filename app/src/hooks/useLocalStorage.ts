import { useCallback, useEffect,useState } from 'react';

/**
 * Synchronises a state value with `localStorage`, so it persists across page
 * reloads.  The hook behaves identically to `useState` but automatically reads
 * the initial value from storage and writes every update back.
 *
 * Storage errors (e.g. in private-browsing mode where `localStorage` is
 * blocked) are silently swallowed so the hook degrades gracefully to plain
 * in-memory state.
 *
 * @param key     The `localStorage` key to read/write.
 * @param initial The value to use when no stored value is found.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 * ```
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Silently ignore write errors (private browsing, storage quota, etc.)
        }
        return next;
      });
    },
    [key]
  );

  // Keep in sync when another tab writes to the same key.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setStored(initial);
      } else {
        try {
          setStored(JSON.parse(event.newValue) as T);
        } catch {
          // Ignore malformed values written by other tabs
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, initial]);

  return [stored, setValue];
}
