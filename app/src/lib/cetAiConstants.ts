/**
 * Max characters for a single CET AI user query (UI + Edge `/api/chat`).
 * Keep in sync with repository root `api/chat/route.ts` (OpenAI fallback).
 */
export const CET_AI_MAX_QUERY_CHARS = 8000 as const;

/**
 * When remaining characters to the cap are at or below this value, the query length
 * indicator uses the warning (amber) tone — see `cetAiQueryCharCountToneClass`.
 */
export const CET_AI_QUERY_NEAR_LIMIT_REMAINING_CHARS = 200 as const;
