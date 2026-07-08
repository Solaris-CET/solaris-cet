/**
 * Edge runtime — POST `/api/chat`
 *
 * Solaris CET AI: uses DeepSeek API for streaming chat responses.
 */
import OpenAI from 'openai';

import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildPublicChatResponse,
  checkPublicChatRateLimit,
  detectPublicChatIntent,
  getPublicChatKnowledge,
  getPublicChatOfflineFallback,
  parsePublicChatPostBody,
  PUBLIC_CHAT_PROBE,
  PUBLIC_CHAT_SYSTEM_PROMPT,
  validatePublicChatMessages,
} from '../lib/publicChat';

export { PUBLIC_CHAT_PATH, PUBLIC_CHAT_PROBE } from '@/api/lib/publicChat';

export const config = { runtime: 'edge' };

function jsonResponse(
  body: unknown,
  allowedOrigin: string,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      ...(extraHeaders ?? {}),
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': PUBLIC_CHAT_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkPublicChatRateLimit(ip)) {
    return jsonResponse({ error: PUBLIC_CHAT_PROBE.rateLimitedError }, allowedOrigin, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: PUBLIC_CHAT_PROBE.invalidJsonError }, allowedOrigin, 400);
  }

  const messages = parsePublicChatPostBody(body);
  if (!validatePublicChatMessages(messages)) {
    return jsonResponse({ error: PUBLIC_CHAT_PROBE.emptyMessagesError }, allowedOrigin, 400);
  }

  for (const msg of messages) {
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return jsonResponse({ error: PUBLIC_CHAT_PROBE.invalidMessageShapeError }, allowedOrigin, 400);
    }
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const intentKey = lastUserMsg ? detectPublicChatIntent(lastUserMsg.content) : null;
  const knowledgeHit = getPublicChatKnowledge(intentKey);

  if (intentKey && knowledgeHit) {
    return jsonResponse(buildPublicChatResponse(knowledgeHit, 'fallback'), allowedOrigin, 200, { 'X-Cet-Ai-Source': 'offline' });
  }

  const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
  if (!apiKey) {
    const content = getPublicChatOfflineFallback();
    return jsonResponse(buildPublicChatResponse(content, 'fallback'), allowedOrigin, 200, { 'X-Cet-Ai-Source': 'offline' });
  }

  const recentMessages = messages.slice(-PUBLIC_CHAT_PROBE.maxRecentMessages);
  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: PUBLIC_CHAT_SYSTEM_PROMPT },
    ...recentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  const startTime = performance.now();
  let usedFallback = false;
  let responseContent: string;

  try {
    const completion = await client.chat.completions.create({
      model: PUBLIC_CHAT_PROBE.deepseekModel,
      messages: fullMessages,
      temperature: PUBLIC_CHAT_PROBE.temperature,
      max_tokens: PUBLIC_CHAT_PROBE.maxTokens,
      stream: false,
    });

    responseContent = completion.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    console.error('DeepSeek API error:', err);
    usedFallback = true;
    responseContent = knowledgeHit ?? getPublicChatOfflineFallback();
  }

  const elapsedMs = performance.now() - startTime;
  console.log(
    JSON.stringify({
      metric: 'chat_response',
      model: PUBLIC_CHAT_PROBE.deepseekModel,
      fallback: usedFallback,
      responseTimeMs: Math.round(elapsedMs),
      intentKey: intentKey ?? 'none',
    }),
  );

  return jsonResponse(
    buildPublicChatResponse(responseContent, usedFallback ? 'fallback' : 'deepseek'),
    allowedOrigin,
    200,
    { 'X-Cet-Ai-Source': usedFallback ? 'offline' : 'live' },
  );
}