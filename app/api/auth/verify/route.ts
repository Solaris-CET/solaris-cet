import crypto from 'node:crypto';

import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '@/db/client';
import { findReferrerByCode, todayKeyUtc } from '@/api/gamification/lib/gamification';
import { AUTH_VERIFY_PROBE, parseAuthVerifyPostBody } from '@/api/lib/authVerify';
import { consumeAuthChallenge } from '@/api/lib/authChallenges';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { getJwtSecretsFromEnv, signJwt } from '@/api/lib/jwt';
import { awardPoints } from '@/api/lib/points';
import { withRateLimit } from '@/api/lib/rateLimit';
import { extractTonProof, verifyTonProof } from '@/api/lib/tonProof';
import { tonAddressSchema } from '@/api/lib/validation';

export { AUTH_VERIFY_PATH, AUTH_VERIFY_PROBE } from '@/api/lib/authVerify';

export const config = { runtime: 'nodejs' };

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (origin && allowedOrigin !== origin) {
    return jsonResponse({ error: 'Forbidden' }, allowedOrigin, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: AUTH_VERIFY_PROBE.rateLimitKey,
    limit: AUTH_VERIFY_PROBE.rateLimit,
    windowSeconds: AUTH_VERIFY_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }

  const parsed = parseAuthVerifyPostBody(body);
  const parsedWallet = tonAddressSchema.safeParse(parsed.walletRaw);
  if (!parsedWallet.success) {
    return jsonResponse({ error: AUTH_VERIFY_PROBE.invalidWalletError }, allowedOrigin, 400);
  }
  const walletAddress = parsedWallet.data.toString();

  const proof = extractTonProof(parsed.tonProofRaw);
  if (!proof) return jsonResponse({ error: AUTH_VERIFY_PROBE.missingTonProofError }, allowedOrigin, 400);

  if (!consumeAuthChallenge(proof.payload)) {
    return jsonResponse({ error: AUTH_VERIFY_PROBE.challengeExpiredError }, allowedOrigin, 401);
  }

  const expectedDomain = (() => {
    try {
      const u = new URL(allowedOrigin);
      return u.hostname;
    } catch {
      return '';
    }
  })();

  const verified = verifyTonProof({
    walletAddress,
    publicKey: parsed.publicKey,
    proof,
    expectedDomain,
    maxSkewSeconds: AUTH_VERIFY_PROBE.maxSkewSeconds,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!verified.ok) {
    return jsonResponse({ error: 'Invalid signature', reason: verified.reason }, allowedOrigin, 401);
  }

  const db = getDb();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.walletAddress, walletAddress));
  const [linked] = existing
    ? [null]
    : await db
        .select({ userId: schema.userTonWallets.userId })
        .from(schema.userTonWallets)
        .where(eq(schema.userTonWallets.address, walletAddress))
        .limit(1);

  const user = existing
    ? existing
    : linked
      ? (await db.select().from(schema.users).where(eq(schema.users.id, linked.userId)).limit(1))[0]
      : (
          await db
            .insert(schema.users)
            .values({ walletAddress, referralCode: nanoid(8).toUpperCase(), points: 0 })
            .returning()
        )[0];

  await db
    .insert(schema.userTonWallets)
    .values({ userId: user.id, address: walletAddress, isPrimary: walletAddress === user.walletAddress })
    .onConflictDoNothing();

  if (walletAddress === user.walletAddress) {
    await db
      .update(schema.userTonWallets)
      .set({
        isPrimary: sql`CASE WHEN ${schema.userTonWallets.address} = ${walletAddress} THEN true ELSE false END`,
        updatedAt: new Date(),
      })
      .where(eq(schema.userTonWallets.userId, user.id));
  }

  const day = todayKeyUtc();
  try {
    await awardPoints(db, user.id, 5, 'wallet', { dedupeKey: 'wallet_connect', meta: { activity: 'wallet_connect', day } });
  } catch {
    void 0;
  }

  if (!existing && parsed.referralCode) {
    try {
      const ref = await findReferrerByCode(db, parsed.referralCode);
      if (ref && ref.userId !== user.id) {
        await db
          .insert(schema.referrals)
          .values({ referrerUserId: ref.userId, referredUserId: user.id, codeUsed: parsed.referralCode });
        await awardPoints(db, ref.userId, 10, 'referral', {
          dedupeKey: `referral:referrer:${user.id}`,
          meta: { referredUserId: user.id, activity: 'referral', day, codeUsed: parsed.referralCode },
        });
        await awardPoints(db, user.id, 10, 'referral', {
          dedupeKey: `referral:referred:${ref.userId}`,
          meta: { referrerUserId: ref.userId, activity: 'referral', day, codeUsed: parsed.referralCode },
        });
      }
    } catch {
      void 0;
    }
  }

  if (!existing && parsed.inviteToken) {
    try {
      const tokenHash = sha256Hex(parsed.inviteToken);
      const now = new Date();
      const [invite] = await db
        .select({
          id: schema.userInvites.id,
          createdByUserId: schema.userInvites.createdByUserId,
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
      if (invite && invite.createdByUserId !== user.id) {
        await db.insert(schema.userInviteUses).values({ inviteId: invite.id, usedByUserId: user.id }).onConflictDoNothing();
        await db
          .update(schema.userInvites)
          .set({ usedCount: sql`${schema.userInvites.usedCount} + 1` })
          .where(and(eq(schema.userInvites.id, invite.id), sql`${schema.userInvites.usedCount} < ${schema.userInvites.maxUses}`));
        await awardPoints(db, invite.createdByUserId, 5, 'invite', {
          dedupeKey: `invite:inviter:${user.id}`,
          meta: { invitedUserId: user.id, inviteId: invite.id, activity: 'invite', day },
        });
        await awardPoints(db, user.id, 5, 'invite', {
          dedupeKey: `invite:joined:${invite.id}`,
          meta: { inviterUserId: invite.createdByUserId, inviteId: invite.id, activity: 'invite', day },
        });
      }
    } catch {
      void 0;
    }
  }

  const secret = getJwtSecretsFromEnv()[0];
  if (!secret) {
    return jsonResponse({ error: 'JWT not configured' }, allowedOrigin, 500);
  }

  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      expiresAt: new Date(Date.now() + AUTH_VERIFY_PROBE.jwtTtlSeconds * 1000),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .returning();

  const token = await signJwt({ wallet: walletAddress, sid: session.id, sub: user.id }, secret, AUTH_VERIFY_PROBE.jwtTtlSeconds);
  return jsonResponse({ ok: true, wallet: walletAddress, token }, allowedOrigin, 200);
}