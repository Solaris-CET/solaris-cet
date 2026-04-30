type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
};

function provider(): 'resend' | 'postmark' | 'mailgun' {
  const raw = String(process.env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (raw === 'postmark' || raw === 'mailgun') return raw;
  return 'resend';
}

function fromAddress(): string {
  return String(process.env.EMAIL_FROM ?? 'Solaris CET <no-reply@solaris-cet.com>').trim();
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const p = provider();
  if (p === 'postmark') {
    const token = String(process.env.POSTMARK_SERVER_TOKEN ?? '').trim();
    if (!token) throw new Error('POSTMARK_SERVER_TOKEN is not set');
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: fromAddress(),
        To: input.to,
        Subject: input.subject,
        HtmlBody: input.html,
        TextBody: input.text ?? undefined,
        MessageStream: 'outbound',
      }),
    });
    if (!res.ok) {
      throw new Error(`Postmark error: ${res.status}`);
    }
    return;
  }

  if (p === 'mailgun') {
    throw new Error('Mailgun provider not configured in this build');
  }

  const key = String(process.env.RESEND_API_KEY ?? '').trim();
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text ?? undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error: ${res.status}`);
  }
}

