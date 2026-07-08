import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

import { getDb, schema } from '@/db/client';
import {
  AI_ASK_PROBE,
  normalizeConversation,
  parseAskAttachmentIds,
  parseAskConversationId,
  parseAskForceFresh,
  parseAskInstructions,
  parseAskMode,
  parseAskModelPreference,
  parseAskQuery,
  parseAskRevisionOfMessageId,
  parseAskTone,
  safeTrimText,
  type ConversationTurn,
} from '@/api/lib/aiAsk';
import { type AuthContext, requireAuth } from '@/api/lib/auth';
import { buildCetAiRetrievalBlock } from '@/api/lib/cetAiRetrieval';
import { acquireConcurrencySlot } from '@/api/lib/concurrencyLimit';
import { getAllowedOrigin } from '@/api/lib/cors';
import { resolveApiKey } from '@/api/lib/crypto';
import { embedText } from '@/api/lib/embeddings';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import { awardPoints } from '@/api/lib/points';
import { withUpstashRateLimit } from '@/api/lib/rateLimit';
import { decideCetAiRavPlan, deriveCetAiResourceBudget, synthesizeConsensus } from '@/api/lib/reactBrain';
import { redisGetJson, redisIncr, redisSetJson } from '@/api/lib/upstashRedis';
import { fetchOnChainContextCached, todayKeyUtc } from '@/api/lib/aiAskOnChain';
import { moderateIfConfigured } from '@/api/lib/aiAskModeration';
import { evaluateAnswerQuality, extractAssistantText, timeoutSignal } from '@/api/lib/aiAskEvaluator';
import { kbRetrieve, vectorRetrieveForUser } from '@/api/lib/aiAskRetrieval';
import { resolveAttachmentsBlock } from '@/api/lib/aiAskAttachments';
import { buildCacheKey, serveCachedResponseIfAvailable } from '@/api/lib/aiAskCache';

export { AI_ASK_PATH, AI_ASK_PROBE } from '@/api/lib/aiAsk';

export const config = { runtime: 'nodejs' };

const GEMINI_MODEL = 'gemini-2.0-flash';
const GROK_MODEL = 'grok-3-mini-beta';
const CLAUDE_MODEL = (process.env.CET_AI_CLAUDE_MODEL ?? 'claude-3-5-sonnet-20241022').trim() || 'claude-3-5-sonnet-20241022';

