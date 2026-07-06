import crypto from 'node:crypto';

import { getDb, schema } from '../../../../../db/client';
import { requireAuth } from '../../../../lib/auth';
import { jsonResponse, optionsResponse } from '../../../../lib/http';
import { ensureAllowedOrigin } from '../../../../lib/originGuard';

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

  const clientId = env('TWITTER_OAUTH_CLIENT_ID');
  if (!clientId) return jsonResponse(req, { error: 'Not configured' }, 501);

  const ctx = await requireAuth(req);
  const userId = 'error' in ctx ? null : ctx.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const returnTo =
    typeof body === 'object' && body !== null && 'returnTo' in body && typeof (body as { returnTo?: unknown }).returnTo === 'string'
      ? (body as { returnTo: string }).returnTo.trim().slice(0, 200)
      : '/login';

  const state = randomUrlSafe(24);
  const codeVerifier = randomUrlSafe(48);
  const challenge = crypto.createHash('sha256').update(codeVerifier).digest().toString('base64url');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const db = getDb();
  await db.insert(schema.oauthStates).values({
    state,
    provider: 'twitter',
    userId,
    codeVerifier,
    returnTo,
    expiresAt,
  });

  const base = String(process.env.PUBLIC_SITE_URL ?? '').trim() || req.url;
  const callbackUrl = new URL('/api/auth/oauth/twitter/callback', base);

  const auth = new URL('https://twitter.com/i/oauth2/authorize');
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', callbackUrl.toString());
  auth.searchParams.set('scope', 'tweet.read users.read offline.access');
  auth.searchParams.set('state', state);
  auth.searchParams.set('code_challenge', challenge);
  auth.searchParams.set('code_challenge_method', 'S256');

  return jsonResponse(req, { ok: true, url: auth.toString() });
}

