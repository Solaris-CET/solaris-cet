/**
 * Edge — POST `/api/chat` (OpenAI-only fallback path).
 *
 * **Production CET AI** (Grok × Gemini, RAV, DeDust context) lives in
 * `app/api/chat/route.ts`. Prefer deploying with **`app/` as the build root**
 * (Coolify, Vercel, etc.) so that route ships. This file exists for deployments
 * that use the **repository root** as the deploy root; see `api/README.md`.
 *
 * Env: `OPENAI_API_KEY`
 */
import { corsJsonHeaders, corsPreflightHeaders, getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

/** Keep in sync with `app/src/lib/cetAiConstants.ts` (`CET_AI_MAX_QUERY_CHARS`). */
const MAX_QUERY_LENGTH = 8_000;

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

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
    out.push({ role, content: c.slice(0, MAX_QUERY_LENGTH) });
  }
  return out;
}

const SYSTEM_PROMPT_BASE =
  'You are Solaris AI, an intelligent assistant for the Solaris CET token ' +
  'project on the TON blockchain. Solaris CET has a fixed supply of 9,000 CET ' +
  'and a 90-year mining horizon. It uses the BRAID Framework for verifiable AI ' +
  'decision loops and the ReAct Protocol for autonomous agent orchestration. ' +
  'Answer questions about the project concisely and accurately.';

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsPreflightHeaders(allowedOrigin) });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: corsJsonHeaders(allowedOrigin),
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        response:
          'Solaris Intelligence Offline: Missing Credentials.',
      }),
      { status: 503, headers: corsJsonHeaders(allowedOrigin) },
    );
  }

  let query: string;
  let conversation: ConversationTurn[] = [];
  try {
    const body = (await request.json()) as { query?: string; conversation?: unknown };
    query = (body.query ?? '').trim();
    conversation = normalizeConversation(body.conversation);
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid request body' }), {
      status: 400,
      headers: corsJsonHeaders(allowedOrigin),
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ message: 'Query is required' }), {
      status: 400,
      headers: corsJsonHeaders(allowedOrigin),
    });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return new Response(
      JSON.stringify({ message: `Query must be at most ${MAX_QUERY_LENGTH} characters` }),
      {
        status: 400,
        headers: corsJsonHeaders(allowedOrigin),
      },
    );
  }

  try {
    const openaiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              (conversation.length > 0
                ? 'MULTI-TURN: Prior user/assistant messages are included. Answer the latest user message in full; use earlier turns for follow-up context only.\n\n'
                : '') + SYSTEM_PROMPT_BASE,
          },
          ...conversation.map((t) => ({ role: t.role, content: t.content })),
          { role: 'user', content: query },
        ],
        max_tokens: 512,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errText.slice(0, 200));
      return new Response(JSON.stringify({ message: 'AI provider error' }), {
        status: 502,
        headers: corsJsonHeaders(allowedOrigin),
      });
    }

    const data = (await openaiRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const response = data.choices[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: {
        ...corsJsonHeaders(allowedOrigin),
        'X-Cet-Ai-Source': 'live',
      },
    });
  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: corsJsonHeaders(allowedOrigin),
    });
  }
}
