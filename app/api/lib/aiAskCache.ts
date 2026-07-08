import { getDb, schema } from '@/db/client';
import { redisGetJson } from '@/api/lib/upstashRedis';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import type { AuthContext } from '@/api/lib/auth';
import type { ConversationTurn } from '@/api/lib/aiAsk';

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

export function buildCacheKey({
  modelPreference,
  mode,
  tone,
  kbV,
  queryHash,
}: {
  modelPreference: string;
  mode: string;
  tone: string;
  kbV: string;
  queryHash: string;
}): string {
  return `cet-ai:faq:v2:${modelPreference}:${mode}:${tone}:${kbV}:${queryHash}`;
}

export async function serveCachedResponseIfAvailable(opts: {
  req: Request;
  allowedOrigin: string;
  ctx: AuthContext | null;
  forceFresh: boolean;
  conversation: ConversationTurn[];
  trimmedQuery: string;
  queryHash: string;
  cacheKey: string;
  softLimitHeader: Record<string, string>;
}): Promise<Response | null> {
  if (opts.forceFresh || opts.conversation.length > 0) return null;

  const cached = await redisGetJson<{ response: string; sources: unknown; modelUsed: string }>(opts.cacheKey);
  if (!cached?.response || typeof cached.response !== 'string') return null;

  let queryLogId: string | null = null;
  if (process.env.DATABASE_URL?.trim() && opts.ctx?.user?.id) {
    try {
      const db = getDb();
      const [log] = await db
        .insert(schema.aiQueryLogs)
        .values({
          userId: opts.ctx.user.id,
          ipHash: sha256Hex((opts.req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0]!.trim()),
          query: opts.trimmedQuery,
          queryHash: opts.queryHash,
          model: cached.modelUsed,
          plan: 'cache',
          source: 'cache',
          latencyMs: null,
          usedCache: true,
          moderationFlagged: false,
          responseHash: sha256Hex(cached.response),
          qualityScore: null,
          evalModel: null,
          evalLatencyMs: null,
        })
        .returning({ id: schema.aiQueryLogs.id });
      queryLogId = log?.id ?? null;
    } catch {
      void 0;
    }
  }

  return jsonResponse(
    opts.allowedOrigin,
    {
      response: cached.response,
      sources: Array.isArray(cached.sources) ? cached.sources : [],
      usedCache: true,
      modelUsed: cached.modelUsed,
      queryLogId,
    },
    200,
    {
      'X-Cet-Ai-Source': 'live',
      'X-Cet-Ai-Used-Cache': '1',
      ...opts.softLimitHeader,
    },
  );
}
