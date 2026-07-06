export type AiProvider = 'gemini' | 'grok' | 'claude';

function envNumber(name: string): number | null {
  const raw = String(process.env[name] ?? '').trim();
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function estimateCostUsd(input: {
  provider: AiProvider;
  promptTokens?: number;
  completionTokens?: number;
}): number | null {
  const promptTokens = input.promptTokens;
  const completionTokens = input.completionTokens;
  if (typeof promptTokens !== 'number' || typeof completionTokens !== 'number') return null;

  const p = input.provider.toUpperCase();
  const promptPer1k = envNumber(`CET_AI_PRICE_${p}_PROMPT_PER_1K_USD`);
  const completionPer1k = envNumber(`CET_AI_PRICE_${p}_COMPLETION_PER_1K_USD`);
  if (promptPer1k == null || completionPer1k == null) return null;

  const cost = (promptTokens / 1000) * promptPer1k + (completionTokens / 1000) * completionPer1k;
  return Number.isFinite(cost) ? cost : null;
}

