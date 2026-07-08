export const WEB3_INTENTS_PATH = '/api/web3/intents';
export const WEB3_INTENTS_METHODS = 'GET, POST, OPTIONS';

export const WEB3_INTENTS_PROBE = {
  path: WEB3_INTENTS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  listLimit: 50,
  maxHashLength: 220,
  maxProviderRefLength: 220,
  defaultStatus: 'created' as const,
  invalidTypeError: 'Invalid type' as const,
  invalidJsonError: 'Invalid JSON' as const,
};

export const WEB3_INTENT_TYPES = ['stake', 'unstake', 'claim', 'vote', 'bridge', 'onramp'] as const;
export type Web3IntentType = (typeof WEB3_INTENT_TYPES)[number];

export const WEB3_INTENT_STATUSES = ['created', 'pending', 'confirmed', 'failed'] as const;
export type Web3IntentStatus = (typeof WEB3_INTENT_STATUSES)[number];

export function parseWeb3IntentType(v: unknown): Web3IntentType | null {
  if (typeof v !== 'string') return null;
  return (WEB3_INTENT_TYPES as readonly string[]).includes(v) ? (v as Web3IntentType) : null;
}

export function parseWeb3IntentStatus(v: unknown): Web3IntentStatus | null {
  if (typeof v !== 'string') return null;
  return (WEB3_INTENT_STATUSES as readonly string[]).includes(v) ? (v as Web3IntentStatus) : null;
}

export type Web3IntentCreateInput = {
  type: Web3IntentType;
  status: Web3IntentStatus;
  txHash: string | null;
  providerRef: string | null;
  meta: Record<string, unknown> | null;
};

export function parseWeb3IntentCreateBody(body: unknown): Web3IntentCreateInput | null {
  const type = parseWeb3IntentType((body as { type?: unknown })?.type);
  if (!type) return null;
  const status = parseWeb3IntentStatus((body as { status?: unknown })?.status) ?? WEB3_INTENTS_PROBE.defaultStatus;
  const txHash =
    typeof (body as { txHash?: unknown })?.txHash === 'string'
      ? (body as { txHash: string }).txHash.trim().slice(0, WEB3_INTENTS_PROBE.maxHashLength)
      : null;
  const providerRef =
    typeof (body as { providerRef?: unknown })?.providerRef === 'string'
      ? (body as { providerRef: string }).providerRef.trim().slice(0, WEB3_INTENTS_PROBE.maxProviderRefLength)
      : null;
  const metaRaw = (body as { meta?: unknown })?.meta;
  const meta = metaRaw && typeof metaRaw === 'object' ? (metaRaw as Record<string, unknown>) : null;
  return { type, status, txHash, providerRef, meta };
}

export type Web3IntentListItem = {
  id: string;
  type: string;
  status: string;
  txHash: string | null;
  providerRef: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

function normalizeMeta(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

export function mapWeb3IntentRow(row: {
  id: string;
  type: string;
  status: string;
  txHash: string | null;
  providerRef: string | null;
  meta: unknown;
  createdAt: Date;
}): Web3IntentListItem {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    txHash: row.txHash ?? null,
    providerRef: row.providerRef ?? null,
    meta: normalizeMeta(row.meta),
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildWeb3IntentsListResponse(intents: Web3IntentListItem[]) {
  return { ok: true as const, intents };
}

export function buildWeb3IntentCreateResponse(id: string) {
  return { ok: true as const, id };
}