/**
 * Edge runtime — POST `/api/chat`
 *
 * Solaris CET AI: combines Grok (xAI) and Google Gemini to power the
 * Solaris RAV Protocol (Reason-Act-Verify).
 *
 * - REASON phase → Google Gemini (`GEMINI_API_KEY_ENC` / `GEMINI_API_KEY`):
 *   analytical context, on-chain data synthesis, and structured diagnostic thought.
 * - ACT + VERIFY phases → Grok (`GROK_API_KEY_ENC` / `GROK_API_KEY`):
 *   decisive action directive and final observation anchored to DeDust live data.
 *
 * API keys are resolved from AES-256-GCM encrypted env vars when available.
 * See `app/api/lib/crypto.ts` and `scripts/encrypt-key.mjs` for details.
 *
 * If one provider is unavailable the other generates the full 3-part
 * RAV response so CET AI never goes silent.
 *
 * `runtime: 'edge'` matches edge-style adapters and compatible hosts (e.g. Coolify).
 */
import OpenAI from 'openai';
import { getAllowedOrigin } from '../lib/cors';
import { getAiChatCache, getCacheTtlSeconds, setAiChatCache, sha256Hex } from '../lib/aiCache';
import { clientIp } from '../lib/clientIp';
import { resolveApiKey } from '../lib/crypto';
import { buildCetAiRetrievalBlock } from '../lib/cetAiRetrieval';
import { decideCetAiRavPlan, deriveCetAiResourceBudget } from '../lib/reactBrain';
import { acquireConcurrencySlot } from '../lib/concurrencyLimit';
import { circuitAllows, circuitReportFailure, circuitReportSuccess } from '../lib/circuitBreaker';
import { withRateLimit } from '../lib/rateLimit';
import { CET_CONTRACT_ADDRESS } from '../../src/lib/cetContract';
import { CET_AI_MAX_QUERY_CHARS } from '../../src/lib/cetAiConstants';
import { DEDUST_POOL_ADDRESS } from '../../src/lib/dedustUrls';
import { TOKEN_DECIMALS } from '../../src/constants/token';

export const config = { runtime: 'edge' };

/** AI model identifiers — update here to change versions across all call sites. */
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROK_MODEL = 'grok-3-mini-beta';
const CLAUDE_MODEL = (process.env.CET_AI_CLAUDE_MODEL ?? 'claude-3-5-sonnet-20241022').trim() || 'claude-3-5-sonnet-20241022';

interface DeDustAsset {
  type: 'native' | 'jetton';
  address?: string;
}

interface DeDustPoolStats {
  volume_24h?: string;
}

interface DeDustPool {
  address: string;
  assets: [DeDustAsset, DeDustAsset];
  reserves: [string, string];
  stats?: DeDustPoolStats;
}

interface DeDustPrice {
  address: string;
  price: string;
}

interface OnChainContext {
  cetPriceUsd: string;
  tonPriceUsd: string;
  tvlUsd: string;
  volume24hUsd: string;
}

/** Prior turns for multi-turn follow-ups (Claude-style chat context). Max 24 messages. */
interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

function normalizeConversation(raw: unknown): ConversationTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ConversationTurn[] = [];
  for (const item of raw) {
    if (out.length >= 24) break;
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const c = content.trim();
    if (!c) continue;
    out.push({ role, content: c.slice(0, CET_AI_MAX_QUERY_CHARS) });
  }
  return out;
}

function buildChatMessages(
  systemPrompt: string,
  userQuery: string,
  conversation: ConversationTurn[],
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const msgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];
  for (const t of conversation) {
    msgs.push({ role: t.role, content: t.content });
  }
  msgs.push({ role: 'user', content: userQuery.trim() });
  return msgs;
}

