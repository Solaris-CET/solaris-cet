import type { z } from 'zod';

import { requirePublicApiKey, type PublicApiAuth } from './publicApiAuth';
import { recordPublicApiUsage } from './publicApiMetrics';
import { decideRateLimit, rateLimitHeaders } from './publicApiRateLimit';
import { errorResponsePublic, jsonResponsePublic, optionsResponsePublic, rateLimitedResponsePublic } from './publicApiResponse';

interface PublicApiProbeBase {
  path: string;
  methods: readonly string[];
  rateLimitBucket: string;
  rateWindowSeconds: number;
}

interface PublicApiGetProbe extends PublicApiProbeBase {
  rateLimit: number;
}

interface PublicApiCrudProbe extends PublicApiProbeBase {
  defaultLimit: number;
  webhookEvent?: string;
}

function makeUsageRecorder(start: number, path: string) {
  return (apiKeyId: string | null, userId: string | null, method: string, status: number) =>
    recordPublicApiUsage({ apiKeyId, userId, method, path, status, latencyMs: Date.now() - start });
}

export function createPublicApiGetRoute<TProbe extends PublicApiGetProbe>(
  probe: TProbe,
  buildBody: (auth: PublicApiAuth, req: Request) => unknown | Promise<unknown>,
) {
  return async function handler(req: Request): Promise<Response> {
    const start = Date.now();
    const record = makeUsageRecorder(start, probe.path);

    if (req.method === 'OPTIONS') {
      return optionsResponsePublic(req, probe.methods.join(', '), 'Content-Type, Authorization, X-API-Key');
    }
    if (req.method !== 'GET') {
      return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
    }

    const auth = await requirePublicApiKey(req);
    if (auth instanceof Response) {
      await record(null, null, req.method, auth.status);
      return auth;
    }

    const d = decideRateLimit({
      req,
      bucket: probe.rateLimitBucket,
      keyPart: auth.apiKeyId,
      limit: probe.rateLimit,
      windowSeconds: probe.rateWindowSeconds,
    });
    if (!d.ok) {
      await record(auth.apiKeyId, auth.userId, req.method, 429);
      return rateLimitedResponsePublic(req, d);
    }

    const body = await buildBody(auth, req);
    const status = 200;
    await record(auth.apiKeyId, auth.userId, req.method, status);
    return jsonResponsePublic(req, body, status, rateLimitHeaders(d));
  };
}

export interface PublicApiCrudDeps<TCreateInput, TCreateOutput, TItem> {
  createSchema: z.ZodType<TCreateInput>;
  resolveRateLimit: (method: string) => number;
  buildListBody: (items: TItem[], nextCursor: string | null) => unknown;
  buildCreateBody: (entity: TCreateOutput, input: TCreateInput) => unknown;
  createEntity: (input: TCreateInput) => TCreateOutput;
  listEntities: (opts: { limit: number; cursor?: string | null }) => { items: TItem[]; nextCursor: string | null };
  emitWebhookEvent?: (userId: string, eventType: string, payload: TCreateOutput) => void | Promise<void>;
}

export function createPublicApiCrudRoute<TProbe extends PublicApiCrudProbe, TCreateInput, TCreateOutput, TItem>(
  probe: TProbe,
  deps: PublicApiCrudDeps<TCreateInput, TCreateOutput, TItem>,
) {
  return async function handler(req: Request): Promise<Response> {
    const start = Date.now();
    const record = makeUsageRecorder(start, probe.path);

    if (req.method === 'OPTIONS') {
      return optionsResponsePublic(req, probe.methods.join(', '), 'Content-Type, Authorization, X-API-Key');
    }

    const auth = await requirePublicApiKey(req);
    if (auth instanceof Response) {
      await record(null, null, req.method, auth.status);
      return auth;
    }

    const d = decideRateLimit({
      req,
      bucket: probe.rateLimitBucket,
      keyPart: auth.apiKeyId,
      limit: deps.resolveRateLimit(req.method),
      windowSeconds: probe.rateWindowSeconds,
    });
    if (!d.ok) {
      await record(auth.apiKeyId, auth.userId, req.method, 429);
      return rateLimitedResponsePublic(req, d);
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get('limit') ?? String(probe.defaultLimit));
      const cursor = url.searchParams.get('cursor');
      const { items, nextCursor } = deps.listEntities({ limit, cursor });
      const status = 200;
      await record(auth.apiKeyId, auth.userId, req.method, status);
      return jsonResponsePublic(req, deps.buildListBody(items, nextCursor), status, rateLimitHeaders(d));
    }

    if (req.method === 'POST') {
      let json: unknown;
      try {
        json = await req.json();
      } catch {
        await record(auth.apiKeyId, auth.userId, req.method, 400);
        return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
      }
      const parsed = deps.createSchema.safeParse(json);
      if (!parsed.success) {
        await record(auth.apiKeyId, auth.userId, req.method, 400);
        return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
      }
      const entity = deps.createEntity(parsed.data);
      if (probe.webhookEvent && deps.emitWebhookEvent) {
        void deps.emitWebhookEvent(auth.userId, probe.webhookEvent, entity);
      }
      const status = 201;
      await record(auth.apiKeyId, auth.userId, req.method, status);
      return jsonResponsePublic(req, deps.buildCreateBody(entity, parsed.data), status, rateLimitHeaders(d));
    }

    await record(auth.apiKeyId, auth.userId, req.method, 405);
    return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
  };
}
