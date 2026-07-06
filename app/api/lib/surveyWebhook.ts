/** POST webhook when survey events occur (CRM, report complete). */

export async function dispatchSurveyWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = String(process.env.SURVEY_WEBHOOK_URL ?? '').trim();
  if (!url) return;

  const secret = String(process.env.SURVEY_WEBHOOK_SECRET ?? '').trim();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Survey-Secret': secret } : {}),
      },
      body: JSON.stringify({ ...payload, source: 'solaris-cet-survey', at: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('survey webhook failed', res.status, body.slice(0, 500));
    }
  } catch (err) {
    console.error('survey webhook error', err);
  }
}