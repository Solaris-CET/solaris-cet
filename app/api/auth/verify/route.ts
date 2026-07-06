import crypto from 'node:crypto'

import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { getDb, schema } from '../../../db/client'
import { findReferrerByCode, todayKeyUtc } from '../../gamification/lib/gamification'
import { consumeAuthChallenge } from '../../lib/authChallenges'
import { clientIp } from '../../lib/clientIp'
import { getAllowedOrigin } from '../../lib/cors'
import { getJwtSecretsFromEnv, signJwt } from '../../lib/jwt'
import { awardPoints } from '../../lib/points'
import { withRateLimit } from '../../lib/rateLimit'
import { extractTonProof, verifyTonProof } from '../../lib/tonProof'
import { tonAddressSchema } from '../../lib/validation'

export const config = { runtime: 'nodejs' }

const JWT_TTL_SECONDS = 60 * 60

function normalizeReferralCode(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const code = input.trim().toUpperCase()
  if (!code) return null
  if (!/^[A-Z0-9_-]{4,20}$/.test(code)) return null
  return code
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
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
  })
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  const allowedOrigin = getAllowedOrigin(origin)

  if (origin && allowedOrigin !== origin) {
    return jsonResponse({ error: 'Forbidden' }, allowedOrigin, 403)
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
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405)
  }

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'auth-verify', limit: 20, windowSeconds: 60 })
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400)
  }

  const walletRaw =
    typeof body === 'object' &&
    body !== null &&
    'walletAddress' in body &&
    typeof (body as { walletAddress?: unknown }).walletAddress === 'string'
      ? ((body as { walletAddress: string }).walletAddress ?? '').trim()
      : ''

  const publicKey =
    typeof body === 'object' && body !== null && 'publicKey' in body ? (body as { publicKey?: unknown }).publicKey : null

  const tonProofRaw =
    typeof body === 'object' && body !== null && 'tonProof' in body ? (body as { tonProof?: unknown }).tonProof : null

  const referralCode =
    typeof body === 'object' && body !== null && 'referralCode' in body
      ? normalizeReferralCode((body as { referralCode?: unknown }).referralCode)
      : null
  const inviteToken =
    typeof body === 'object' && body !== null && 'inviteToken' in body && typeof (body as { inviteToken?: unknown }).inviteToken === 'string'
      ? (body as { inviteToken: string }).inviteToken.trim().slice(0, 200)
      : ''

  const parsedWallet = tonAddressSchema.safeParse(walletRaw)
  if (!parsedWallet.success) {
    return jsonResponse({ error: 'Adresă invalidă' }, allowedOrigin, 400)
  }
  const walletAddress = parsedWallet.data.toString()

  const proof = extractTonProof(tonProofRaw)
  if (!proof) return jsonResponse({ error: 'Missing ton_proof' }, allowedOrigin, 400)

  if (!consumeAuthChallenge(proof.payload)) {
    return jsonResponse({ error: 'Challenge expired' }, allowedOrigin, 401)
  }

  const expectedDomain = (() => {
    try {
      const u = new URL(allowedOrigin)
      return u.hostname
    } catch {
      return ''
    }
  })()

  const verified = verifyTonProof({
    walletAddress,
    publicKey,
    proof,
    expectedDomain,
    maxSkewSeconds: 10 * 60,
    nowSeconds: Math.floor(Date.now() / 1000),
  })
  if (!verified.ok) {
    return jsonResponse({ error: 'Invalid signature', reason: verified.reason }, allowedOrigin, 401)
  }

  const db = getDb()
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.walletAddress, walletAddress))
  const [linked] = existing
    ? [null]
    : await db
        .select({ userId: schema.userTonWallets.userId })
        .from(schema.userTonWallets)
        .where(eq(schema.userTonWallets.address, walletAddress))
        .limit(1)

  const user = existing
    ? existing
    : linked
      ? (await db.select().from(schema.users).where(eq(schema.users.id, linked.userId)).limit(1))[0]
      : (
          await db
            .insert(schema.users)
            .values({ walletAddress, referralCode: nanoid(8).toUpperCase(), points: 0 })
            .returning()
        )[0]

  await db
    .insert(schema.userTonWallets)
    .values({ userId: user.id, address: walletAddress, isPrimary: walletAddress === user.walletAddress })
    .onConflictDoNothing()

  if (walletAddress === user.walletAddress) {
    await db
      .update(schema.userTonWallets)
      .set({
        isPrimary: sql`CASE WHEN ${schema.userTonWallets.address} = ${walletAddress} THEN true ELSE false END`,
        updatedAt: new Date(),
      })
      .where(eq(schema.userTonWallets.userId, user.id))
  }

  const day = todayKeyUtc()
  try {
    await awardPoints(db, user.id, 5, 'wallet', { dedupeKey: 'wallet_connect', meta: { activity: 'wallet_connect', day } })
  } catch {
    void 0
  }

  if (!existing && referralCode) {
    try {
      const ref = await findReferrerByCode(db, referralCode)
      if (ref && ref.userId !== user.id) {
        await db
          .insert(schema.referrals)
          .values({ referrerUserId: ref.userId, referredUserId: user.id, codeUsed: referralCode })
        await awardPoints(db, ref.userId, 10, 'referral', {
          dedupeKey: `referral:referrer:${user.id}`,
          meta: { referredUserId: user.id, activity: 'referral', day, codeUsed: referralCode },
        })
        await awardPoints(db, user.id, 10, 'referral', {
          dedupeKey: `referral:referred:${ref.userId}`,
          meta: { referrerUserId: ref.userId, activity: 'referral', day, codeUsed: referralCode },
        })
      }
    } catch {
      void 0
    }
  }

  if (!existing && inviteToken) {
    try {
      const tokenHash = sha256Hex(inviteToken)
      const now = new Date()
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
        .limit(1)
      if (invite && invite.createdByUserId !== user.id) {
        await db.insert(schema.userInviteUses).values({ inviteId: invite.id, usedByUserId: user.id }).onConflictDoNothing()
        await db
          .update(schema.userInvites)
          .set({ usedCount: sql`${schema.userInvites.usedCount} + 1` })
          .where(and(eq(schema.userInvites.id, invite.id), sql`${schema.userInvites.usedCount} < ${schema.userInvites.maxUses}`))
        await awardPoints(db, invite.createdByUserId, 5, 'invite', {
          dedupeKey: `invite:inviter:${user.id}`,
          meta: { invitedUserId: user.id, inviteId: invite.id, activity: 'invite', day },
        })
        await awardPoints(db, user.id, 5, 'invite', {
          dedupeKey: `invite:joined:${invite.id}`,
          meta: { inviterUserId: invite.createdByUserId, inviteId: invite.id, activity: 'invite', day },
        })
      }
    } catch {
      void 0
    }
  }

  const secret = getJwtSecretsFromEnv()[0]
  if (!secret) {
    return jsonResponse({ error: 'JWT not configured' }, allowedOrigin, 500)
  }

  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      expiresAt: new Date(Date.now() + JWT_TTL_SECONDS * 1000),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .returning()

  const token = await signJwt({ wallet: walletAddress, sid: session.id, sub: user.id }, secret, JWT_TTL_SECONDS)
  return jsonResponse({ ok: true, wallet: walletAddress, token }, allowedOrigin, 200)
}
