import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number with locale-aware thousands separators and a fixed number
 * of decimal places. Defaults to 2 decimal places.
 *
 * @example
 * formatNumber(9000)        // "9,000.00"
 * formatNumber(1234.5, 0)   // "1,235"
 * formatNumber(0.0082, 4)   // "0.0082"
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a number as a USD currency string.
 *
 * @example
 * formatCurrency(1234.5)    // "$1,234.50"
 * formatCurrency(0.00082, 5) // "$0.00082"
 */
export function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a numeric percentage, appending the "%" symbol.
 *
 * @example
 * formatPercentage(15.5)    // "15.50%"
 * formatPercentage(100, 0)  // "100%"
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Clamps a number between `min` and `max` (inclusive).
 *
 * @example
 * clamp(5, 0, 10)   // 5
 * clamp(-1, 0, 10)  // 0
 * clamp(15, 0, 10)  // 10
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a number as a compact USD string using K/M suffixes for large values
 * and 4 decimal places for small values. Returns `'—'` for non-finite inputs.
 *
 * @example
 * formatUsd(1_234_567)   // "$1.23M"
 * formatUsd(5_678)       // "$5.68K"
 * formatUsd(0.0042)      // "$0.0042"
 * formatUsd(null)        // "—"
 */
export function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(4)}`;
}

/**
 * Formats a token/asset price as a USD string. Values below `0.001` are
 * rendered in scientific notation; all others use 4 fixed decimal places.
 * Returns `'—'` for non-finite inputs.
 *
 * @example
 * formatPrice(0.00042)   // "$4.20e-4"
 * formatPrice(3.1415)    // "$3.1415"
 * formatPrice(null)      // "—"
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.001) return `$${value.toExponential(2)}`;
  return `$${value.toFixed(4)}`;
}

/**
 * Returns a debounced version of `fn` that delays invocation until `delay`
 * milliseconds have elapsed since the last call.
 *
 * @example
 * const save = debounce(() => saveToServer(), 300);
 * save(); save(); save(); // server called once after 300 ms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
