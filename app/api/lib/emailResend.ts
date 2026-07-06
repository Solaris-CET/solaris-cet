type SendEmailInput = {
  from: string
  to: string
  subject: string
  html: string
  text: string
}

function readResendKey(): string {
  return String(process.env.RESEND_API_KEY ?? '').trim()
}

export function isResendConfigured(): boolean {
  return Boolean(readResendKey())
}

export async function sendResendEmail(input: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = readResendKey()
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    })

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { message?: unknown } | null
      const msg = typeof payload?.message === 'string' ? payload.message : 'Resend rejected'
      return { ok: false, error: msg }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Resend unavailable' }
  }
}