async function claudeComplete(opts: {
  apiKey: string;
  model: string;
  system: string;
  conversation: ConversationTurn[];
  userQuery: string;
  temperature: number;
}): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const t of opts.conversation) messages.push({ role: t.role, content: t.content });
    messages.push({ role: 'user', content: opts.userQuery.trim() });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 1200,
        temperature: Math.max(0, Math.min(1, opts.temperature)),
        system: opts.system,
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Claude request failed (${res.status}).`);
    const payload = (await res.json()) as { content?: Array<{ type?: unknown; text?: unknown }> };
    return (
      payload?.content
        ?.map((c) => (c && c.type === 'text' && typeof c.text === 'string' ? c.text : ''))
        .filter(Boolean)
        .join('') ?? ''
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch live on-chain data from the DeDust V2 API.
 * Returns null on any error so the handler can degrade gracefully.
 */
async function fetchOnChainContext(): Promise<OnChainContext | null> {
  try {
    const controller = new AbortController();
    // Increase timeout for the 23MB pools JSON
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const [poolsRes, pricesRes] = await Promise.all([
      fetch('https://api.dedust.io/v2/pools', { signal: controller.signal }),
      fetch('https://api.dedust.io/v2/prices', { signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (!poolsRes.ok || !pricesRes.ok) return null;

    const pools = (await poolsRes.json()) as DeDustPool[];
    const prices = (await pricesRes.json()) as DeDustPrice[];

    const tonEntry = prices.find((p) => p.address === 'native');
    const tonPriceUsd = tonEntry ? parseFloat(tonEntry.price) : null;
    if (!tonPriceUsd) return null;

    const cetPool = pools.find((p) => p.address === DEDUST_POOL_ADDRESS);

    const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
    const cetEntry = prices.find((p) => p.address.toLowerCase() === cetAddressLower);
    let cetPriceUsd: number | null = cetEntry ? parseFloat(cetEntry.price) : null;

    let tvlUsd: number | null = null;
    let volume24hUsd: number | null = null;

    if (cetPool) {
      const tonIndex = cetPool.assets[0].type === 'native' ? 0 : 1;
      const cetIndex = tonIndex === 0 ? 1 : 0;

      const tonReserve = parseFloat(cetPool.reserves[tonIndex]) / 1e9;
      const cetReserve = parseFloat(cetPool.reserves[cetIndex]) / Math.pow(10, TOKEN_DECIMALS);

      if (cetPriceUsd === null && cetReserve > 0) {
        cetPriceUsd = (tonReserve / cetReserve) * tonPriceUsd;
      }

      tvlUsd = tonReserve * tonPriceUsd * 2;

      if (cetPool.stats?.volume_24h) {
        const volumeTon = parseFloat(cetPool.stats.volume_24h) / 1e9;
        volume24hUsd = volumeTon * tonPriceUsd;
      }
    }

    return {
      cetPriceUsd: cetPriceUsd !== null ? cetPriceUsd.toFixed(4) : 'N/A',
      tonPriceUsd: tonPriceUsd.toFixed(4),
      tvlUsd: tvlUsd !== null ? tvlUsd.toFixed(2) : 'N/A',
      volume24hUsd: volume24hUsd !== null ? volume24hUsd.toFixed(2) : 'N/A',
    };
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'cet-ai-chat',
    limit: 10,
    windowSeconds: 10,
  });
  if (limited) return limited;

  const globalSlot = await acquireConcurrencySlot(req, {
    keyPrefix: 'cet-ai-chat:global',
    keyPart: 'global',
    limit: process.env.CET_AI_CHAT_MAX_CONCURRENT_GLOBAL ?? 40,
    ttlSeconds: 45,
    allowedOrigin,
    retryAfterSeconds: 2,
  });
  if (globalSlot instanceof Response) return globalSlot;

  const ipSlot = await acquireConcurrencySlot(req, {
    keyPrefix: 'cet-ai-chat:ip',
    limit: process.env.CET_AI_CHAT_MAX_CONCURRENT_PER_IP ?? 2,
    ttlSeconds: 45,
    allowedOrigin,
    retryAfterSeconds: 2,
  });
  if (ipSlot instanceof Response) {
    await globalSlot.release();
    return ipSlot;
  }

  try {
  // 1. Resolve API keys — prefer AES-256-GCM encrypted variants (*_ENC) when
  //    ENCRYPTION_SECRET is set; fall back to plaintext variants for local dev.
  const encryptionSecret = process.env.ENCRYPTION_SECRET;
  const [grokKey, geminiKey, claudeKey] = await Promise.all([
    resolveApiKey(process.env.GROK_API_KEY_ENC, process.env.GROK_API_KEY, encryptionSecret),
    resolveApiKey(process.env.GEMINI_API_KEY_ENC, process.env.GEMINI_API_KEY, encryptionSecret),
    resolveApiKey(process.env.ANTHROPIC_API_KEY_ENC, process.env.ANTHROPIC_API_KEY, encryptionSecret),
  ]);

  if (!grokKey && !geminiKey && !claudeKey) {
    return new Response(
      JSON.stringify({ message: 'No AI provider API key configured. Set GROK_API_KEY_ENC/GROK_API_KEY, GEMINI_API_KEY_ENC/GEMINI_API_KEY, or ANTHROPIC_API_KEY_ENC/ANTHROPIC_API_KEY in the server environment.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin',
        },
      },
    );
  }

  // 2. Parse Request
  const body = (await req.json()) as { query?: unknown; conversation?: unknown };
  const userQuery = body.query;
  const conversation = normalizeConversation(body.conversation);

  if (!userQuery || typeof userQuery !== 'string' || !userQuery.trim()) {
    return new Response(
      JSON.stringify({ message: 'Query parameter is missing.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin',
        },
      },
    );
  }

  const trimmedQuery = userQuery.trim();
  if (trimmedQuery.length > CET_AI_MAX_QUERY_CHARS) {
    return new Response(
      JSON.stringify({ message: `Query must be at most ${CET_AI_MAX_QUERY_CHARS} characters.` }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin',
        },
      },
    );
  }

  const cacheTtlSeconds = getCacheTtlSeconds();
  const ip = clientIp(req);
  const cacheKey =
    cacheTtlSeconds > 0 && conversation.length === 0
      ? await sha256Hex(`${ip}|${trimmedQuery.toLowerCase()}`)
      : null;

  if (cacheKey) {
    const cached = getAiChatCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, usage: cached.usage ?? {} }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cet-Ai-Source': 'cache',
          'X-Cet-Ai-Plan': 'cached',
          'X-Cet-Ai-Cache': 'hit',
          'X-Cet-Ai-Cache-Ttl': String(cacheTtlSeconds),
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin, X-Forwarded-For',
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  const budget = deriveCetAiResourceBudget(req);
  let plan = decideCetAiRavPlan({
    query: trimmedQuery,
    conversationTurns: conversation.length,
    hasGemini: Boolean(geminiKey),
    hasGrok: Boolean(grokKey),
    hasClaude: Boolean(claudeKey),
    budget,
  });

  const allowGemini = Boolean(geminiKey) && circuitAllows('cet-ai:gemini');
  const allowGrok = Boolean(grokKey) && circuitAllows('cet-ai:grok');
  if (plan.providers.strategy === 'dual' && (!allowGemini || !allowGrok)) {
    plan = allowGrok
      ? { ...plan, providers: { strategy: 'single' as const, useGemini: false, useGrok: true, useClaude: false, singleProvider: 'grok' as const } }
      : { ...plan, providers: { strategy: 'single' as const, useGemini: true, useGrok: false, useClaude: false, singleProvider: 'gemini' as const } };
  }

  const onChain = plan.useOnChain ? await fetchOnChainContext() : null;
  const onChainBlock = onChain
    ? `\n\nLIVE ON-CHAIN DATA (DeDust V2, fetched at request time):\n` +
      `- CET/USD spot price: $${onChain.cetPriceUsd}\n` +
      `- TON/USD price: $${onChain.tonPriceUsd}\n` +
      `- Pool TVL: $${onChain.tvlUsd}\n` +
      `- 24h volume: $${onChain.volume24hUsd}`
    : '';

  const retrieval = await buildCetAiRetrievalBlock(trimmedQuery, { enableWeb: plan.useWebRetrieval });

  const multiTurnHint =
    conversation.length > 0
      ? `MULTI-TURN: Prior user/assistant messages are included below. Answer the **latest** user message ` +
        `in full; use earlier turns only for follow-up context, pronouns, and consistency.\n\n`
      : '';

  // ── SHARED SYSTEM CONTEXT ─────────────────────────────────────────────────
  const sharedContext =
    multiTurnHint +
    `You are Solaris CET AI — a helpful assistant for Solaris CET and general crypto/DeFi questions.\n\n` +
    `LANGUAGE: Reply in the same language as the user's latest message.\n\n` +
    `RULES:\n` +
    `- Be accurate and explicit about uncertainty.\n` +
    `- Never invent on-chain prices, URLs, or claims.\n` +
    `- If the question is ambiguous, ask 1-2 clarifying questions.\n` +
    `- If LIVE ON-CHAIN DATA is missing, say so briefly.\n` +
    onChainBlock +
    retrieval.block +
    (retrieval.sources.length > 0
      ? `\n\nCITATIONS:\n` +
        `- If RETRIEVAL SOURCES are present, end with:\n` +
        `  Sources: <up to 5 URLs you used>\n` +
        `- Never invent URLs. If you did not use any, write: Sources: none.\n`
      : '');

  const geminiSystemPrompt =
    sharedContext +
    `\n\nAnswer the user directly. Prefer a concise, technical answer when possible.\n`;

  const grokSystemPrompt =
    sharedContext +
    `\n\nAnswer the user directly. Prefer a clear structure (short paragraphs or bullets) when helpful.\n`;

  const fullFallbackPrompt =
    sharedContext +
    `\n\nAnswer the user directly. Prefer a clear structure (short paragraphs or bullets) when helpful.\n`;

  const geminiMessages = buildChatMessages(geminiSystemPrompt, trimmedQuery, conversation);
  const grokMessages = buildChatMessages(grokSystemPrompt, trimmedQuery, conversation);
  const fullFallbackMessages = buildChatMessages(fullFallbackPrompt, trimmedQuery, conversation);

  let reply: string;
  let usage: { gemini?: unknown; grok?: unknown } | null = null;

  if (plan.providers.strategy === 'dual') {
    const [geminiResult, grokResult] = await Promise.allSettled([
      new OpenAI({
        apiKey: geminiKey!,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }).chat.completions.create({
        model: GEMINI_MODEL,
        messages: geminiMessages,
        temperature: plan.temperature,
      }),
      new OpenAI({
        apiKey: grokKey!,
        baseURL: 'https://api.x.ai/v1',
      }).chat.completions.create({
        model: GROK_MODEL,
        messages: grokMessages,
        temperature: plan.temperature,
      }),
    ]);

    const geminiOk = geminiResult.status === 'fulfilled';
    const grokOk = grokResult.status === 'fulfilled';
    if (geminiOk) circuitReportSuccess('cet-ai:gemini');
    else circuitReportFailure('cet-ai:gemini');
    if (grokOk) circuitReportSuccess('cet-ai:grok');
    else circuitReportFailure('cet-ai:grok');

    if (geminiOk && grokOk) {
      const geminiText = geminiResult.value.choices[0]?.message?.content ?? '';
      const grokText = grokResult.value.choices[0]?.message?.content ?? '';
      usage = { gemini: geminiResult.value.usage ?? null, grok: grokResult.value.usage ?? null };
      reply = `${geminiText.trim()}\n\n${grokText.trim()}`;
    } else if (geminiOk) {
      const fallbackClient = new OpenAI({
        apiKey: geminiKey!,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
      const fallback = await fallbackClient.chat.completions.create({
        model: GEMINI_MODEL,
        messages: fullFallbackMessages,
        temperature: plan.temperature,
      });
      circuitReportSuccess('cet-ai:gemini');
      usage = { gemini: fallback.usage ?? null };
      reply = fallback.choices[0]?.message?.content ?? 'CET AI is silent.';
    } else if (grokOk) {
      const fallbackClient = new OpenAI({
        apiKey: grokKey!,
        baseURL: 'https://api.x.ai/v1',
      });
      const fallback = await fallbackClient.chat.completions.create({
        model: GROK_MODEL,
        messages: fullFallbackMessages,
        temperature: plan.temperature,
      });
      circuitReportSuccess('cet-ai:grok');
      usage = { grok: fallback.usage ?? null };
      reply = fallback.choices[0]?.message?.content ?? 'CET AI is silent.';
    } else {
      throw new Error('All AI providers failed to respond.');
    }
  } else {
    if (plan.providers.singleProvider === 'grok') {
      const client = new OpenAI({ apiKey: grokKey!, baseURL: 'https://api.x.ai/v1' });
      try {
        const res = await client.chat.completions.create({
          model: GROK_MODEL,
          messages: fullFallbackMessages,
          temperature: plan.temperature,
        });
        circuitReportSuccess('cet-ai:grok');
        usage = { grok: res.usage ?? null };
        reply = res.choices[0]?.message?.content ?? 'CET AI is silent.';
      } catch (e) {
        circuitReportFailure('cet-ai:grok');
        throw e;
      }
    } else if (plan.providers.singleProvider === 'claude') {
      if (!claudeKey) throw new Error('Claude API key missing.');
      reply = await claudeComplete({
        apiKey: claudeKey,
        model: CLAUDE_MODEL,
        system: fullFallbackPrompt,
        conversation,
        userQuery: trimmedQuery,
        temperature: plan.temperature,
      });
    } else {
      const client = new OpenAI({
        apiKey: geminiKey!,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
      try {
        const res = await client.chat.completions.create({
          model: GEMINI_MODEL,
          messages: fullFallbackMessages,
          temperature: plan.temperature,
        });
        circuitReportSuccess('cet-ai:gemini');
        usage = { gemini: res.usage ?? null };
        reply = res.choices[0]?.message?.content ?? 'CET AI is silent.';
      } catch (e) {
        circuitReportFailure('cet-ai:gemini');
        throw e;
      }
    }
  }

  // 6. Return EXACT format expected by frontend ({ response: string })
  const planHeader =
    `agents=${plan.agentCount};` +
    `providers=${plan.providers.strategy};` +
    `onchain=${plan.useOnChain ? 1 : 0};` +
    `web=${plan.useWebRetrieval ? 1 : 0};` +
    `budget_ms=${plan.budget.budgetMs};` +
    `parallel=${plan.budget.maxParallel}`;

  const payload = { response: reply, sources: retrieval.sources, plan, usage: usage ?? {} };
  if (cacheKey) setAiChatCache(cacheKey, payload as any, cacheTtlSeconds);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Cet-Ai-Source': 'live',
      'X-Cet-Ai-Plan': planHeader,
      'X-Cet-Ai-Cache': 'miss',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin, X-Forwarded-For',
    },
  });
  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred in the CET AI core.';
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  } finally {
    await ipSlot.release();
    await globalSlot.release();
  }
}
