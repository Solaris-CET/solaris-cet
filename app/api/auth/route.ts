/**
 * POST /api/auth — sync TON wallet → PostgreSQL (users).
 * Node.js runtime (Postgres TCP). Do not set runtime to 'edge'.
 */
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getAllowedOrigin } from '../lib/cors';
import { getDb, schema } from '../../db/client';

export const config = { runtime: 'nodejs' };

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
      },
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

    const walletAddress =
      typeof body === 'object' &&
      body !== null &&
      'walletAddress' in body &&
      typeof (body as { walletAddress: unknown }).walletAddress === 'string'
        ? (body as { walletAddress: string }).walletAddress.trim()
        : '';

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Adresa lipsește' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.walletAddress, walletAddress));

    if (existing) {
      return new Response(JSON.stringify(existing), {
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

        return new Response(JSON.stringify(newUser), {
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
