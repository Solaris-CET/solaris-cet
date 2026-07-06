/**
 * POST /api/newsletter/confirm — completes double opt-in flow.
 * Node.js runtime (Postgres TCP + email provider).
 */
import { and, eq } from 'drizzle-orm'

import { getDb, schema } from '../../../db/client'
import { getAllowedOrigin } from '../../lib/cors'
import { newsletterWelcomeEmail, onboardingEmail } from '../../lib/emailTemplates'
import { withRateLimit } from '../../lib/rateLimit'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  const allowedOrigin = getAllowedOrigin(origin)

  if (origin && allowedOrigin !== origin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'newsletter-confirm',
    limit: 12,
    windowSeconds: 60,
  })
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  const token =
    typeof body === 'object' && body !== null && typeof (body as { token?: unknown }).token === 'string'
      ? String((body as { token: string }).token).trim()
      : ''
  if (!token || token.length < 10 || token.length > 300) {
    return new Response(JSON.stringify({ status: 'invalid' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  const db = getDb()
  const [record] = await db
    .select()
    .from(schema.newsletterSubscriptions)
    .where(eq(schema.newsletterSubscriptions.verifyToken, token))
    .limit(1)

  if (!record) {
    return new Response(JSON.stringify({ status: 'invalid' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  if (record.status === 'active') {
    return new Response(JSON.stringify({ status: 'already_confirmed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    })
  }

  await db
    .update(schema.newsletterSubscriptions)
    .set({ status: 'active', verifiedAt: new Date() })
    .where(and(eq(schema.newsletterSubscriptions.id, record.id), eq(schema.newsletterSubscriptions.status, 'pending')))

  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, record.contactId)).limit(1)
  const email = contact?.email
  if (email) {
    const welcome = newsletterWelcomeEmail(req)
    await db.insert(schema.emailOutbox).values({
      toEmail: email,
      template: 'newsletter_welcome',
      subject: welcome.subject,
      html: welcome.html,
      textBody: welcome.text,
      sendAfter: new Date(Date.now() + 15_000),
    })
    const s1 = onboardingEmail(req, 1)
    const s2 = onboardingEmail(req, 2)
    const s3 = onboardingEmail(req, 3)
    await db.insert(schema.emailOutbox).values([
      {
        toEmail: email,
        template: 'onboarding_1',
        subject: s1.subject,
        html: s1.html,
        textBody: s1.text,
        sendAfter: new Date(Date.now() + 60 * 60 * 1000),
      },
      {
        toEmail: email,
        template: 'onboarding_2',
        subject: s2.subject,
        html: s2.html,
        textBody: s2.text,
        sendAfter: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        toEmail: email,
        template: 'onboarding_3',
        subject: s3.subject,
        html: s3.html,
        textBody: s3.text,
        sendAfter: new Date(Date.now() + 96 * 60 * 60 * 1000),
      },
    ])
  }

  return new Response(JSON.stringify({ status: 'confirmed' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  })
}
