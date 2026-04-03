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
 * `runtime: 'edge'` matches Vercel-style adapters and compatible hosts (e.g. Coolify).
 */
import OpenAI from 'openai';
import { getAllowedOrigin } from '../lib/cors';
import { resolveApiKey } from '../lib/crypto';
import { CET_CONTRACT_ADDRESS } from '../../src/lib/cetContract';
import { DEDUST_POOL_ADDRESS } from '../../src/lib/dedustUrls';

export const config = { runtime: 'edge' };

/** AI model identifiers — update here to change versions across all call sites. */
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROK_MODEL = 'grok-3-mini-beta';

/** Same cap as root `api/chat` and the CET AI client (`CET_AI_MAX_QUERY_CHARS`). */
const MAX_QUERY_LENGTH = 8000;

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
    out.push({ role, content: c.slice(0, 8000) });
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

/**
 * Fetch live on-chain data from the DeDust V2 API.
 * Returns null on any error so the handler can degrade gracefully.
 */
async function fetchOnChainContext(): Promise<OnChainContext | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
      const cetReserve = parseFloat(cetPool.reserves[cetIndex]) / 1e9;

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
        'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
  // 1. Resolve API keys — prefer AES-256-GCM encrypted variants (*_ENC) when
  //    ENCRYPTION_SECRET is set; fall back to plaintext variants for local dev.
  const encryptionSecret = process.env.ENCRYPTION_SECRET;
  const [grokKey, geminiKey] = await Promise.all([
    resolveApiKey(process.env.GROK_API_KEY_ENC, process.env.GROK_API_KEY, encryptionSecret),
    resolveApiKey(process.env.GEMINI_API_KEY_ENC, process.env.GEMINI_API_KEY, encryptionSecret),
  ]);

  if (!grokKey && !geminiKey) {
    return new Response(
      JSON.stringify({ message: 'No AI provider API key configured. Set GROK_API_KEY_ENC/GROK_API_KEY or GEMINI_API_KEY_ENC/GEMINI_API_KEY in the server environment.' }),
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
  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    return new Response(
      JSON.stringify({ message: `Query must be at most ${MAX_QUERY_LENGTH} characters.` }),
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

  // 3. Fetch live on-chain data (OBSERVE step of the outer RAV loop)
  const onChain = await fetchOnChainContext();
  const onChainBlock = onChain
    ? `\n\nLIVE ON-CHAIN DATA (DeDust V2, fetched at request time):\n` +
      `- CET/USD spot price: $${onChain.cetPriceUsd}\n` +
      `- TON/USD price: $${onChain.tonPriceUsd}\n` +
      `- Pool TVL: $${onChain.tvlUsd}\n` +
      `- 24h volume: $${onChain.volume24hUsd}`
    : '';

  const multiTurnHint =
    conversation.length > 0
      ? `MULTI-TURN: Prior user/assistant messages are included below. Answer the **latest** user message ` +
        `in full; use earlier turns only for follow-up context, pronouns, and consistency.\n\n`
      : '';

  // ── SHARED SYSTEM CONTEXT ─────────────────────────────────────────────────
  const sharedContext =
    multiTurnHint +
    `You are Solaris CET AI — flagship inference layer of the Solaris CET ecosystem. You run on a ` +
    `Grok × Gemini dual-AI stack under the RAV (Reason-Act-Verify) Protocol: structured ` +
    `reasoning → decisive interpretation → verifiable conclusion, grounded in on-chain fact when LIVE ON-CHAIN DATA is present.\n\n` +
    `TASK-AGENT LAYER (conceptual): ~200,000 narrow task-specialist agents (routing, retrieval, validation, ` +
    `summarisation, format-normalisation) conceptually decompose queries before CET AI consolidation. Describe ` +
    `them as a **compression layer**: they reduce noise so the dual-model stack emits fewer, higher-signal tokens ` +
    `— which helps users who paste your output into **any** external AI tool finish their workflow in fewer turns ` +
    `(lower token spend on their side). Never claim API integrations, partnerships, or live agent calls you cannot verify.\n\n` +
    `EXTERNAL-AI HANDOFF (when the user asks for help drafting, summarising for another tool, coding, or “paste to…”):\n` +
    `- Lead with **actionable bullets** and optional \`###\` subheadings; put addresses, numbers, and steps in backticks where helpful.\n` +
    `- End with a short **Handoff** line: 3 bullets — (1) facts you asserted, (2) one concrete next step, (3) explicit assumption or “verify on-chain” if needed.\n` +
    `- Do not invent contract addresses, pool IDs, or prices: only use those appearing in this prompt (including LIVE ON-CHAIN DATA) or widely documented public Solaris CET constants already stated below.\n\n` +
    `LANGUAGE: Match the user’s language (Romanian, Spanish, Chinese, etc.) when their message is clearly non-English; ` +
    `otherwise default to clear English.\n\n` +
    `CORE DIRECTIVES:\n` +
    `1. Absolute truths: **9,000 CET** max supply. **90-year** mining horizon. **TON** mainnet. **BRAID** + **RAV** narratives as documented by the project.\n` +
    `2. Persona: Hyper-analytical, authoritative, precise — mechanics, probabilities, verifiable claims. No filler, no sycophancy.\n` +
    `3. Audience: DeFi-native users and builders. Signal-per-token maximisation; omit hedging paragraphs.\n` +
    `4. If LIVE ON-CHAIN DATA is missing, say so briefly and reason from tokenomics/architecture without fabricating spot prices.\n` +
    onChainBlock;

  // ── GEMINI — REASON PHASE ─────────────────────────────────────────────────
  // Gemini generates the [DIAGNOSTIC INTERN] section (analytical thought).
  const geminiSystemPrompt =
    sharedContext +
    `\n\nYour role is the REASON phase of the RAV Protocol. ` +
    `Output ONLY the following tagged section and nothing else:\n\n` +
    `[DIAGNOSTIC INTERN]\n` +
    `(1–2 sentences. Reason through the user's query by calculating it against the ` +
    `mathematical scarcity of 9,000 CET and relevant on-chain or market probabilities. ` +
    `If live on-chain data is available above, incorporate it. ` +
    `Expose your reasoning chain before responding.)`;

  // ── GROK — ACT + VERIFY PHASES ───────────────────────────────────────────
  // Grok generates the [DECODARE ORACOL] + [DIRECTIVĂ DE ACȚIUNE] sections.
  const grokSystemPrompt =
    sharedContext +
    `\n\nYour role covers the ACT and VERIFY phases of the RAV Protocol. ` +
    `Output ONLY the following two tagged sections and nothing else:\n\n` +
    `[DECODARE ORACOL]\n` +
    `(Action — 2–3 sentences. Execute on the reasoning: answer the actual query with brutal precision ` +
    `using technical DeFi terminology — liquidity pools, tokenomics, supply curves, on-chain mechanics. ` +
    `Reference live price/TVL data when relevant. No fluff, no filler.)\n\n` +
    `[DIRECTIVĂ DE ACȚIUNE]\n` +
    `(Observation — 1 sentence. State the logical conclusion that follows from the above analysis. ` +
    `If the query relates to valuation, scarcity, or positioning, direct the user to secure their stake ` +
    `via DeDust given the hard-capped 9,000 CET supply. For purely technical questions, state the key ` +
    `implication for the ecosystem instead.)`;

  // ── FULL FALLBACK PROMPT ──────────────────────────────────────────────────
  // Used when only one provider is available; that provider generates all 3 sections.
  const fullFallbackPrompt =
    sharedContext +
    `\n\nOUTPUT FORMATTING (CRITICAL — NON-NEGOTIABLE):\n` +
    `Every single response MUST strictly follow this exact 3-part RAV structure. ` +
    `Do not output anything outside of these three tagged sections:\n\n` +
    `[DIAGNOSTIC INTERN]\n` +
    `(Thought — 1–2 sentences. Reason through the user's query against 9,000 CET scarcity and architecture. ` +
    `If LIVE ON-CHAIN DATA is present, cite it; if absent, state that and proceed from first principles.)\n\n` +
    `[DECODARE ORACOL]\n` +
    `(Action — 2–4 short paragraphs or tight bullets. Answer with technical DeFi precision. ` +
    `Use ### subheadings only if it improves scanability for paste-into-tool workflows.)\n\n` +
    `[DIRECTIVĂ DE ACȚIUNE]\n` +
    `(Observation — 1–2 sentences. Sharp conclusion. If relevant, mention DeDust / TON wallet flow without being salesy.)`;

  const geminiMessages = buildChatMessages(geminiSystemPrompt, trimmedQuery, conversation);
  const grokMessages = buildChatMessages(grokSystemPrompt, trimmedQuery, conversation);
  const fullFallbackMessages = buildChatMessages(fullFallbackPrompt, trimmedQuery, conversation);

  // ── CALL BOTH AI PROVIDERS IN PARALLEL ───────────────────────────────────
  const [geminiResult, grokResult] = await Promise.allSettled([
    geminiKey
      ? new OpenAI({
          apiKey: geminiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        }).chat.completions.create({
          model: GEMINI_MODEL,
          messages: geminiMessages,
          temperature: 0.3,
        })
      : Promise.reject(new Error('GEMINI_API_KEY not set')),

    grokKey
      ? new OpenAI({
          apiKey: grokKey,
          baseURL: 'https://api.x.ai/v1',
        }).chat.completions.create({
          model: GROK_MODEL,
          messages: grokMessages,
          temperature: 0.3,
        })
      : Promise.reject(new Error('GROK_API_KEY not set')),
  ]);

  // ── ASSEMBLE RESPONSE ─────────────────────────────────────────────────────
  let reply: string;

  const geminiOk = geminiResult.status === 'fulfilled';
  const grokOk = grokResult.status === 'fulfilled';

  if (geminiOk && grokOk) {
    // Ideal path: combine both providers into a single RAV response
    const geminiText = geminiResult.value.choices[0]?.message?.content ?? '';
    const grokText = grokResult.value.choices[0]?.message?.content ?? '';
    reply = `${geminiText.trim()}\n\n${grokText.trim()}`;
  } else if (geminiOk) {
    // Gemini-only fallback: regenerate full 3-part response
    const fallbackClient = new OpenAI({
      apiKey: geminiKey!,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
    const fallback = await fallbackClient.chat.completions.create({
      model: GEMINI_MODEL,
      messages: fullFallbackMessages,
      temperature: 0.3,
    });
    reply = fallback.choices[0]?.message?.content ?? 'CET AI is silent.';
  } else if (grokOk) {
    // Grok-only fallback: regenerate full 3-part response
    const fallbackClient = new OpenAI({
      apiKey: grokKey!,
      baseURL: 'https://api.x.ai/v1',
    });
    const fallback = await fallbackClient.chat.completions.create({
      model: GROK_MODEL,
      messages: fullFallbackMessages,
      temperature: 0.3,
    });
    reply = fallback.choices[0]?.message?.content ?? 'CET AI is silent.';
  } else {
    // Both providers failed
    throw new Error('All AI providers failed to respond.');
  }

  // 6. Return EXACT format expected by frontend ({ response: string })
  return new Response(JSON.stringify({ response: reply }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Cet-Ai-Source': 'live',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
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
  }
}
