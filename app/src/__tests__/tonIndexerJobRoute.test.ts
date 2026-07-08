// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  extractTonIndexerEventHash,
  extractTonIndexerEventKind,
  extractTonIndexerEventTimestampIso,
  parseTonIndexerLimit,
  TON_INDEXER_JOB_PATH,
  TON_INDEXER_JOB_PROBE,
  tonIndexerAsString,
} from '../../api/lib/tonIndexerJob';

const indexerMocks = vi.hoisted(() => {
  const schema = {
    users: { walletAddress: 'users.walletAddress', createdAt: 'users.createdAt' },
    tonIndexedTransactions: { id: 'tonIndexedTransactions.id' },
  };

  const bag = {
    users: [{ walletAddress: 'EQUserWallet12345678901234567890123456789012' }],
    upsertCalls: 0,
    insertedTotal: 1,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.users) {
            return {
              orderBy() {
                return {
                  limit: async () => bag.users,
                };
              },
            };
          }
          return { limit: async () => [] };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/cron', () => ({
  requireCron: (req: Request) => req.headers.get('X-Cron-Secret') === 'test-secret',
}));

vi.mock('../../db/client', () => ({
  getDb: indexerMocks.getDb,
  schema: indexerMocks.schema,
}));

vi.mock('../../api/lib/tonIndexerJob', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonIndexerJob')>();
  return {
    ...actual,
    upsertTonIndexerEventsForAddress: vi.fn(async () => {
      indexerMocks.upsertCalls += 1;
      return { ok: true, inserted: indexerMocks.insertedTotal };
    }),
  };
});

import tonIndexerJobRoute, { TON_INDEXER_JOB_PROBE as routeProbe } from '../../api/jobs/ton-indexer/route';

function indexerRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Cron-Secret', 'test-secret');
  return new Request(`http://test${TON_INDEXER_JOB_PATH}`, { ...init, headers });
}

describe('tonIndexerJob helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_INDEXER_JOB_PROBE.path).toBe('/api/jobs/ton-indexer');
    expect(routeProbe.cronAuthRequired).toBe(true);
    expect(routeProbe.defaultLimit).toBe(30);
  });

  it('tonIndexerAsString normalizes values', () => {
    expect(tonIndexerAsString('abc')).toBe('abc');
    expect(tonIndexerAsString(42)).toBe('42');
    expect(tonIndexerAsString(null)).toBe('');
  });

  it('extractTonIndexerEventKind detects transfer vs contract', () => {
    expect(extractTonIndexerEventKind({ actions: [{ type: 'JettonTransfer' }] })).toBe('transfer');
    expect(extractTonIndexerEventKind({ actions: [{ type: 'ContractDeploy' }] })).toBe('contract');
    expect(extractTonIndexerEventKind({})).toBe('contract');
  });

  it('extractTonIndexerEventHash prefers event_id', () => {
    expect(extractTonIndexerEventHash({ event_id: 'evt-1', tx_hash: 'tx-2' })).toBe('evt-1');
    expect(extractTonIndexerEventHash({ tx_hash: 'tx-2' })).toBe('tx-2');
  });

  it('extractTonIndexerEventTimestampIso parses unix seconds', () => {
    const iso = extractTonIndexerEventTimestampIso({ timestamp: '1700000000' });
    expect(iso).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('parseTonIndexerLimit clamps to probe bounds', () => {
    expect(parseTonIndexerLimit('999')).toBe(TON_INDEXER_JOB_PROBE.maxLimit);
    expect(parseTonIndexerLimit('1')).toBe(TON_INDEXER_JOB_PROBE.minLimit);
    expect(parseTonIndexerLimit(null)).toBe(TON_INDEXER_JOB_PROBE.defaultLimit);
  });
});

describe('/api/jobs/ton-indexer e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    indexerMocks.upsertCalls = 0;
    indexerMocks.insertedTotal = 1;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_INDEXER_JOB_PATH);
    expect(src).toContain('api/jobs/ton-indexer/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await tonIndexerJobRoute(indexerRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without cron auth returns 401', async () => {
    const res = await tonIndexerJobRoute(
      new Request(`http://test${TON_INDEXER_JOB_PATH}`, { method: 'POST', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(401);
  });

  it('POST indexes wallet addresses', async () => {
    const res = await tonIndexerJobRoute(indexerRequest({ method: 'POST' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; processed: number; inserted: number; network: string };
    expect(body.ok).toBe(true);
    expect(body.network).toBe('mainnet');
    expect(body.processed).toBeGreaterThan(0);
    expect(body.inserted).toBeGreaterThan(0);
    expect(indexerMocks.upsertCalls).toBe(body.processed);
  });
});