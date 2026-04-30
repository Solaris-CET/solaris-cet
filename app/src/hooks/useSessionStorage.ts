import { useCallback,useState } from 'react';

export function useSessionStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
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
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          void 0;
        }
        return next;
      });
    },
    [key],
  );

  return [stored, setValue];
}
