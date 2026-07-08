import { eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { consumeAuthChallenge } from '@/api/lib/authChallenges';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { getJwtSecretsFromEnv, signJwt } from '@/api/lib/jwt';
import { withRateLimit } from '@/api/lib/rateLimit';
import { extractTonProof, verifyTonProof } from '@/api/lib/tonProof';
import { tonAddressSchema } from '@/api/lib/validation';
import {
  buildWalletsLinkSuccessBody,
  buildWalletsLinkTelegramMessage,
  parseWalletsLinkBody,
  resolveWalletsLinkExpectedDomain,
  WALLETS_LINK_PROBE,
} from '../../lib/walletsLink';

export { WALLETS_LINK_PATH, WALLETS_LINK_PROBE } from '@/api/lib/walletsLink';

export const config = { runtime: 'nodejs' };

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
  if (origin && allowedOrigin !== origin) return jsonResponse({ error: 'Forbidden' }, allowedOrigin, 403);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': WALLETS_LINK_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: WALLETS_LINK_PROBE.rateLimitKey,
    limit: WALLETS_LINK_PROBE.rateLimit,
    windowSeconds: WALLETS_LINK_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse({ error: ctx.error }, allowedOrigin, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }

  const { walletRaw, publicKey, tonProofRaw, label, setPrimary } = parseWalletsLinkBody(body);

  const parsedWallet = tonAddressSchema.safeParse(walletRaw);
  if (!parsedWallet.success) return jsonResponse({ error: WALLETS_LINK_PROBE.invalidAddressError }, allowedOrigin, 400);
  const walletAddress = parsedWallet.data.toString();

  const proof = extractTonProof(tonProofRaw);
  if (!proof) return jsonResponse({ error: WALLETS_LINK_PROBE.missingProofError }, allowedOrigin, 400);
  if (!consumeAuthChallenge(proof.payload)) return jsonResponse({ error: WALLETS_LINK_PROBE.challengeExpiredError }, allowedOrigin, 401);

  const verified = verifyTonProof({
    walletAddress,
    publicKey,
    proof,
    expectedDomain: resolveWalletsLinkExpectedDomain(allowedOrigin),
    maxSkewSeconds: WALLETS_LINK_PROBE.maxSkewSeconds,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  if (!verified.ok) return jsonResponse({ error: WALLETS_LINK_PROBE.invalidSignatureError, reason: verified.reason }, allowedOrigin, 401);

  const db = getDb();

  const [ownedByUser] = await db
    .select({ userId: schema.userTonWallets.userId })
    .from(schema.userTonWallets)
    .where(eq(schema.userTonWallets.address, walletAddress))
    .limit(1);
  const [ownedByPrimary] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.walletAddress, walletAddress))
    .limit(1);

  if ((ownedByUser && ownedByUser.userId !== ctx.user.id) || (ownedByPrimary && ownedByPrimary.id !== ctx.user.id)) {
    return jsonResponse({ error: WALLETS_LINK_PROBE.walletTakenError }, allowedOrigin, 409);
  }

  await db
    .insert(schema.userTonWallets)
    .values({ userId: ctx.user.id, address: walletAddress, label, isPrimary: false })
    .onConflictDoUpdate({
      target: schema.userTonWallets.address,
      set: { userId: ctx.user.id, label, updatedAt: new Date() },
    });

  if (setPrimary) {
    await db.update(schema.users).set({ walletAddress: walletAddress }).where(eq(schema.users.id, ctx.user.id));
    await db
      .update(schema.userTonWallets)
      .set({ isPrimary: sql`CASE WHEN ${schema.userTonWallets.address} = ${walletAddress} THEN true ELSE false END`, updatedAt: new Date() })
      .where(eq(schema.userTonWallets.userId, ctx.user.id));
  }

  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: ctx.user.id,
      expiresAt: new Date(Date.now() + WALLETS_LINK_PROBE.jwtTtlSeconds * 1000),
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .returning();

  const secret = getJwtSecretsFromEnv()[0];
  if (!secret) return jsonResponse({ error: WALLETS_LINK_PROBE.jwtNotConfiguredError }, allowedOrigin, 500);
  const token = await signJwt({ wallet: walletAddress, sid: session.id, sub: ctx.user.id }, secret, WALLETS_LINK_PROBE.jwtTtlSeconds);

  const bot = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();
  if (bot) {
    try {
      const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, ctx.user.id)).limit(1);
      if (!settings || settings.telegramNotificationsEnabled) {
        const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, ctx.user.id)).limit(1);
        const chatId = tg?.chatId ? Number.parseInt(String(tg.chatId), 10) : Number.NaN;
        if (tg && Number.isFinite(chatId)) {
          const { telegramSendMessage } = await import('../../telegram/lib');
          await telegramSendMessage(bot, chatId, buildWalletsLinkTelegramMessage(walletAddress));
        }
      }
    } catch {
      void 0;
    }
  }

  return jsonResponse(buildWalletsLinkSuccessBody(walletAddress, token), allowedOrigin, 200);
}