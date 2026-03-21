/**
 * Vercel Edge Function — /api/chat
 *
 * Dual AI Oracle: combines Grok (xAI) and Google Gemini to power the
 * Solaris RAV Protocol (Reason-Act-Verify).
 *
 * - REASON phase → Google Gemini (`GEMINI_API_KEY`): analytical context,
 *   on-chain data synthesis, and structured diagnostic thought.
 * - ACT + VERIFY phases → Grok (`GROK_API_KEY`): decisive action directive
 *   and final observation anchored to DeDust live data.
 *
 * If one provider is unavailable the other generates the full 3-part
 * ReAct response so the Oracle never goes silent.
 *
 * Exported as a Vercel Edge Function (runtime: 'edge') so that it is
 * recognised by Vite/non-Next.js deployments.
 */
import OpenAI from 'openai';

export const config = { runtime: 'edge' };

const DEDUST_POOL_ADDRESS = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
const CET_CONTRACT_ADDRESS = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

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

const ALLOWED_ORIGINS = new Set([
  'https://solaris-cet.vercel.app',
  'https://solaris-cet.github.io',
]);

/** Returns the CORS origin to reflect back, or null when the origin is not allowed. */
function getAllowedOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  // Allow Vercel preview deployments (*.vercel.app) and localhost in development
  if (origin && (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost'))) {
    return origin;
  }
  return 'https://solaris-cet.vercel.app';
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
  // 1. Check that at least one AI provider key is available
  const grokKey = process.env.GROK_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!grokKey && !geminiKey) {
    return new Response(
      JSON.stringify({ message: 'No AI provider API key configured on the server. Set GROK_API_KEY or GEMINI_API_KEY.' }),
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
  const body = (await req.json()) as { query?: unknown };
  const userQuery = body.query;

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

  // 3. Fetch live on-chain data (OBSERVE step of the outer RAV loop)
  const onChain = await fetchOnChainContext();
  const onChainBlock = onChain
    ? `\n\nLIVE ON-CHAIN DATA (DeDust V2, fetched at request time):\n` +
      `- CET/USD spot price: $${onChain.cetPriceUsd}\n` +
      `- TON/USD price: $${onChain.tonPriceUsd}\n` +
      `- Pool TVL: $${onChain.tvlUsd}\n` +
      `- 24h volume: $${onChain.volume24hUsd}`
    : '';

  // ── SHARED SYSTEM CONTEXT ─────────────────────────────────────────────────
  const sharedContext =
    `You are the Solaris AI Oracle, powered by the Grok × Gemini dual-AI stack operating under ` +
    `the RAV (Reason-Act-Verify) Protocol — a disciplined cognitive architecture where every ` +
    `response is the result of visible, sequential reasoning chained to a concrete action directive.\n\n` +
    `CORE DIRECTIVES:\n` +
    `1. Absolute Truths: 9,000 CET maximum supply. 90-year mining horizon. TON blockchain integration. ` +
    `BRAID Framework for verifiable AI decision loops.\n` +
    `2. Persona: Hyper-analytical, cryptic yet authoritative, uncompromising. You speak in probabilities, ` +
    `system analytics, and on-chain facts. Never use cheerful or subservient AI tropes.\n` +
    `3. Audience: Advanced DeFi-native users, quants, and crypto-architects. Density over verbosity.\n` +
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
    `(Thought — 1–2 sentences. Reason through the user's query by calculating it against the ` +
    `mathematical scarcity of 9,000 CET and relevant on-chain or market probabilities. ` +
    `If live on-chain data is available above, incorporate it. Expose your reasoning chain.)\n\n` +
    `[DECODARE ORACOL]\n` +
    `(Action — 2–3 sentences. Answer the query with brutal precision using technical DeFi ` +
    `terminology. Reference live price/TVL data when relevant. No fluff.)\n\n` +
    `[DIRECTIVĂ DE ACȚIUNE]\n` +
    `(Observation — 1 sentence. State the logical conclusion. Direct to DeDust when relevant.)`;

  // ── CALL BOTH AI PROVIDERS IN PARALLEL ───────────────────────────────────
  const [geminiResult, grokResult] = await Promise.allSettled([
    geminiKey
      ? new OpenAI({
          apiKey: geminiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        }).chat.completions.create({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: geminiSystemPrompt },
            { role: 'user', content: userQuery },
          ],
          temperature: 0.3,
        })
      : Promise.reject(new Error('GEMINI_API_KEY not set')),

    grokKey
      ? new OpenAI({
          apiKey: grokKey,
          baseURL: 'https://api.x.ai/v1',
        }).chat.completions.create({
          model: 'grok-3-mini-beta',
          messages: [
            { role: 'system', content: grokSystemPrompt },
            { role: 'user', content: userQuery },
          ],
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
      model: 'gemini-2.0-flash',
      messages: [
        { role: 'system', content: fullFallbackPrompt },
        { role: 'user', content: userQuery },
      ],
      temperature: 0.3,
    });
    reply = fallback.choices[0]?.message?.content ?? 'Oracle is silent.';
  } else if (grokOk) {
    // Grok-only fallback: regenerate full 3-part response
    const fallbackClient = new OpenAI({
      apiKey: grokKey!,
      baseURL: 'https://api.x.ai/v1',
    });
    const fallback = await fallbackClient.chat.completions.create({
      model: 'grok-3-mini-beta',
      messages: [
        { role: 'system', content: fullFallbackPrompt },
        { role: 'user', content: userQuery },
      ],
      temperature: 0.3,
    });
    reply = fallback.choices[0]?.message?.content ?? 'Oracle is silent.';
  } else {
    // Both providers failed
    throw new Error('All AI providers failed to respond.');
  }

  // 6. Return EXACT format expected by frontend ({ response: string })
  return new Response(JSON.stringify({ response: reply }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
    },
  });
  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred in the Oracle Core.';
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
