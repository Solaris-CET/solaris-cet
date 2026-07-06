import type { Translations } from '../i18n/translations';

export interface CetAiChatEntry {
  id?: string;
  question: string;
  answer: string;
  confidence: number;
  createdAt?: number;
  modelUsed?: string;
  sources?: Array<{ id: string; title: string; url: string; snippet: string }>;
  alternates?: Array<{
    answer: string;
    confidence: number;
    createdAt: number;
    modelUsed?: string;
    sources?: Array<{ id: string; title: string; url: string; snippet: string }>;
  }>;
  pinned?: boolean;
}

export function buildCopyForAiText(q: string, a: string, o: Translations['cetAi']): string {
  return `${o.copyForAiQuestionLabel}\n${q}\n\n${o.copyForAiAnswerLabel}\n${a}\n\n${o.copyForAiInstructions}`;
}

/** Multi-turn handoff: prior history blocks + current Q&A, same format as copy-for-AI. */
export function buildFullConversationHandoff(
  history: CetAiChatEntry[],
  currentQuestion: string,
  currentAnswer: string,
  o: Translations['cetAi'],
): string {
  const parts: string[] = [];
  for (const e of history) {
    parts.push(buildCopyForAiText(e.question, e.answer, o));
  }
  parts.push(buildCopyForAiText(currentQuestion, currentAnswer, o));
  return parts.join('\n\n---\n\n');
}
