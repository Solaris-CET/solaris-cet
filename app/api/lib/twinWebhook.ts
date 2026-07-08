/** Bidirectional CRM twin webhooks — Node bridge layer. */

import { fetchWithRetry } from './fetchRetry';

export const TWIN_WEBHOOK_SCHEMA = 'solaris-twin-webhook-v1';

export async function dispatchTwinWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = String(process.env.TWIN_WEBHOOK_URL ?? '').trim();
  if (!url) return;

  const secret = String(process.env.TWIN_WEBHOOK_SECRET ?? '').trim();
  try {
    const res = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-Twin-Webhook-Secret': secret } : {}),
        },
        body: JSON.stringify({
          schema: TWIN_WEBHOOK_SCHEMA,
          direction: 'outbound',
          source: 'solaris-cet-survey-bridge',
          at: new Date().toISOString(),
          ...payload,
        }),
      },
      { maxAttempts: 5, baseMs: 500, maxDelayMs: 10_000 },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('twin webhook failed after retries', res.status, body.slice(0, 500));
    }
  } catch (err) {
    console.error('twin webhook error', err);
  }
}