function jsonResponse(allowedOrigin: string, body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
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

async function claudeComplete(opts: {
  apiKey: string;
  model: string;
  system: string;
  conversation: ConversationTurn[];
  userQuery: string;
  temperature: number;
  signal: AbortSignal;
}): Promise<string> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const t of opts.conversation) messages.push({ role: t.role, content: t.content });
  messages.push({ role: 'user', content: opts.userQuery.trim() });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 1200,
      temperature: Math.max(0, Math.min(1, opts.temperature)),
      system: opts.system,
      messages,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Claude request failed (${res.status}).`);
  const payload = (await res.json()) as { content?: Array<{ type?: unknown; text?: unknown }> };
  const out =
    payload?.content
      ?.map((c) => (c && c.type === 'text' && typeof c.text === 'string' ? c.text : ''))
      .filter(Boolean)
      .join('') ?? '';
  return out;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
  }

  const limited = await withUpstashRateLimit(req, allowedOrigin, {
    keyPrefix: AI_ASK_PROBE.rateLimitKey,
    limit: AI_ASK_PROBE.rateLimit,
    windowSeconds: AI_ASK_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Invalid JSON body' }, 400);
  }

  const parsedQuery = parseAskQuery(body);
  if (!parsedQuery.ok) {
    return jsonResponse(allowedOrigin, { message: parsedQuery.message }, parsedQuery.status);
  }
  const trimmedQuery = parsedQuery.query;

  const conversationRaw =
    typeof body === 'object' && body !== null && 'conversation' in body
      ? (body as { conversation: unknown }).conversation
      : undefined;
  const conversation = normalizeConversation(conversationRaw);
  const conversationId = parseAskConversationId(body);
  const revisionOfMessageId = parseAskRevisionOfMessageId(body);
  const modelPreference = parseAskModelPreference(body);
  const tone = parseAskTone(body);
  const mode = parseAskMode(body);
  const customInstructions = parseAskInstructions(body);
  const attachmentIds = parseAskAttachmentIds(body);
  const forceFresh = parseAskForceFresh(body);

  const budget = deriveCetAiResourceBudget(req);

  const encryptionSecret = process.env.ENCRYPTION_SECRET;
  const [grokKeyRaw, geminiKeyRaw, claudeKeyRaw] = await Promise.all([
    resolveApiKey(process.env.GROK_API_KEY_ENC, process.env.GROK_API_KEY, encryptionSecret),
    resolveApiKey(process.env.GEMINI_API_KEY_ENC, process.env.GEMINI_API_KEY, encryptionSecret),
    resolveApiKey(process.env.ANTHROPIC_API_KEY_ENC, process.env.ANTHROPIC_API_KEY, encryptionSecret),
  ]);
  const grokKey = grokKeyRaw ?? null;
  const geminiKey = geminiKeyRaw ?? null;
  const claudeKey = claudeKeyRaw ?? null;
  if (!grokKey && !geminiKey && !claudeKey) {
    return jsonResponse(allowedOrigin, { message: AI_ASK_PROBE.noProviderMessage }, 500);
  }

  const moderation = await moderateIfConfigured(trimmedQuery);
  if (moderation.flagged) {
    return jsonResponse(
      allowedOrigin,
      { error: 'Query rejected by moderation policy.' },
      400,
      { 'X-Cet-Ai-Moderated': '1' },
    );
  }

  let ctx: AuthContext | null;
  try {
    const auth = await requireAuth(req);
    ctx = 'error' in auth ? null : auth;
  } catch {
    ctx = null;
  }

  const softLimitHeader: Record<string, string> = {};
  if (ctx?.user && ctx.user.role !== 'admin' && ctx.user.role !== 'premium') {
    const day = todayKeyUtc();
    const limit = 40;
    const k = `cet-ai:daily:${ctx.user.id}:${day}`;
    const n = await redisIncr(k, 60 * 60 * 36);
    if (n !== null) {
      softLimitHeader['X-Cet-Ai-Daily-Count'] = String(n);
      softLimitHeader['X-Cet-Ai-Daily-Limit'] = String(limit);
      if (n > limit) {
        softLimitHeader['X-Cet-Ai-Soft-Limit'] = '1';
      }
    }
  }

  const queryHash = sha256Hex(trimmedQuery.toLowerCase());
  const kbVersion = await redisGetJson<{ at?: string }>('cet-ai:kb:version');
  const kbV = typeof kbVersion?.at === 'string' ? kbVersion.at : '0';
  const cacheKey = buildCacheKey({ modelPreference, mode, tone, kbV, queryHash });

  const cachedResponse = await serveCachedResponseIfAvailable({
    req,
    allowedOrigin,
    ctx,
    forceFresh,
    conversation,
    trimmedQuery,
    queryHash,
    cacheKey,
    softLimitHeader,
  });
  if (cachedResponse) return cachedResponse;

  const globalSlot = await acquireConcurrencySlot(req, {
    keyPrefix: 'cet-ai-ask:global',
    keyPart: 'global',
    limit: process.env.CET_AI_ASK_MAX_CONCURRENT_GLOBAL ?? 60,
    ttlSeconds: 75,
    allowedOrigin,
    retryAfterSeconds: 2,
  });
  if (globalSlot instanceof Response) return globalSlot;

  const userSlot = await acquireConcurrencySlot(req, {
    keyPrefix: 'cet-ai-ask:user',
    keyPart: ctx?.user?.id ?? null,
    limit: process.env.CET_AI_ASK_MAX_CONCURRENT_PER_USER ?? 2,
    ttlSeconds: 75,
    allowedOrigin,
    retryAfterSeconds: 2,
  });
  if (userSlot instanceof Response) {
    await globalSlot.release();
    return userSlot;
  }

  try {
    const plan =
      modelPreference === 'grok'
        ? {
            ...decideCetAiRavPlan({
              query: trimmedQuery,
              conversationTurns: conversation.length,
              hasGemini: Boolean(geminiKey),
              hasGrok: Boolean(grokKey),
              hasClaude: Boolean(claudeKey),
              budget,
            }),
            providers: { strategy: 'single' as const, useGemini: false, useGrok: true, useClaude: false, singleProvider: 'grok' as const },
          }
        : modelPreference === 'gemini'
          ? {
              ...decideCetAiRavPlan({
                query: trimmedQuery,
                conversationTurns: conversation.length,
                hasGemini: Boolean(geminiKey),
                hasGrok: Boolean(grokKey),
                hasClaude: Boolean(claudeKey),
                budget,
              }),
              providers: { strategy: 'single' as const, useGemini: true, useGrok: false, useClaude: false, singleProvider: 'gemini' as const },
            }
          : modelPreference === 'claude'
            ? {
                ...decideCetAiRavPlan({
                  query: trimmedQuery,
                  conversationTurns: conversation.length,
                  hasGemini: Boolean(geminiKey),
                  hasGrok: Boolean(grokKey),
                  hasClaude: Boolean(claudeKey),
                  budget,
                }),
                providers: { strategy: 'single' as const, useGemini: false, useGrok: false, useClaude: true, singleProvider: 'claude' as const },
              }
          : decideCetAiRavPlan({
              query: trimmedQuery,
              conversationTurns: conversation.length,
              hasGemini: Boolean(geminiKey),
              hasGrok: Boolean(grokKey),
              hasClaude: Boolean(claudeKey),
              budget,
            });

    const onChain = plan.useOnChain ? await fetchOnChainContextCached() : null;
    const onChainBlock = onChain
      ? `\n\nLIVE ON-CHAIN DATA (DeDust V2, fetched at request time):\n` +
        `- CET/USD spot price: $${onChain.cetPriceUsd}\n` +
        `- TON/USD price: $${onChain.tonPriceUsd}\n` +
        `- Pool TVL: $${onChain.tvlUsd}\n` +
        `- 24h volume: $${onChain.volume24hUsd}`
      : '';

    const attachmentResult = await resolveAttachmentsBlock({
      attachmentIds,
      userId: ctx?.user?.id ?? null,
      allowedOrigin,
      req,
    });
    if (attachmentResult instanceof Response) return attachmentResult;
    const { attachmentsBlock, resolvedAttachmentIds } = attachmentResult;

    const retrieval = await buildCetAiRetrievalBlock(trimmedQuery, { enableWeb: plan.useWebRetrieval });
    const kb = await kbRetrieve(trimmedQuery);
    const sources = [...retrieval.sources, ...kb.sources].slice(0, 5);
    const vectorBlock = ctx?.user ? await vectorRetrieveForUser(ctx.user.id, trimmedQuery) : '';

    const multiTurnHint =
      conversation.length > 0
        ? `MULTI-TURN: Prior user/assistant messages are included below. Answer the **latest** user message ` +
          `in full; use earlier turns only for follow-up context, pronouns, and consistency.\n\n`
        : '';

    const toneLine =
      tone === 'neutral'
        ? 'TONE: Neutral, technical, concise. No jokes.'
        : tone === 'fun'
          ? 'TONE: Brand-aligned, lightly witty, but never at the expense of precision.'
          : 'TONE: Solaris CET brand voice — authoritative, precise, occasionally vivid.';

    const modeLine =
      mode === 'eli5'
        ? 'MODE: Explain like I am 5 years old. Use simple words and short sentences.'
        : mode === 'read'
          ? 'MODE: Reading mode. Format as a short article with a title and clear sections.'
          : 'MODE: Default.';

    const instructionsBlock = customInstructions
      ? `\n\nCUSTOM INSTRUCTIONS (user preference):\n${customInstructions}`
      : '';

    const sharedContext =
      multiTurnHint +
      `You are Solaris CET AI — a helpful assistant for Solaris CET and general crypto/DeFi questions.\n\n` +
      `LANGUAGE: Reply in the same language as the user's latest message.\n\n` +
      `${toneLine}\n` +
      `${modeLine}\n\n` +
      `RULES:\n` +
      `- Be accurate and explicit about uncertainty.\n` +
      `- Never invent on-chain prices, URLs, or claims.\n` +
      `- If the question is ambiguous, ask 1-2 clarifying questions.\n` +
      `- If LIVE ON-CHAIN DATA is missing, say so briefly.\n` +
      onChainBlock +
      retrieval.block +
      kb.block +
      vectorBlock +
      attachmentsBlock +
      instructionsBlock +
      (retrieval.sources.length > 0
        ? `\n\nCITATIONS:\n` +
          `- If RETRIEVAL SOURCES are present, end with:\n` +
          `  Sources: <up to 5 URLs you used>\n` +
          `- Never invent URLs. If you did not use any, write: Sources: none.\n`
        : '');

    const fullFallbackPrompt =
      sharedContext +
      `\n\nAnswer the user directly. Prefer a clear structure (short paragraphs or bullets) when helpful.\n`;

    const fullFallbackMessages = buildChatMessages(fullFallbackPrompt, trimmedQuery, conversation);

    const planHeader =
      `agents=${plan.agentCount};` +
      `providers=${plan.providers.strategy};` +
      `onchain=${plan.useOnChain ? 1 : 0};` +
      `web=${plan.useWebRetrieval ? 1 : 0};` +
      `budget_ms=${plan.budget.budgetMs};` +
      `parallel=${plan.budget.maxParallel}`;

    const t0 = Date.now();
    const deadlineMs = Math.min(18_000, Math.max(6_000, plan.budget.budgetMs));
    const deadline = Date.now() + deadlineMs;
    const remainingMs = () => Math.max(1_000, deadline - Date.now());
    let reply: string;
    let modelUsed: string;

    type ProviderKey = 'gemini' | 'grok' | 'claude';

    try {
      const generateReply = async (opts: {
        mode: 'dual' | ProviderKey;
        signal: AbortSignal;
        correction?: string;
      }): Promise<{ reply: string; modelUsed: string }> => {
        const systemWithCorrection = opts.correction
          ? `${fullFallbackPrompt}\n\nQUALITY CORRECTION (previous answer scored low; address it):\n${opts.correction}`
          : fullFallbackPrompt;
        const messages = opts.correction
          ? buildChatMessages(systemWithCorrection, trimmedQuery, conversation)
          : fullFallbackMessages;

        if (opts.mode === 'dual' && grokKey && geminiKey) {
          const [geminiResult, grokResult] = await Promise.allSettled([
            new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
              .chat.completions.create(
                { model: GEMINI_MODEL, messages, temperature: plan.temperature },
                { signal: opts.signal },
              ) as unknown as Promise<{ choices?: Array<{ message?: { content?: string | null } | null }> }>,
            new OpenAI({ apiKey: grokKey, baseURL: 'https://api.x.ai/v1' })
              .chat.completions.create(
                { model: GROK_MODEL, messages, temperature: plan.temperature },
                { signal: opts.signal },
              ) as unknown as Promise<{ choices?: Array<{ message?: { content?: string | null } | null }> }>,
          ]);

          const geminiText = geminiResult.status === 'fulfilled' ? extractAssistantText(geminiResult.value) : '';
          const grokText = grokResult.status === 'fulfilled' ? extractAssistantText(grokResult.value) : '';
          const gt = geminiText.trim();
          const xt = grokText.trim();
          if (gt && xt) {
            return {
              reply: synthesizeConsensus({ geminiReply: gt, grokReply: xt, onChainContext: onChain }),
              modelUsed: 'grok+gemini',
            };
          }
          if (gt) return { reply: gt, modelUsed: 'gemini' };
          if (xt) return { reply: xt, modelUsed: 'grok' };
          throw new Error('All AI providers failed to respond.');
        }

        const selectedProvider: ProviderKey =
          opts.mode === 'dual' ? (geminiKey ? 'gemini' : grokKey ? 'grok' : 'claude') : opts.mode;

        if (selectedProvider === 'grok') {
          if (!grokKey) throw new Error('Grok API key missing.');
          const res = await new OpenAI({ apiKey: grokKey, baseURL: 'https://api.x.ai/v1' }).chat.completions.create(
            { model: GROK_MODEL, messages, temperature: plan.temperature },
            { signal: opts.signal },
          );
          return { reply: extractAssistantText(res) || 'CET AI is silent.', modelUsed: 'grok' };
        }
        if (selectedProvider === 'gemini') {
          if (!geminiKey) throw new Error('Gemini API key missing.');
          const res = await new OpenAI({
            apiKey: geminiKey,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
          }).chat.completions.create(
            { model: GEMINI_MODEL, messages, temperature: plan.temperature },
            { signal: opts.signal },
          );
          return { reply: extractAssistantText(res) || 'CET AI is silent.', modelUsed: 'gemini' };
        }
        if (!claudeKey) throw new Error('Claude API key missing.');
        const text = await claudeComplete({
          apiKey: claudeKey,
          model: CLAUDE_MODEL,
          system: systemWithCorrection,
          conversation,
          userQuery: trimmedQuery,
          temperature: plan.temperature,
          signal: opts.signal,
        });
        return { reply: text, modelUsed: 'claude' };
      };

      const initialMode: 'dual' | ProviderKey =
        plan.providers.strategy === 'dual' ? 'dual' : plan.providers.singleProvider;

      let result = await generateReply({ mode: initialMode, signal: timeoutSignal(remainingMs()) });

      // Closed feedback loop: if quality is low, retry once with an alternate provider.
      if (ctx?.user) {
        const maxRetries = 1;
        let attempts = 0;
        while (attempts < maxRetries) {
          const evaluation = await evaluateAnswerQuality({
            query: trimmedQuery,
            answer: result.reply,
            sources,
            geminiKey,
            grokKey,
          });
          if (!evaluation || evaluation.total >= 70) break;
          const timeLeft = remainingMs();
          if (timeLeft < 2_000) break;
          const fallbackMode: ProviderKey =
            result.modelUsed === 'grok'
              ? geminiKey
                ? 'gemini'
                : claudeKey
                  ? 'claude'
                  : 'grok'
              : result.modelUsed === 'gemini'
                ? grokKey
                  ? 'grok'
                  : claudeKey
                    ? 'claude'
                    : 'gemini'
                : result.modelUsed === 'claude'
                  ? geminiKey
                    ? 'gemini'
                    : grokKey
                      ? 'grok'
                      : 'claude'
                  : 'gemini';
          const worst = Object.entries(evaluation.dimensions)
            .sort((a, b) => a[1].score - b[1].score)[0];
          const correction = worst
            ? `The previous answer scored ${evaluation.total}/100. Lowest dimension: ${worst[0]} (${worst[1].score}/100). ${worst[1].rationale ?? 'Improve this area.'}`
            : `The previous answer scored ${evaluation.total}/100. Improve accuracy, completeness, and citation discipline.`;
          result = await generateReply({
            mode: fallbackMode,
            signal: timeoutSignal(timeLeft),
            correction,
          });
          attempts++;
        }
      }

      reply = result.reply;
      modelUsed = result.modelUsed;
    } catch (err) {
      modelUsed = 'unknown';
      const msg = err instanceof Error ? err.message : 'AI providers failed.';
      return jsonResponse(
        allowedOrigin,
        { error: msg },
        502,
        { 'X-Cet-Ai-Source': 'live', 'X-Cet-Ai-Plan': planHeader, 'X-Cet-Ai-Model': modelUsed, ...softLimitHeader },
      );
    }

    const responseText = (reply ?? '').trim();
    const latencyMs = Date.now() - t0;

    if (conversation.length === 0) {
      const hit = await redisIncr(`cet-ai:faq-count:${queryHash}`, 60 * 60 * 24 * 14);
      const shouldCache = hit !== null ? hit >= 2 : true;
      if (shouldCache && !forceFresh) {
        void redisSetJson(cacheKey, { response: responseText, sources, modelUsed }, 60 * 60 * 24 * 7);
      }
    }

    if (ctx?.user) {
      try {
        const db = getDb();
        const evaluation = await evaluateAnswerQuality({ query: trimmedQuery, answer: responseText, sources, geminiKey, grokKey });
        let convId: string | null = null;
        if (conversationId) {
          const [c] = await db
            .select({ id: schema.aiConversations.id })
            .from(schema.aiConversations)
            .where(eq(schema.aiConversations.id, conversationId));
          convId = c?.id ?? null;
        }
        if (!convId) {
          const [created] = await db
            .insert(schema.aiConversations)
            .values({
              userId: ctx.user.id,
              title: safeTrimText(trimmedQuery, 80),
              modelPreference: modelPreference,
              customInstructions: customInstructions || null,
              tone,
              lastMessageAt: new Date(),
            })
            .returning({ id: schema.aiConversations.id });
          convId = created?.id ?? null;
        } else {
          await db
            .update(schema.aiConversations)
            .set({
              updatedAt: new Date(),
              lastMessageAt: new Date(),
              modelPreference,
              tone,
              customInstructions: customInstructions || null,
            })
            .where(eq(schema.aiConversations.id, convId));
        }

        let userMessageId: string | null = null;
        let assistantMessageId: string | null = null;
        if (convId) {
          const [um] = await db
            .insert(schema.aiMessages)
            .values({ conversationId: convId, role: 'user', content: trimmedQuery })
            .returning({ id: schema.aiMessages.id });
          userMessageId = um?.id ?? null;
          if (userMessageId && resolvedAttachmentIds.length > 0) {
            await db.insert(schema.aiMessageAttachments).values(
              resolvedAttachmentIds.map((attachmentId) => ({ messageId: userMessageId!, attachmentId })),
            );
          }
          const [am] = await db
            .insert(schema.aiMessages)
            .values({
              conversationId: convId,
              role: 'assistant',
              content: responseText,
              revisionOf: revisionOfMessageId,
            })
            .returning({ id: schema.aiMessages.id });
          assistantMessageId = am?.id ?? null;
        }

        const [log] = await db
          .insert(schema.aiQueryLogs)
          .values({
            userId: ctx.user.id,
            ipHash: sha256Hex((req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0]!.trim()),
            query: trimmedQuery,
            queryHash,
            model: modelUsed,
            plan: planHeader,
            source: 'live',
            latencyMs,
            usedCache: false,
            moderationFlagged: false,
            responseHash: sha256Hex(responseText),
            qualityScore: evaluation ? evaluation.total : null,
            evalModel: evaluation ? evaluation.model : null,
            evalLatencyMs: evaluation ? evaluation.latencyMs : null,
          })
          .returning({ id: schema.aiQueryLogs.id });
        const queryLogId = log?.id ?? null;
        const docText = safeTrimText(`${trimmedQuery}\n\n${responseText}`, 3000);
        const docEmb = await embedText(docText);
        await db.insert(schema.aiVectorDocs).values({
          userId: ctx.user.id,
          kind: 'qa',
          text: docText,
          embedding: docEmb.vector as unknown as object,
          meta: { modelUsed, embeddingProvider: docEmb.provider, embeddingModel: docEmb.model },
        });

        await awardPoints(db, ctx.user.id, 1, 'ai', {
          dedupeKey: `ai:${todayKeyUtc()}:${queryHash}`,
          meta: { activity: 'ai_ask', day: todayKeyUtc(), queryHash },
        });

        return jsonResponse(
          allowedOrigin,
          {
            response: responseText,
            sources,
            usedCache: false,
            modelUsed,
            conversationId: convId,
            userMessageId,
            assistantMessageId,
            queryLogId,
          },
          200,
          {
            'X-Cet-Ai-Source': 'live',
            'X-Cet-Ai-Plan': planHeader,
            'X-Cet-Ai-Model': modelUsed,
            ...softLimitHeader,
          },
        );
      } catch {
        void 0;
      }
    }

    return jsonResponse(
      allowedOrigin,
      { response: responseText, sources, usedCache: false, modelUsed },
      200,
      { 'X-Cet-Ai-Source': 'live', 'X-Cet-Ai-Plan': planHeader, 'X-Cet-Ai-Model': modelUsed, ...softLimitHeader },
    );
  } finally {
    await userSlot.release();
    await globalSlot.release();
  }
}
