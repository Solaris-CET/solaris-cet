import { useEffect, useState } from 'react';

/**
 * useDebounce — returns a debounced copy of `value` that only updates after
 * `delay` milliseconds have elapsed without a new value being received.
 *
 * Useful for delaying expensive operations (API calls, heavy filtering) until
 * the user has stopped typing.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 300);
 *
 * useEffect(() => {
 *   if (debouncedQuery) fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
