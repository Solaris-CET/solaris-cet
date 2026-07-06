import type { TwinWebhookDeliveriesResponse } from './twinWebhook';

export async function fetchTwinWebhookDeliveries(
  limit = 40,
  direction?: 'inbound' | 'outbound',
): Promise<TwinWebhookDeliveriesResponse> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (direction) qs.set('direction', direction);
  const res = await fetch(`/api/survey/twin-webhook/deliveries?${qs}`);
  const data = (await res.json()) as TwinWebhookDeliveriesResponse & { error?: string };
  if (!res.ok) throw new Error(data.error || 'Twin webhook deliveries indisponibile');
  return data;
}

export async function postTwinWebhookInbound(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch('/api/survey/twin-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Twin webhook inbound eșuat');
  return data;
}