/**
 * Edge runtime — POST `/api/chat`
 *
 * Solaris CET AI: uses DeepSeek API for streaming chat responses.
 *
 * Expects JSON body:
 *   { messages: [{ role: 'user' | 'assistant' | 'system', content: string }] }
 *
 * Returns a streaming response (text/event-stream) with the DeepSeek output.
 *
 * `runtime: 'edge'` matches edge-style adapters and compatible hosts (e.g. Coolify).
 */import OpenAI from 'openai';

import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

const DEEPSEEK_MODEL = 'deepseek-chat';
const SYSTEM_PROMPT = `You are Solaris CET AI — a helpful assistant for Solaris CET, a Romania‑based company delivering photovoltaic installations, construction works, roofing (metal sheet / metal tiles / TPO membrane), metal parapets and facades, plus repairs and maintenance.

You also answer general crypto/DeFi questions related to the Solaris CET token (CET) and the TON blockchain.

Rules:
- Be accurate and explicit about uncertainty.
- Never invent URLs or claims.
- If the question is ambiguous, ask 1‑2 clarifying questions.
- Reply in the same language as the user's latest message.`;

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  // CORS preflight
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

  // Parse body
  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = (await req.json()) as { messages?: Array<{ role: string; content: string }> };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array is required and must be non‑empty' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  }

  // Validate each message
  for (const msg of messages) {
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return new Response(JSON.stringify({ error: 'Each message must have role (string) and content (string)' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          'Vary': 'Origin',
        },
      });
    }
  }

  const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DeepSeek API key not configured' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  }

  // Prepend system prompt
  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  try {
    const stream = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: fullMessages,
      stream: true,
    });

    // Build a ReadableStream that emits SSE‑formatted data
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              const data = `data: ${JSON.stringify({ content: delta })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          // If the stream errors, send an error event and close
          const errorData = `data: ${JSON.stringify({ error: 'Stream error' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  } catch (err) {
    console.error('DeepSeek API error:', err);
    return new Response(JSON.stringify({ error: 'Failed to get response from DeepSeek' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Vary': 'Origin',
      },
    });
  }
}
