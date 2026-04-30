/**
 * POST /api/auth — sync TON wallet → PostgreSQL (users).
 * Node.js runtime (Postgres TCP). Do not set runtime to 'edge'.
 */
import crypto from 'node:crypto';

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../db/client';
import { findReferrerByCode, todayKeyUtc } from '../gamification/lib/gamification';
import { clientIp } from '../lib/clientIp';
import { getAllowedOrigin } from '../lib/cors';
import { getJwtSecretsFromEnv, signJwt, verifyJwtWithSecrets } from '../lib/jwt';
import { awardPoints } from '../lib/points';
import { withRateLimit } from '../lib/rateLimit';
import { tonAddressSchema } from '../lib/validation';

export const config = { runtime: 'nodejs' };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

const JWT_TTL_SECONDS = 60 * 60;

function normalizeReferralCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9_-]{4,20}$/.test(code)) return null;
  return code;
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
      keyPrefix: 'auth-read',
      limit: req.method === 'DELETE' ? 10 : 120,
      windowSeconds: 60,
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
    keyPrefix: 'auth-write',
    limit: 5,
    windowSeconds: 60,
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

    const rawWallet =
      typeof body === 'object' &&
      body !== null &&
      'walletAddress' in body &&
      typeof (body as { walletAddress: unknown }).walletAddress === 'string'
        ? (body as { walletAddress: string }).walletAddress
        : '';
    const parsedWallet = tonAddressSchema.safeParse(rawWallet);
    if (!parsedWallet.success) {
      return new Response(JSON.stringify({ error: 'Adresă invalidă' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }
    const walletAddress = parsedWallet.data.toString();
    const referralCode =
      typeof body === 'object' && body !== null && 'referralCode' in body
        ? normalizeReferralCode((body as { referralCode?: unknown }).referralCode)
        : null;
    const inviteToken =
      typeof body === 'object' && body !== null && 'inviteToken' in body && typeof (body as { inviteToken?: unknown }).inviteToken === 'string'
        ? (body as { inviteToken: string }).inviteToken.trim().slice(0, 200)
        : '';

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
              expiresAt: new Date(Date.now() + JWT_TTL_SECONDS * 1000),
              ip: clientIp(req),
              userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
            })
            .returning();
          token = await signJwt({ wallet: walletAddress, sid: session.id }, secret, JWT_TTL_SECONDS);
        } catch {
          token = await signJwt({ wallet: walletAddress }, secret, JWT_TTL_SECONDS);
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
                expiresAt: new Date(Date.now() + JWT_TTL_SECONDS * 1000),
                ip: clientIp(req),
                userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
              })
              .returning();
            token = await signJwt({ wallet: walletAddress, sid: session.id }, secret, JWT_TTL_SECONDS);
          } catch {
            token = await signJwt({ wallet: walletAddress }, secret, JWT_TTL_SECONDS);
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
    return new Response(JSON.stringify({ error: 'Nu s-a putut genera un cod de referral unic' }), {
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
