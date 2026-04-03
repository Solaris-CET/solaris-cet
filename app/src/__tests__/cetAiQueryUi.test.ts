import { describe, it, expect } from 'vitest';
import { cetAiQueryCharCountToneClass } from '@/lib/cetAiQueryUi';
import {
  CET_AI_MAX_QUERY_CHARS,
  CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS,
} from '@/lib/cetAiConstants';

describe('cetAiQueryCharCountToneClass', () => {
  it('uses neutral gray when above the near-limit band', () => {
    expect(
      cetAiQueryCharCountToneClass(
        CET_AI_MAX_QUERY_CHARS - CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS - 1,
        CET_AI_MAX_QUERY_CHARS,
      ),
    ).toBe('text-gray-600');
  });

  it('uses amber at the near-limit threshold and at cap', () => {
    expect(
      cetAiQueryCharCountToneClass(
        CET_AI_MAX_QUERY_CHARS - CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS,
        CET_AI_MAX_QUERY_CHARS,
      ),
    ).toBe('text-amber-400/90');
    expect(cetAiQueryCharCountToneClass(CET_AI_MAX_QUERY_CHARS, CET_AI_MAX_QUERY_CHARS)).toBe(
      'text-amber-400/90',
    );
  });

  it('when max is smaller than the near-limit band width, the comparison still yields warning tone for typical lengths', () => {
    expect(cetAiQueryCharCountToneClass(1, 100)).toBe('text-amber-400/90');
  });
});
