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
