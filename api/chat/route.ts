/**
 * Vercel Edge — POST `/api/chat` (OpenAI-only fallback path).
 *
 * **Production Oracle** (Grok × Gemini, RAV, DeDust context) lives in
 * `app/api/chat/route.ts`. Configure the Vercel project **Root Directory** to
 * `app` so that route is the one that ships. This file exists for deployments
 * that use the repository root as the Vercel root; see `api/README.md`.
 *
 * Env: `OPENAI_API_KEY`
 */
import { corsJsonHeaders, corsPreflightHeaders, getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

const MAX_QUERY_LENGTH = 8_000;

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

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
  try {
    const body = (await request.json()) as { query?: string };
    query = (body.query ?? '').trim();
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
              'You are Solaris AI, an intelligent assistant for the Solaris CET token ' +
              'project on the TON blockchain. Solaris CET has a fixed supply of 9,000 CET ' +
              'and a 90-year mining horizon. It uses the BRAID Framework for verifiable AI ' +
              'decision loops and the ReAct Protocol for autonomous agent orchestration. ' +
              'Answer questions about the project concisely and accurately.',
          },
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
      headers: corsJsonHeaders(allowedOrigin),
    });
  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: corsJsonHeaders(allowedOrigin),
    });
  }
}
