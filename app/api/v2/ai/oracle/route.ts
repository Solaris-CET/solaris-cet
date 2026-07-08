import OpenAI from 'openai';

import { buildCetAiRetrievalBlock } from '@/api/lib/cetAiRetrieval';
import { resolveApiKey } from '@/api/lib/crypto';
import { requirePublicApiKey } from '@/api/lib/publicApiAuth';
import { recordPublicApiUsage } from '@/api/lib/publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from '@/api/lib/publicApiResponse';
import { decideCetAiRavPlan, deriveCetAiResourceBudget, synthesizeConsensus } from '@/api/lib/reactBrain';
import { redisGetJson, redisIncr, redisSetJson } from '@/api/lib/upstashRedis';
import {
  buildOracleCachedResponse,
  buildOracleCacheKey,
  buildOracleChatMessages,
  buildOraclePlanHeader,
  buildOraclePublicCountKey,
  buildOracleSuccessResponse,
  buildOracleSystemPrompt,
  extractOracleAssistantText,
  oracleKbRetrieve,
  oracleTimeoutSignal,
  parseOracleRequestBody,
  V2_AI_ORACLE_PROBE,
} from '../../../lib/v2AiOracle';

export { V2_AI_ORACLE_PATH, V2_AI_ORACLE_PROBE } from '@/api/lib/v2AiOracle';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const start = Date.now();
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, V2_AI_ORACLE_PROBE.methods.join(', '), 'Content-Type, Authorization, X-API-Key');
  }
  if (req.method !== 'POST') return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');

  const auth = await requirePublicApiKey(req);
  if (auth instanceof Response) {
    await recordPublicApiUsage({
      apiKeyId: null,
      userId: null,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status: auth.status,
      latencyMs: Date.now() - start,
    });
    return auth;
  }

  const d = decideRateLimit({
    req,
    bucket: V2_AI_ORACLE_PROBE.rateLimitBucket,
    keyPart: auth.apiKeyId,
    limit: V2_AI_ORACLE_PROBE.rateLimit,
    windowSeconds: V2_AI_ORACLE_PROBE.rateWindowSeconds,
  });
  if (!d.ok) {
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status: 429,
      latencyMs: Date.now() - start,
    });
    return rateLimitedResponsePublic(req, d);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res = errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status: 400,
      latencyMs: Date.now() - start,
    });
    return res;
  }

  const parsed = parseOracleRequestBody(body);
  if (!parsed.ok) {
    const res = errorResponsePublic(req, parsed.status, 'invalid_request', parsed.message);
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status: parsed.status,
      latencyMs: Date.now() - start,
    });
    return res;
  }

  const { query: trimmedQuery, conversation, forceFresh, modelPreference } = parsed;

  const encryptionSecret = process.env.ENCRYPTION_SECRET;
  const [grokKey, geminiKey] = await Promise.all([
    resolveApiKey(process.env.GROK_API_KEY_ENC, process.env.GROK_API_KEY, encryptionSecret),
    resolveApiKey(process.env.GEMINI_API_KEY_ENC, process.env.GEMINI_API_KEY, encryptionSecret),
  ]);
  if (!grokKey && !geminiKey) {
    const res = errorResponsePublic(req, 500, 'not_configured', V2_AI_ORACLE_PROBE.noProviderMessage);
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status: 500,
      latencyMs: Date.now() - start,
    });
    return res;
  }

  const budget = deriveCetAiResourceBudget(req);
  const plan =
    modelPreference === 'grok'
      ? {
          ...decideCetAiRavPlan({
            query: trimmedQuery,
            conversationTurns: conversation.length,
            hasGemini: Boolean(geminiKey),
            hasGrok: Boolean(grokKey),
            hasClaude: false,
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
              hasClaude: false,
              budget,
            }),
            providers: { strategy: 'single' as const, useGemini: true, useGrok: false, useClaude: false, singleProvider: 'gemini' as const },
          }
        : decideCetAiRavPlan({
            query: trimmedQuery,
            conversationTurns: conversation.length,
            hasGemini: Boolean(geminiKey),
            hasGrok: Boolean(grokKey),
            hasClaude: false,
            budget,
          });

  const kbVersion = await redisGetJson<{ at?: string }>('cet-ai:kb:version');
  const kbV = typeof kbVersion?.at === 'string' ? kbVersion.at : '0';
  const cacheKey = buildOracleCacheKey(modelPreference, kbV, trimmedQuery);

  if (!forceFresh && conversation.length === 0) {
    const cached = await redisGetJson<{ response: string; sources: unknown; modelUsed: string }>(cacheKey);
    if (cached?.response && typeof cached.response === 'string') {
      const status = 200;
      await recordPublicApiUsage({
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        method: req.method,
        path: V2_AI_ORACLE_PROBE.path,
        status,
        latencyMs: Date.now() - start,
      });
      return jsonResponsePublic(req, buildOracleCachedResponse(cached, trimmedQuery), status, {
        ...rateLimitHeaders(d),
        'X-Cet-Ai-Model': cached.modelUsed,
        'X-Cet-Ai-Used-Cache': '1',
      });
    }
  }

  const retrieval = await buildCetAiRetrievalBlock(trimmedQuery, { enableWeb: plan.useWebRetrieval });
  const kb = await oracleKbRetrieve(trimmedQuery);
  const systemPrompt = buildOracleSystemPrompt(retrieval.block, kb.block);
  const messages = buildOracleChatMessages(systemPrompt, trimmedQuery, conversation);
  const planHeader = buildOraclePlanHeader(plan);

  const t0 = Date.now();
  const signal = oracleTimeoutSignal(Math.min(18_000, Math.max(6_000, plan.budget.budgetMs)));
  let reply: string;
  let modelUsed: string;

  try {
    if (plan.providers.strategy === 'dual' && grokKey && geminiKey) {
      const [geminiResult, grokResult] = await Promise.allSettled([
        new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.geminiModel, messages, temperature: plan.temperature }, { signal }) as unknown as Promise<{
          choices?: Array<{ message?: { content?: string | null } | null }>;
        }>,
        new OpenAI({ apiKey: grokKey, baseURL: 'https://api.x.ai/v1' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.grokModel, messages, temperature: plan.temperature }, { signal }) as unknown as Promise<{
          choices?: Array<{ message?: { content?: string | null } | null }>;
        }>,
      ]);

      const geminiText = geminiResult.status === 'fulfilled' ? extractOracleAssistantText(geminiResult.value) : '';
      const grokText = grokResult.status === 'fulfilled' ? extractOracleAssistantText(grokResult.value) : '';
      const gt = geminiText.trim();
      const xt = grokText.trim();
      if (gt && xt) {
        reply = synthesizeConsensus({ geminiReply: gt, grokReply: xt });
        modelUsed = 'grok+gemini';
      } else if (gt) {
        reply = gt;
        modelUsed = 'gemini';
      } else if (xt) {
        reply = xt;
        modelUsed = 'grok';
      } else {
        throw new Error('All AI providers failed to respond.');
      }
    } else if (plan.providers.strategy === 'single' && plan.providers.singleProvider === 'grok') {
      if (grokKey) {
        const res = await new OpenAI({ apiKey: grokKey, baseURL: 'https://api.x.ai/v1' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.grokModel, messages, temperature: plan.temperature }, { signal });
        reply = extractOracleAssistantText(res) || 'CET AI is silent.';
        modelUsed = 'grok';
      } else {
        const res = await new OpenAI({ apiKey: geminiKey!, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.geminiModel, messages, temperature: plan.temperature }, { signal });
        reply = extractOracleAssistantText(res) || 'CET AI is silent.';
        modelUsed = 'gemini';
      }
    } else {
      if (geminiKey) {
        const res = await new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.geminiModel, messages, temperature: plan.temperature }, { signal });
        reply = extractOracleAssistantText(res) || 'CET AI is silent.';
        modelUsed = 'gemini';
      } else {
        const res = await new OpenAI({ apiKey: grokKey!, baseURL: 'https://api.x.ai/v1' })
          .chat.completions.create({ model: V2_AI_ORACLE_PROBE.grokModel, messages, temperature: plan.temperature }, { signal });
        reply = extractOracleAssistantText(res) || 'CET AI is silent.';
        modelUsed = 'grok';
      }
    }
  } catch (err) {
    modelUsed = 'unknown';
    const msg = err instanceof Error ? err.message : 'AI providers failed.';
    const status = 502;
    await recordPublicApiUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      method: req.method,
      path: V2_AI_ORACLE_PROBE.path,
      status,
      latencyMs: Date.now() - start,
    });
    return errorResponsePublic(req, status, 'internal_error', msg, null, { ...rateLimitHeaders(d), 'X-Cet-Ai-Plan': planHeader, 'X-Cet-Ai-Model': modelUsed });
  }

  const responseText = (reply ?? '').trim();
  const latencyMs = Date.now() - t0;
  const sources = [...retrieval.sources, ...kb.sources].slice(0, 5);

  if (conversation.length === 0) {
    const hit = await redisIncr(buildOraclePublicCountKey(auth.apiKeyId, trimmedQuery), 60 * 60 * 48);
    const shouldCache = hit !== null ? hit >= 2 : true;
    if (shouldCache && !forceFresh) {
      void redisSetJson(cacheKey, { response: responseText, sources, modelUsed }, 60 * 60 * 24 * 3);
    }
  }

  const status = 200;
  await recordPublicApiUsage({
    apiKeyId: auth.apiKeyId,
    userId: auth.userId,
    method: req.method,
    path: V2_AI_ORACLE_PROBE.path,
    status,
    latencyMs: Date.now() - start,
  });
  return jsonResponsePublic(
    req,
    buildOracleSuccessResponse({ responseText, sources, modelUsed, planHeader, latencyMs, query: trimmedQuery }),
    status,
    { ...rateLimitHeaders(d), 'X-Cet-Ai-Plan': planHeader, 'X-Cet-Ai-Model': modelUsed },
  );
}