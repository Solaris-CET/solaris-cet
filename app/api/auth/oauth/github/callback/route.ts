import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../../db/client';
import { clientIp } from '../../../../lib/clientIp';
import { getAllowedOrigin } from '../../../../lib/cors';
import { getJwtSecretsFromEnv, signJwt } from '../../../../lib/jwt';


export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function safeRedirect(to: string): string {
  const trimmed = String(to ?? '').trim();
  if (!trimmed.startsWith('/')) return '/login';
  if (trimmed.startsWith('//')) return '/login';
  return trimmed;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const state = (url.searchParams.get('state') ?? '').trim();
  const code = (url.searchParams.get('code') ?? '').trim();
  const error = (url.searchParams.get('error') ?? '').trim();

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (error) {
    return new Response(null, { status: 302, headers: { Location: `/login#oauth_error=${encodeURIComponent(error)}`, 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }
  if (!state || !code) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=invalid', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(schema.oauthStates)
    .where(and(eq(schema.oauthStates.state, state), eq(schema.oauthStates.provider, 'github'), sql`${schema.oauthStates.expiresAt} >= ${now}`))
    .limit(1);

  if (!row) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=expired', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }
  await db.delete(schema.oauthStates).where(eq(schema.oauthStates.state, state));

  const clientId = env('GITHUB_OAUTH_CLIENT_ID');
  const clientSecret = env('GITHUB_OAUTH_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=not_configured', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const callbackUrl = new URL('/api/auth/oauth/github/callback', String(process.env.PUBLIC_SITE_URL ?? '').trim() || req.url);
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl.toString(),
      code_verifier: row.codeVerifier,
    }),
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as { access_token?: unknown } | null;
  const accessToken = typeof tokenJson?.access_token === 'string' ? tokenJson.access_token : '';
  if (!accessToken) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=token', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'solaris-cet' },
  });
  const userJson = (await userRes.json().catch(() => null)) as { id?: unknown; login?: unknown } | null;
  const providerUserId = typeof userJson?.id === 'number' || typeof userJson?.id === 'string' ? String(userJson.id) : '';
  const username = typeof userJson?.login === 'string' ? userJson.login.slice(0, 80) : null;
  if (!providerUserId) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=user', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const linkedUserId = row.userId;
  let userId: string | null = linkedUserId ?? null;
  if (!userId) {
    const [idRow] = await db
      .select()
      .from(schema.oauthIdentities)
      .where(and(eq(schema.oauthIdentities.provider, 'github'), eq(schema.oauthIdentities.providerUserId, providerUserId)))
      .limit(1);
    userId = idRow?.userId ?? null;
  }
  if (!userId) {
    const to = safeRedirect(row.returnTo ?? '/login');
    return new Response(null, { status: 302, headers: { Location: `${to}#oauth_error=not_linked`, 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  if (linkedUserId) {
    await db
      .insert(schema.oauthIdentities)
      .values({ userId, provider: 'github', providerUserId, username })
      .onConflictDoUpdate({
        target: [schema.oauthIdentities.provider, schema.oauthIdentities.providerUserId],
        set: { userId, username, linkedAt: new Date() },
      });
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=not_linked', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const secret = getJwtSecretsFromEnv()[0];
  if (!secret) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=jwt', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const ttlSeconds = 60 * 60;
  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .returning();
  const jwt = await signJwt({ wallet: user.walletAddress, sid: session.id, sub: user.id }, secret, ttlSeconds);

  const to = safeRedirect(row.returnTo ?? '/login');
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${to}#token=${encodeURIComponent(jwt)}`,
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}
