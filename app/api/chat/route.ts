/**
 * Edge runtime — POST `/api/chat`
 *
 * Solaris CET AI: uses DeepSeek API for streaming chat responses.
 *
 * Expects JSON body:
 *   { messages: [{ role: 'user' | 'assistant' | 'system', content: string }] }
 *
 * Returns a JSON response with:
 *   { content: string, source: 'deepseek' | 'fallback', suggestedQuestions: string[] }
 *
 * `runtime: 'edge'` matches edge-style adapters and compatible hosts (e.g. Coolify).
 */
import OpenAI from 'openai';
import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

const DEEPSEEK_MODEL = 'deepseek-chat';
const SYSTEM_PROMPT = `Ești Solarix, asistentul digital al Solaris CET din Cetățuia, Vaslui. 
Ești cald, profesionist și vorbești în română naturală, ca un consultant.
Firma se ocupă cu: panouri fotovoltaice rezidențiale și industriale, 
acoperișuri (tablă, țiglă metalică, membrane TPO), atice și fațade tablă,
reparații și mentenanță.

INFORMAȚII FERME:
- Panouri 3kW: 15.000-25.000 RON (include montaj, fără TVA)
- Panouri 5kW: 20.000-35.000 RON
- Panouri 10kW: 35.000-60.000 RON
- Casa Verde: până la 20.000 RON finanțare AFM
- RePowerEU: până la 60% din costuri
- Garanție: 10 ani panouri, 5 ani invertor, 2 ani montaj
- Montaj: 1-3 zile rezidențial, 3-7 zile industrial
- Contact: +40 769 889 721 | solaris-cet@protonmail.com
- Program: L-V 8:00-18:00, S 9:00-14:00
- Adresă: Cetățuia, Vaslui, România

Răspunde CONCIS (max 150 cuvinte). Dacă nu știi prețul exact, 
oferă să trimiți o ofertă personalizată. Niciodată nu inventa informații.
Dacă cineva întreabă de servicii care NU sunt ale noastre, spune politicos că nu oferim acel serviciu.`;

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

// ── Rate limiter (in‑memory fallback, prefer Redis) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per hour
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  entry.count++;
  return true;
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

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: 'Prea multe cereri. Încearcă mai târziu.' }, allowedOrigin, 429);
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
    return jsonResponse({
      content: KNOWLEDGE_BASE[intentKey],
      source: 'fallback',
      suggestedQuestions: [
        'Cât costă un sistem de 5kW?',
        'Ce include prețul?',
        'Cum pot obține o ofertă personalizată?',
      ],
    }, allowedOrigin);
  }

  // ── Try DeepSeek API ──────────────────────────────────────────────────────
  const apiKey = process.env.DEEPSEEK_CHATBOT_API_KEY;
  if (!apiKey) {
    // No API key configured – fallback to knowledge base if we have a match
    if (intentKey && KNOWLEDGE_BASE[intentKey]) {
      return jsonResponse({
        content: KNOWLEDGE_BASE[intentKey],
        source: 'fallback',
        suggestedQuestions: [
          'Cât costă un sistem de 5kW?',
          'Ce include prețul?',
          'Cum pot obține o ofertă personalizată?',
        ],
      }, allowedOrigin);
    }
    return jsonResponse({ error: 'DeepSeek API key not configured' }, allowedOrigin, 500);
  }

  // Prepend system prompt and keep only last 6 messages
  const recentMessages = messages.slice(-6);
  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
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
  let responseContent = '';
  let suggestedQuestions: string[] = [];

  try {
    const completion = await client.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 400,
      stream: false,
    });

    responseContent = completion.choices?.[0]?.message?.content ?? '';
    suggestedQuestions = [
      'Cât costă un sistem de 5kW?',
      'Ce include prețul?',
      'Cum pot obține o ofertă personalizată?',
    ];
  } catch (err) {
    console.error('DeepSeek API error:', err);
    usedFallback = true;

    // ── Fallback to knowledge base on API failure ──────────────────────────
    if (intentKey && KNOWLEDGE_BASE[intentKey]) {
      responseContent = KNOWLEDGE_BASE[intentKey];
    } else {
      responseContent =
        'Momentan asistentul AI nu e disponibil. Pentru ofertă rapidă, sună la +40 769 889 721 sau scrie pe solaris-cet@protonmail.com';
    }
    suggestedQuestions = [
      'Cât costă un sistem de 5kW?',
      'Ce include prețul?',
      'Cum pot obține o ofertă personalizată?',
    ];
  }

  const elapsedMs = performance.now() - startTime;
  // Log metric (could be sent to external service)
  console.log(
    JSON.stringify({
      metric: 'chat_response',
      model: DEEPSEEK_MODEL,
      fallback: usedFallback,
      responseTimeMs: Math.round(elapsedMs),
      intentKey: intentKey ?? 'none',
    }),
  );

  return jsonResponse(
    {
      content: responseContent,
      source: usedFallback ? 'fallback' : 'deepseek',
      suggestedQuestions,
    },
    allowedOrigin,
  );
}
