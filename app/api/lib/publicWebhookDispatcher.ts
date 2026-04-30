import { randomUUID } from 'node:crypto';

import { signWebhookBody } from './publicWebhookCrypto';

export type DispatchResult = {
  httpStatus: number | null;
  error: string | null;
  durationMs: number;
};

export type DeliveryRecord = {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  httpStatus: number | null;
  error: string | null;
  durationMs: number | null;
  nextRetryAt: Date | null;
  createdAt: Date;
};

function shouldRetry(status: number | null): boolean {
  if (status === null) return true;
  if (status === 408 || status === 429) return true;
  if (status >= 500) return true;
  return false;
}

function nextBackoffSeconds(attempt: number): number {
  const base = Math.min(30 * 60, Math.max(10, Math.floor(10 * 2 ** Math.max(0, attempt - 1))));
  const jitter = Math.floor(Math.random() * 4);
  return base + jitter;
}

async function deliverOnce(opts: {
  endpointUrl: string;
  secret: string;
  eventId: string;
  eventType: string;
  body: string;
  attempt: number;
}): Promise<DispatchResult> {
  const signature = signWebhookBody(opts.secret, opts.body);
  const controller = new AbortController();
  const t0 = Date.now();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(opts.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SolarisCET-Webhooks/1.0',
        'X-Webhook-Event': opts.eventType,
        'X-Webhook-Id': opts.eventId,
        'X-Webhook-Attempt': String(opts.attempt),
        'X-Webhook-Signature': signature,
      },
      body: opts.body,
      signal: controller.signal,
    });
    return { httpStatus: res.status, error: null, durationMs: Date.now() - t0 };
  } catch (e) {
    return { httpStatus: null, error: e instanceof Error ? e.message : 'network error', durationMs: Date.now() - t0 };
  } finally {
    clearTimeout(timeout);
  }
}

function schedule(fn: () => Promise<void>, delaySeconds: number) {
  const delayMs = Math.max(1000, delaySeconds * 1000);
  setTimeout(() => {
    void fn();
  }, delayMs);
}

export async function dispatchWithRetry(opts: {
  endpointId: string;
  endpointUrl: string;
  secret: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  onRecord: (d: DeliveryRecord) => Promise<void> | void;
  maxAttempts?: number;
}): Promise<void> {
  const maxAttempts = Math.min(10, Math.max(1, opts.maxAttempts ?? 5));
  const body = JSON.stringify({ id: opts.eventId, type: opts.eventType, createdAt: new Date().toISOString(), data: opts.payload });

  const runAttempt = async (attempt: number): Promise<void> => {
    const r = await deliverOnce({
      endpointUrl: opts.endpointUrl,
      secret: opts.secret,
      eventId: opts.eventId,
      eventType: opts.eventType,
      body,
      attempt,
    });

    const willRetry = shouldRetry(r.httpStatus) && attempt < maxAttempts;
    const nextRetryAt = willRetry ? new Date(Date.now() + nextBackoffSeconds(attempt) * 1000) : null;

    const record: DeliveryRecord = {
      id: randomUUID(),
      endpointId: opts.endpointId,
      eventId: opts.eventId,
      attempt,
      httpStatus: r.httpStatus,
      error: r.error ? r.error.slice(0, 800) : null,
      durationMs: r.durationMs,
      nextRetryAt,
      createdAt: new Date(),
    };
    await opts.onRecord(record);

    if (willRetry && nextRetryAt) {
      schedule(() => runAttempt(attempt + 1), Math.ceil((nextRetryAt.getTime() - Date.now()) / 1000));
    }
  };

  await runAttempt(1);
}

