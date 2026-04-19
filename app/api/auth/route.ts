/**
 * POST /api/auth — sync TON wallet → PostgreSQL (users).
 * Node.js runtime (Postgres TCP). Do not set runtime to 'edge'.
 */
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getAllowedOrigin } from '../lib/cors';
import { getDb, schema } from '../../db/client';
import { getJwtSecretsFromEnv, signJwt, verifyJwtWithSecrets } from '../lib/jwt';
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

function clientIp(req: Request): string | null {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first.slice(0, 200);
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
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

    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.walletAddress, walletAddress));

    if (existing) {
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
