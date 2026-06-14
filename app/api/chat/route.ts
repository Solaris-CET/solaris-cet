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

// ── Knowledge base ──────────────────────────────────────────────────────────
const KNOWLEDGE_BASE: Record<string, string> = {
  preturi: `**Prețuri orientative sisteme fotovoltaice** (fără TVA, include montaj):
- Sistem 3 kW: ~15.000 – 25.000 RON
- Sistem 5 kW: ~20.000 – 35.000 RON
- Sistem 10 kW: ~35.000 – 60.000 RON

Prețurile pot varia în funcție de tipul acoperișului, cablaj existent, distanță. Pentru o ofertă personalizată gratuită, contactați-ne la +40 769 889 721 sau solaris-cet@protonmail.com.`,
  finantari: `**Programe de finanțare disponibile:**

**Casa Verde** – finanțare de până la 20.000 RON, aprobare în 30–60 de zile.

**RePowerEU** – fonduri europene care acoperă până la 60% din costurile eligibile.

**Rate fără dobândă** prin parteneri bancari.

Vă putem ajuta cu întocmirea dosarului. Contactați-ne pentru detalii.`,
  acoperisuri: `**Servicii de acoperișuri:**
- Tablă zincată
- Țiglă metalică
- Membrane hidroizolante (TPO, PVC)

Prețurile se stabilesc la cerere, în funcție de suprafață și complexitate. Solicitați o ofertă la +40 769 889 721.`,
  contact: `**Date de contact Solaris CET:**
- Telefon: +40 769 889 721
- Email: solaris-cet@protonmail.com
- Adresă: Cetățuia, Vaslui, România

**Program:**
- Luni – Vineri: 08:00 – 18:00
- Sâmbătă: 09:00 – 14:00
- Duminică: închis`,
  garantie: `**Garanție oferită:**
- Panouri fotovoltaice: 10 ani
- Invertor: 5 ani
- Montaj: 2 ani

Toate echipamentele respectă standardele europene de calitate.`,
  montaj: `**Durata montajului:**
- Sisteme rezidențiale: 1–3 zile
- Sisteme comerciale/industriale: în funcție de complexitate

Echipa noastră asigură o execuție rapidă și profesionistă.`,
  servicii: `**Servicii oferite de Solaris CET:**
- Panouri fotovoltaice (monocristaline, policristaline)
- Construcții și renovări acoperișuri
- Tablă zincată, țiglă metalică, membrane hidroizolante
- Proiectare, montaj, autorizații, punere în funcțiune

Pentru detalii, contactați-ne la +40 769 889 721.`,
};

// ── Intent detection ────────────────────────────────────────────────────────
const INTENT_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /\b(pret|preturi|cost|cat costa|cat face|tarif|ofert[ăa])\b/i, key: 'preturi' },
  { pattern: /\b(finanțare|finantare|casa verde|repowereu|fonduri|subvenții|subventii|rate|dobândă|dobanda)\b/i, key: 'finantari' },
  { pattern: /\b(acoperiș|acoperis|tabl[ăa]|țigl[ăa]|tigla|membran[ăa]|hidroizolație|hidroizolatie)\b/i, key: 'acoperisuri' },
  { pattern: /\b(contact|telefon|email|adres[ăa]|program|orar|locație|locatie)\b/i, key: 'contact' },
  { pattern: /\b(garanție|garantie|garanţie)\b/i, key: 'garantie' },
  { pattern: /\b(durat[ăa]|montaj|instalare|timp|zile)\b/i, key: 'montaj' },
  { pattern: /\b(servicii|monocristalin|policristalin|proiectare|autorizații|autorizatii|punere în funcțiune|punere in functiune)\b/i, key: 'servicii' },
];

function detectIntent(userMessage: string): string | null {
  for (const { pattern, key } of INTENT_PATTERNS) {
    if (pattern.test(userMessage)) {
      return key;
    }
  }
  return null;
}

// ── Helper: return a non‑streaming JSON response ────────────────────────────
function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

// ── Main handler ────────────────────────────────────────────────────────────
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
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  // Parse body
  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = (await req.json()) as { messages?: Array<{ role: string; content: string }> };
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: 'messages array is required and must be non‑empty' }, allowedOrigin, 400);
  }

  // Validate each message
  for (const msg of messages) {
    if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
      return jsonResponse({ error: 'Each message must have role (string) and content (string)' }, allowedOrigin, 400);
    }
  }

  // ── Intent detection on the last user message ──────────────────────────────
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const intentKey = lastUserMsg ? detectIntent(lastUserMsg.content) : null;

  // If we have a direct knowledge‑base hit, return it immediately (non‑streaming)
  if (intentKey && KNOWLEDGE_BASE[intentKey]) {
    return jsonResponse({ content: KNOWLEDGE_BASE[intentKey] }, allowedOrigin);
  }

  // ── Try DeepSeek API ──────────────────────────────────────────────────────
  const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
  if (!apiKey) {
    // No API key configured – fallback to knowledge base if we have a match
    if (intentKey && KNOWLEDGE_BASE[intentKey]) {
      return jsonResponse({ content: KNOWLEDGE_BASE[intentKey] }, allowedOrigin);
    }
    return jsonResponse({ error: 'DeepSeek API key not configured' }, allowedOrigin, 500);
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

    // ── Fallback to knowledge base on API failure ──────────────────────────
    if (intentKey && KNOWLEDGE_BASE[intentKey]) {
      return jsonResponse({ content: KNOWLEDGE_BASE[intentKey] }, allowedOrigin);
    }

    // Generic fallback message
    return jsonResponse(
      {
        content:
          'Momentan asistentul AI nu e disponibil. Pentru ofertă rapidă, sună la +40 769 889 721 sau scrie pe solaris-cet@protonmail.com',
      },
      allowedOrigin,
    );
  }
}
