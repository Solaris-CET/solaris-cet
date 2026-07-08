import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { getJwtSecretsFromEnv, signJwt } from '@/api/lib/jwt';
import { parseOAuthCallbackParams, safeOAuthRedirect } from '@/api/lib/oauthCommon';
import { OAUTH_TWITTER_CALLBACK_PROBE } from '@/api/lib/oauthTwitterCallback';

export { OAUTH_TWITTER_CALLBACK_PATH, OAUTH_TWITTER_CALLBACK_PROBE } from '@/api/lib/oauthTwitterCallback';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export default async function handler(req: Request): Promise<Response> {
  const { state, code, error } = parseOAuthCallbackParams(new URL(req.url).searchParams);

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
    .where(and(eq(schema.oauthStates.state, state), eq(schema.oauthStates.provider, OAUTH_TWITTER_CALLBACK_PROBE.provider), sql`${schema.oauthStates.expiresAt} >= ${now}`))
    .limit(1);
  if (!row) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=expired', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }
  await db.delete(schema.oauthStates).where(eq(schema.oauthStates.state, state));

  const clientId = env(OAUTH_TWITTER_CALLBACK_PROBE.clientIdEnv);
  const clientSecret = env(OAUTH_TWITTER_CALLBACK_PROBE.clientSecretEnv);
  if (!clientId || !clientSecret) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=not_configured', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const base = String(process.env.PUBLIC_SITE_URL ?? '').trim() || req.url;
  const callbackUrl = new URL(OAUTH_TWITTER_CALLBACK_PROBE.callbackPath, base);

  const tokenRes = await fetch(OAUTH_TWITTER_CALLBACK_PROBE.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl.toString(),
      code_verifier: row.codeVerifier,
    }).toString(),
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as { access_token?: unknown } | null;
  const accessToken = typeof tokenJson?.access_token === 'string' ? tokenJson.access_token : '';
  if (!accessToken) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=token', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const userRes = await fetch(OAUTH_TWITTER_CALLBACK_PROBE.userUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userJson = (await userRes.json().catch(() => null)) as { data?: { id?: unknown; username?: unknown } } | null;
  const providerUserId = typeof userJson?.data?.id === 'string' ? userJson.data.id : '';
  const username = typeof userJson?.data?.username === 'string' ? userJson.data.username.slice(0, 80) : null;
  if (!providerUserId) {
    return new Response(null, { status: 302, headers: { Location: '/login#oauth_error=user', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  const linkedUserId = row.userId;
  let userId: string | null = linkedUserId ?? null;
  if (!userId) {
    const [idRow] = await db
      .select()
      .from(schema.oauthIdentities)
      .where(and(eq(schema.oauthIdentities.provider, OAUTH_TWITTER_CALLBACK_PROBE.provider), eq(schema.oauthIdentities.providerUserId, providerUserId)))
      .limit(1);
    userId = idRow?.userId ?? null;
  }
  if (!userId) {
    const to = safeOAuthRedirect(row.returnTo ?? '/login');
    return new Response(null, { status: 302, headers: { Location: `${to}#oauth_error=not_linked`, 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' } });
  }

  if (linkedUserId) {
    await db
      .insert(schema.oauthIdentities)
      .values({ userId, provider: OAUTH_TWITTER_CALLBACK_PROBE.provider, providerUserId, username })
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

  const to = safeOAuthRedirect(row.returnTo ?? '/login');
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${to}#token=${encodeURIComponent(jwt)}`,
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}