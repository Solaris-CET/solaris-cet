import {
  CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS,
} from './cetAiConstants';

/**
 * Tailwind classes for the CET AI query length indicator (hero + modal).
 * Amber when within `CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS` of `max`.
 */
export function cetAiQueryCharCountToneClass(length: number, max: number): string {
  return length >= max - CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS
    ? 'text-amber-400/90'
    : 'text-gray-600';
}

/** Interpolate `{current}` and `{max}` in `translations.cetAi.queryCharCountAria`. */
export function formatCetAiQueryCharCountAria(
  template: string,
  current: number,
  max: number,
): string {
  return template.replaceAll('{current}', String(current)).replaceAll('{max}', String(max));
}
