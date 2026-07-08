import crypto from 'node:crypto';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { OAUTH_STATE_TTL_MS, parseOAuthReturnTo } from '@/api/lib/oauthCommon';
import { OAUTH_TWITTER_START_PROBE } from '@/api/lib/oauthTwitterStart';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { OAUTH_TWITTER_START_PATH, OAUTH_TWITTER_START_PROBE } from '@/api/lib/oauthTwitterStart';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function randomUrlSafe(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const clientId = env(OAUTH_TWITTER_START_PROBE.clientIdEnv);
  if (!clientId) return jsonResponse(req, { error: OAUTH_TWITTER_START_PROBE.notConfiguredError }, 501);

  const ctx = await requireAuth(req);
  const userId = 'error' in ctx ? null : ctx.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const returnTo = parseOAuthReturnTo(body);

  const state = randomUrlSafe(24);
  const codeVerifier = randomUrlSafe(48);
  const challenge = crypto.createHash('sha256').update(codeVerifier).digest().toString('base64url');
  const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

  const db = getDb();
  await db.insert(schema.oauthStates).values({
    state,
    provider: OAUTH_TWITTER_START_PROBE.provider,
    userId,
    codeVerifier,
    returnTo,
    expiresAt,
  });

  const base = String(process.env.PUBLIC_SITE_URL ?? '').trim() || req.url;
  const callbackUrl = new URL(OAUTH_TWITTER_START_PROBE.callbackPath, base);

  const auth = new URL(OAUTH_TWITTER_START_PROBE.authorizeHost);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', callbackUrl.toString());
  auth.searchParams.set('scope', OAUTH_TWITTER_START_PROBE.scope);
  auth.searchParams.set('state', state);
  auth.searchParams.set('code_challenge', challenge);
  auth.searchParams.set('code_challenge_method', 'S256');

  return jsonResponse(req, { ok: true, url: auth.toString() });
}