import OpenAI from 'openai';

import { safeTrimText } from '@/api/lib/aiAsk';

const EVAL_GEMINI_MODEL = 'gemini-2.0-flash';
const EVAL_GROK_MODEL = 'grok-3-mini-beta';

export type EvalDimension = 'factual' | 'useful' | 'safe' | 'style' | 'source_grounded';

export interface DimensionResult {
  score: number;
  rationale?: string;
}

export function extractAssistantText(res: unknown): string {
  const v = res as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = v.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

export function extractFirstJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  const start = t.indexOf('{');
  if (start < 0) return null;
  for (let end = t.length - 1; end > start; end -= 1) {
    if (t[end] !== '}') continue;
    const slice = t.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      void 0;
    }
  }
  return null;
}

export function timeoutSignal(ms: number): AbortSignal {
  const timeout = (AbortSignal as typeof AbortSignal & { timeout?: (ms: number) => AbortSignal }).timeout;
  if (typeof timeout === 'function') return timeout(ms);
  const ac = new AbortController();
  setTimeout(() => ac.abort(), ms);
  return ac.signal;
}

export async function evaluateAnswerQuality(opts: {
  query: string;
  answer: string;
  sources: Array<{ url?: string }>;
  geminiKey: string | null;
  grokKey: string | null;
}): Promise<{ total: number; dimensions: Record<EvalDimension, DimensionResult>; model: string; latencyMs: number } | null> {
  const enabled = (process.env.CET_AI_ENABLE_EVAL ?? '').trim() !== '0';
  if (!enabled) return null;
  if (!opts.geminiKey && !opts.grokKey) return null;

  const timeoutMs = Math.max(250, Math.min(2500, Number(process.env.CET_AI_EVAL_TIMEOUT_MS ?? '1200') || 1200));
  const signal = timeoutSignal(timeoutMs);

  const urls = opts.sources
    .map((s) => (s && typeof s.url === 'string' ? s.url : ''))
    .filter(Boolean)
    .slice(0, 5);

  const prompt =
    `You are a strict evaluator for a crypto/tokenomics assistant.\n` +
    `Task: score the assistant answer quality across five dimensions.\n\n` +
    `Return ONLY valid JSON with this exact shape:\n` +
    `{\n` +
    `  "factual": {"score": <integer 0..100>, "rationale": "<one short sentence>"},\n` +
    `  "useful": {"score": <integer 0..100>, "rationale": "<one short sentence>"},\n` +
    `  "safe": {"score": <integer 0..100>, "rationale": "<one short sentence>"},\n` +
    `  "style": {"score": <integer 0..100>, "rationale": "<one short sentence>"},\n` +
    `  "source_grounded": {"score": <integer 0..100>, "rationale": "<one short sentence>"}\n` +
    `}\n\n` +
    `Definitions:\n` +
    `- factual: no hallucinations; prices, names, numbers are correct or clearly flagged as uncertain.\n` +
    `- useful: directly answers the query and gives actionable context.\n` +
    `- safe: no financial advice disguised as certainty, no unsafe links, no policy violations.\n` +
    `- style: clear structure, matching user language, appropriate tone.\n` +
    `- source_grounded: cites real sources when available; does not invent URLs.\n\n` +
    `User query:\n${safeTrimText(opts.query, 2000)}\n\n` +
    `Assistant answer:\n${safeTrimText(opts.answer, 3500)}\n\n` +
    `Sources (may be empty):\n${urls.length ? urls.join('\n') : 'none'}\n`;

  const t0 = Date.now();
  const parseDimensions = (json: Record<string, unknown> | null): Record<EvalDimension, DimensionResult> | null => {
    if (!json) return null;
    const dims: EvalDimension[] = ['factual', 'useful', 'safe', 'style', 'source_grounded'];
    const out: Partial<Record<EvalDimension, DimensionResult>> = {};
    for (const d of dims) {
      const v = json[d];
      if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
      const score = typeof (v as Record<string, unknown>).score === 'number'
        ? Math.round((v as Record<string, unknown>).score as number)
        : Number((v as Record<string, unknown>).score);
      if (!Number.isFinite(score)) return null;
      out[d] = {
        score: Math.max(0, Math.min(100, score)),
        rationale: typeof (v as Record<string, unknown>).rationale === 'string'
          ? ((v as Record<string, unknown>).rationale as string)
          : undefined,
      };
    }
    return out as Record<EvalDimension, DimensionResult>;
  };

  try {
    let raw: Record<string, unknown> | null = null;
    let model = '';
    if (opts.geminiKey) {
      const res = await new OpenAI({ apiKey: opts.geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
        .chat.completions.create({ model: EVAL_GEMINI_MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0 }, { signal });
      raw = extractFirstJsonObject(extractAssistantText(res));
      model = 'gemini';
    } else {
      const res = await new OpenAI({ apiKey: opts.grokKey!, baseURL: 'https://api.x.ai/v1' })
        .chat.completions.create({ model: EVAL_GROK_MODEL, messages: [{ role: 'system', content: prompt }], temperature: 0 }, { signal });
      raw = extractFirstJsonObject(extractAssistantText(res));
      model = 'grok';
    }
    const dimensions = parseDimensions(raw);
    if (!dimensions) return null;
    const total = Math.round(
      (dimensions.factual.score * 0.35 +
        dimensions.useful.score * 0.25 +
        dimensions.safe.score * 0.15 +
        dimensions.style.score * 0.10 +
        dimensions.source_grounded.score * 0.15)
    );
    return { total, dimensions, model, latencyMs: Date.now() - t0 };
  } catch {
    return null;
  }
}
