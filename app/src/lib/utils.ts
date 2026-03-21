import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number with locale-aware thousands separators and optional
 * decimal places. Defaults to `en-US` locale for consistent display.
 *
 * @param value     - The numeric value to format
 * @param decimals  - Number of decimal places (default: 0)
 * @param locale    - BCP 47 locale tag (default: 'en-US')
 *
 * @example
 * formatNumber(9000)          // "9,000"
 * formatNumber(1234.5, 2)     // "1,234.50"
 * formatNumber(0.123456, 4)   // "0.1235"
 */
export function formatNumber(
  value: number,
  decimals = 0,
  locale = 'en-US',
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a CET token amount (or any TON-ecosystem token amount) into a
 * human-readable string. Values ≥ 1 000 000 are displayed in millions (M),
 * values ≥ 1 000 are displayed in thousands (K), otherwise the raw value is
 * returned with up to `decimals` significant decimal places.
 *
 * @param value    - The numeric token amount
 * @param decimals - Max decimal places for the raw display path (default: 2)
 *
 * @example
 * formatTokenAmount(9000)        // "9,000"
 * formatTokenAmount(1500000, 2)  // "1.50M"
 * formatTokenAmount(2500)        // "2.5K"
 */
export function formatTokenAmount(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) {
    return `${formatNumber(value / 1_000_000, decimals)}M`;
  }
  if (value >= 1_000) {
    const kValue = value / 1_000;
    // Avoid trailing ".0K" — only show decimal if non-integer
    const kDecimals = kValue % 1 === 0 ? 0 : 1;
    return `${formatNumber(kValue, kDecimals)}K`;
  }
  return formatNumber(value, decimals);
}
