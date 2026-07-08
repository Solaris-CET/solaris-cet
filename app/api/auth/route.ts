/**
 * POST /api/auth — sync TON wallet → PostgreSQL (users).
 * Node.js runtime (Postgres TCP). Do not set runtime to 'edge'.
 */
import crypto from 'node:crypto';

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '@/db/client';
import { findReferrerByCode, todayKeyUtc } from '@/api/gamification/lib/gamification';
import { API_AUTH_PROBE, parseWalletAuthPostBody } from '@/api/lib/apiAuth';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { getJwtSecretsFromEnv, signJwt, verifyJwtWithSecrets } from '@/api/lib/jwt';
import { awardPoints } from '@/api/lib/points';
import { withRateLimit } from '@/api/lib/rateLimit';
import { tonAddressSchema } from '@/api/lib/validation';

export { API_AUTH_PATH, API_AUTH_PROBE } from '@/api/lib/apiAuth';

export const config = { runtime: 'nodejs' };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (origin && allowedOrigin !== origin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    const limited = await withRateLimit(req, allowedOrigin, {
      keyPrefix: API_AUTH_PROBE.readRateLimitKey,
      limit: req.method === 'DELETE' ? API_AUTH_PROBE.deleteRateLimit : API_AUTH_PROBE.readRateLimit,
      windowSeconds: API_AUTH_PROBE.rateWindowSeconds,
    });
    if (limited) return limited;

    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const secrets = getJwtSecretsFromEnv();
    if (!token || secrets.length === 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }
    const decoded = verifyJwtWithSecrets(token, secrets);
    if (!decoded || typeof decoded.wallet !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }

    if (typeof decoded.sid === 'string') {
      try {
        const db = getDb();
        if (req.method === 'DELETE') {
          await db
            .update(schema.sessions)
            .set({ revokedAt: new Date() })
            .where(eq(schema.sessions.id, decoded.sid));
          return new Response(null, {
            status: 204,
            headers: { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
          });
        }
        const [s] = await db
          .select()
          .from(schema.sessions)
          .where(eq(schema.sessions.id, decoded.sid));
        if (!s || s.revokedAt || s.expiresAt.getTime() <= Date.now()) {
          return new Response(JSON.stringify({ error: 'Invalid session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
          });
        }
        await db
          .update(schema.sessions)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.sessions.id, decoded.sid));
      } catch {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
        });
      }
    }

    if (req.method === 'DELETE') {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      });
    }

    return new Response(JSON.stringify({ user: { wallet: decoded.wallet } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  } else if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: API_AUTH_PROBE.writeRateLimitKey,
    limit: API_AUTH_PROBE.writeRateLimit,
    windowSeconds: API_AUTH_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }

    const parsedBody = parseWalletAuthPostBody(body);
    if (!parsedBody.ok) {
      return new Response(JSON.stringify({ error: parsedBody.error }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }
    const parsedWallet = tonAddressSchema.safeParse(parsedBody.walletRaw);
    if (!parsedWallet.success) {
      return new Response(JSON.stringify({ error: API_AUTH_PROBE.invalidWalletError }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }
    const walletAddress = parsedWallet.data.toString();
    const { referralCode, inviteToken } = parsedBody;

    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.walletAddress, walletAddress));

    if (existing) {
      const day = todayKeyUtc();
      try {
        await awardPoints(db, existing.id, 5, 'wallet', { dedupeKey: 'wallet_connect', meta: { activity: 'wallet_connect', day } });
      } catch {
        void 0;
      }
      const secret = getJwtSecretsFromEnv()[0];
      let token: string | undefined;
      if (secret) {
        try {
          const [session] = await db
            .insert(schema.sessions)
            .values({
              userId: existing.id,
              expiresAt: new Date(Date.now() + API_AUTH_PROBE.jwtTtlSeconds * 1000),
              ip: clientIp(req),
              userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
            })
            .returning();
          token = await signJwt({ wallet: walletAddress, sid: session.id }, secret, API_AUTH_PROBE.jwtTtlSeconds);
        } catch {
          token = await signJwt({ wallet: walletAddress }, secret, API_AUTH_PROBE.jwtTtlSeconds);
        }
      }
      return new Response(JSON.stringify({ ...existing, token }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }

    const maxAttempts = 5;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const [newUser] = await db
          .insert(schema.users)
          .values({
            walletAddress,
            referralCode: nanoid(8).toUpperCase(),
            points: 0,
          })
          .returning();

        if (referralCode) {
          try {
            const ref = await findReferrerByCode(db, referralCode);
            if (ref && ref.userId !== newUser.id) {
              const day = todayKeyUtc();
              await db
                .insert(schema.referrals)
                .values({ referrerUserId: ref.userId, referredUserId: newUser.id, codeUsed: referralCode });
              await awardPoints(db, ref.userId, 10, 'referral', {
                dedupeKey: `referral:referrer:${newUser.id}`,
                meta: { referredUserId: newUser.id, activity: 'referral', day, codeUsed: referralCode },
              });
              await awardPoints(db, newUser.id, 10, 'referral', {
                dedupeKey: `referral:referred:${ref.userId}`,
                meta: { referrerUserId: ref.userId, activity: 'referral', day, codeUsed: referralCode },
              });
            }
          } catch {
            void 0;
          }
        }

        if (inviteToken) {
          try {
            const tokenHash = sha256Hex(inviteToken);
            const now = new Date();
            const [invite] = await db
              .select({
                id: schema.userInvites.id,
                createdByUserId: schema.userInvites.createdByUserId,
                usedCount: schema.userInvites.usedCount,
                maxUses: schema.userInvites.maxUses,
              })
              .from(schema.userInvites)
              .where(
                and(
                  eq(schema.userInvites.tokenHash, tokenHash),
                  isNull(schema.userInvites.revokedAt),
                  or(isNull(schema.userInvites.expiresAt), sql`${schema.userInvites.expiresAt} >= ${now}`),
                  sql`${schema.userInvites.usedCount} < ${schema.userInvites.maxUses}`,
                ),
              )
              .limit(1);

            if (invite && invite.createdByUserId !== newUser.id) {
              await db
                .insert(schema.userInviteUses)
                .values({ inviteId: invite.id, usedByUserId: newUser.id })
                .onConflictDoNothing();
              await db
                .update(schema.userInvites)
                .set({ usedCount: sql`${schema.userInvites.usedCount} + 1` })
                .where(and(eq(schema.userInvites.id, invite.id), sql`${schema.userInvites.usedCount} < ${schema.userInvites.maxUses}`));

              const day = todayKeyUtc();
              await awardPoints(db, invite.createdByUserId, 5, 'invite', {
                dedupeKey: `invite:inviter:${newUser.id}`,
                meta: { invitedUserId: newUser.id, inviteId: invite.id, activity: 'invite', day },
              });
              await awardPoints(db, newUser.id, 5, 'invite', {
                dedupeKey: `invite:joined:${invite.id}`,
                meta: { inviterUserId: invite.createdByUserId, inviteId: invite.id, activity: 'invite', day },
              });
            }
          } catch {
            void 0;
          }
        }

        const day = todayKeyUtc();
        try {
          await awardPoints(db, newUser.id, 5, 'wallet', { dedupeKey: 'wallet_connect', meta: { activity: 'wallet_connect', day } });
        } catch {
          void 0;
        }

        const secret = getJwtSecretsFromEnv()[0];
        let token: string | undefined;
        if (secret) {
          try {
            const [session] = await db
              .insert(schema.sessions)
              .values({
                userId: newUser.id,
                expiresAt: new Date(Date.now() + API_AUTH_PROBE.jwtTtlSeconds * 1000),
                ip: clientIp(req),
                userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
              })
              .returning();
            token = await signJwt({ wallet: walletAddress, sid: session.id }, secret, API_AUTH_PROBE.jwtTtlSeconds);
          } catch {
            token = await signJwt({ wallet: walletAddress }, secret, API_AUTH_PROBE.jwtTtlSeconds);
          }
        }
        return new Response(JSON.stringify({ ...newUser, token }), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin,
            Vary: 'Origin',
          },
        });
      } catch (err) {
        lastErr = err;
        if (isUniqueViolation(err)) continue;
        throw err;
      }
    }

    console.error('Auth API: referralCode collision after retries', lastErr);
    return new Response(JSON.stringify({ error: API_AUTH_PROBE.referralCollisionError }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
      },
    });
  } catch (err) {
    console.error('Eroare Auth API:', err);
    return new Response(JSON.stringify({ error: 'Eroare la baza de date' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': getAllowedOrigin(req.headers.get('origin')),
        Vary: 'Origin',
      },
    });
  }
}
