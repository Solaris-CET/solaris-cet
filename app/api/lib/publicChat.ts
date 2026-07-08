export const PUBLIC_CHAT_PATH = '/api/chat';
export const PUBLIC_CHAT_METHODS = 'POST, OPTIONS';

export const PUBLIC_CHAT_PROBE = {
  path: PUBLIC_CHAT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  deepseekModel: 'deepseek-v4-pro' as const,
  rateLimit: 20,
  rateWindowMs: 60 * 60 * 1000,
  maxQueryChars: 4000,
  maxConversationTurns: 5,
  maxRecentMessages: 6,
  maxTokens: 400,
  temperature: 0.7,
  emptyMessagesError: 'messages array is required and must be non‑empty' as const,
  invalidMessageShapeError: 'Each message must have role (string) and content (string)' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  rateLimitedError: 'Prea multe cereri. Încearcă mai târziu.' as const,
  suggestedQuestions: [
    'Cât costă un sistem de 5kW?',
    'Ce include prețul?',
    'Cum pot obține o ofertă personalizată?',
  ] as const,
};

export const PUBLIC_CHAT_SYSTEM_PROMPT = `Ești Solarix, asistentul digital al Solaris CET din Cetățuia, Vaslui. 
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

export const PUBLIC_CHAT_KNOWLEDGE_BASE: Record<string, string> = {
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

const INTENT_PATTERNS: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /\b(pret|preturi|cost|cat costa|cat face|tarif|ofert[ăa])\b/i, key: 'preturi' },
  { pattern: /\b(finanțare|finantare|casa verde|repowereu|fonduri|subvenții|subventii|rate|dobândă|dobanda)\b/i, key: 'finantari' },
  { pattern: /\b(acoperiș|acoperis|tabl[ăa]|țigl[ăa]|tigla|membran[ăa]|hidroizolație|hidroizolatie)\b/i, key: 'acoperisuri' },
  { pattern: /\b(contact|telefon|email|adres[ăa]|program|orar|locație|locatie)\b/i, key: 'contact' },
  { pattern: /\b(garanție|garantie|garanţie)\b/i, key: 'garantie' },
  { pattern: /\b(durat[ăa]|montaj|instalare|timp|zile)\b/i, key: 'montaj' },
  { pattern: /\b(servicii|monocristalin|policristalin|proiectare|autorizații|autorizatii|punere în funcțiune|punere in functiune)\b/i, key: 'servicii' },
];

export type PublicChatMessage = { role: string; content: string };

export function detectPublicChatIntent(userMessage: string): string | null {
  for (const { pattern, key } of INTENT_PATTERNS) {
    if (pattern.test(userMessage)) return key;
  }
  return null;
}

export function getPublicChatKnowledge(intentKey: string | null): string | null {
  if (!intentKey) return null;
  return PUBLIC_CHAT_KNOWLEDGE_BASE[intentKey] ?? null;
}

export function getPublicChatOfflineFallback(): string {
  return (
    PUBLIC_CHAT_KNOWLEDGE_BASE.contact ||
    'Momentan asistentul AI live nu este disponibil. Pentru ofertă rapidă, sună la +40 769 889 721 sau scrie la solaris-cet@protonmail.com.'
  );
}

export function normalizePublicChatConversation(raw: unknown): PublicChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is { role: string; content: string } =>
        typeof item?.role === 'string' &&
        (item.role === 'user' || item.role === 'assistant' || item.role === 'system') &&
        typeof item?.content === 'string' &&
        item.content.trim().length > 0,
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, PUBLIC_CHAT_PROBE.maxQueryChars),
    }))
    .slice(-PUBLIC_CHAT_PROBE.maxConversationTurns);
}

export function parsePublicChatPostBody(body: unknown): PublicChatMessage[] | null {
  const payload = body as {
    messages?: PublicChatMessage[];
    query?: string;
    conversation?: unknown;
  };

  let messages = Array.isArray(payload.messages) ? payload.messages : null;
  if ((!messages || messages.length === 0) && typeof payload.query === 'string' && payload.query.trim()) {
    const query = payload.query.trim().slice(0, PUBLIC_CHAT_PROBE.maxQueryChars);
    const conversation = normalizePublicChatConversation(payload.conversation);
    const lastConversationMessage = conversation[conversation.length - 1];
    messages =
      lastConversationMessage?.role === 'user' && lastConversationMessage.content === query
        ? conversation
        : [...conversation, { role: 'user', content: query }];
  }
  return messages;
}

export function validatePublicChatMessages(messages: PublicChatMessage[] | null): messages is PublicChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  return messages.every((msg) => typeof msg.role === 'string' && typeof msg.content === 'string');
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkPublicChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + PUBLIC_CHAT_PROBE.rateWindowMs });
    return true;
  }
  if (entry.count >= PUBLIC_CHAT_PROBE.rateLimit) return false;
  entry.count++;
  return true;
}

export function buildPublicChatResponse(content: string, source: 'deepseek' | 'fallback') {
  return {
    content,
    response: content,
    message: content,
    source,
    suggestedQuestions: [...PUBLIC_CHAT_PROBE.suggestedQuestions],
  };
}