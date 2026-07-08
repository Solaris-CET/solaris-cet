import type { CetAiKnowledge, Translations } from '@/i18n/translations';

import { CONFIDENCE_SCORES, TOPIC_KEYWORDS } from './cetAiConstants';

export function liveApiHttpHintForStatus(
  cet: Translations['cetAi'],
  status: number | null,
): string | null {
  if (status == null || status < 400) return null;
  if (status === 429) return cet.liveApiErrorRateLimited;
  if (status === 502 || status === 503 || status === 504) return cet.liveApiErrorServiceUnavailable;
  if (status >= 500) return cet.liveApiErrorServerError;
  return null;
}

/** Enter / ⌘+Enter / Ctrl+Enter submit; Shift+Enter stays newline (textarea). */
export function handleComposerEnterKeyDown(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  opts: { isProcessing: boolean; hasText: boolean },
): void {
  if (e.key !== 'Enter') return;
  if (e.nativeEvent.isComposing) return;
  if (e.shiftKey) return;
  e.preventDefault();
  if (!opts.isProcessing && opts.hasText) {
    (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
  }
}

export function buildContextualResponse(q: string, knowledge: CetAiKnowledge): { answer: string; confidence: number } {
  const lower = q.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return { answer: knowledge[topic as keyof CetAiKnowledge], confidence: CONFIDENCE_SCORES[topic] };
    }
  }
  return { answer: knowledge.default, confidence: CONFIDENCE_SCORES.default };
}
