/**
 * Vercel Edge Function — POST /api/chat
 *
 * Proxies queries to the OpenAI chat completions API on behalf of the
 * Solaris AI Oracle search component. Requires OPENAI_API_KEY to be set
 * as a Vercel environment variable.
 */

export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        response: 'Solaris Intelligence Offline: Missing Credentials.',
      }),
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let query: string;
  try {
    const body = (await request.json()) as { query?: string };
    query = (body.query ?? '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query is required' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      console.error('OpenAI API error:', errText);
      return new Response(JSON.stringify({ error: 'AI provider error' }), {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    const data = (await openaiRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const response = data.choices[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
