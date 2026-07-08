export const ALERTS_PATH = '/api/alerts';
export const ALERTS_METHODS = 'GET, POST, DELETE, OPTIONS';

export const ALERTS_PROBE = {
  path: ALERTS_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  missingIdError: 'Missing id' as const,
  invalidInputError: 'Invalid input' as const,
  notFoundError: 'Not found' as const,
  defaultAsset: 'CET' as const,
  defaultChannel: 'email' as const,
  defaultCooldownMinutes: 60,
  minCooldownMinutes: 1,
  maxCooldownMinutes: 24 * 60,
};

export function parseAlertDirection(v: unknown): 'above' | 'below' | null {
  if (v === 'above' || v === 'below') return v;
  return null;
}

export function parseAlertChannel(v: unknown): 'email' | 'push' | null {
  if (v === 'email' || v === 'push') return v;
  return null;
}

export function parseAlertAsset(v: unknown): 'CET' | 'TON' | null {
  if (v === 'CET' || v === 'TON') return v;
  return null;
}

export function parseAlertTargetUsd(v: unknown): string | null {
  const raw = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return raw;
}

export function parseAlertCooldownMinutes(v: unknown): number {
  if (typeof v !== 'number') return ALERTS_PROBE.defaultCooldownMinutes;
  return Math.max(ALERTS_PROBE.minCooldownMinutes, Math.min(ALERTS_PROBE.maxCooldownMinutes, Math.floor(v)));
}

export function parseAlertDeleteId(searchParams: URLSearchParams): string {
  return String(searchParams.get('id') ?? '').trim();
}

export type AlertPostBody = {
  id: string | null;
  asset: 'CET' | 'TON';
  direction: 'above' | 'below';
  targetUsd: string;
  channel: 'email' | 'push';
  cooldownMinutes: number;
};

export function parseAlertPostBody(body: unknown): AlertPostBody | null {
  const id = typeof (body as { id?: unknown })?.id === 'string' ? (body as { id: string }).id.trim() : null;
  const asset = parseAlertAsset((body as { asset?: unknown })?.asset) ?? ALERTS_PROBE.defaultAsset;
  const direction = parseAlertDirection((body as { direction?: unknown })?.direction);
  const targetUsd = parseAlertTargetUsd((body as { targetUsd?: unknown })?.targetUsd);
  const channel = parseAlertChannel((body as { channel?: unknown })?.channel) ?? ALERTS_PROBE.defaultChannel;
  const cooldownMinutes = parseAlertCooldownMinutes((body as { cooldownMinutes?: unknown })?.cooldownMinutes);
  if (!direction || !targetUsd) return null;
  return { id, asset, direction, targetUsd, channel, cooldownMinutes };
}