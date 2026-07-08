// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AIRDROP_TX_PATH, AIRDROP_TX_PROBE, parseAirdropTxBody } from '../../api/lib/airdropTx';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

import airdropTxRoute, { AIRDROP_TX_PROBE as routeProbe } from '../../api/airdrop/tx/route';

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
const CLAIM_CONTRACT = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

function txRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AIRDROP_TX_PATH}`, { ...init, headers });
}

describe('airdropTx helpers', () => {
  it('parseAirdropTxBody reads wallet and network', () => {
    expect(parseAirdropTxBody({ wallet: ` ${VALID_WALLET} `, network: 'testnet' })).toEqual({
      wallet: VALID_WALLET,
      network: 'testnet',
    });
    expect(parseAirdropTxBody({})).toEqual({ wallet: '', network: 'mainnet' });
  });

  it('exports stable e2e probe contract', () => {
    expect(AIRDROP_TX_PROBE.path).toBe('/api/airdrop/tx');
    expect(routeProbe.rateLimitKey).toBe('airdrop-tx');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/airdrop/tx e2e probe', () => {
  const envBackup = {
    contract: process.env.AIRDROP_CLAIM_CONTRACT,
    fee: process.env.AIRDROP_CLAIM_FEE_NANO_TON,
    payload: process.env.AIRDROP_CLAIM_PAYLOAD_BASE64,
  };

  beforeEach(() => {
    delete process.env.AIRDROP_CLAIM_CONTRACT;
    delete process.env.AIRDROP_CLAIM_FEE_NANO_TON;
    delete process.env.AIRDROP_CLAIM_PAYLOAD_BASE64;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.AIRDROP_CLAIM_CONTRACT = envBackup.contract;
    process.env.AIRDROP_CLAIM_FEE_NANO_TON = envBackup.fee;
    process.env.AIRDROP_CLAIM_PAYLOAD_BASE64 = envBackup.payload;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AIRDROP_TX_PATH);
    expect(src).toContain('api/airdrop/tx/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await airdropTxRoute(txRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects invalid wallet', async () => {
    const res = await airdropTxRoute(
      txRequest({ method: 'POST', body: JSON.stringify({ wallet: 'bad' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AIRDROP_TX_PROBE.invalidAddressError);
  });

  it('POST returns not_configured without contract', async () => {
    const res = await airdropTxRoute(
      txRequest({ method: 'POST', body: JSON.stringify({ wallet: VALID_WALLET }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe(AIRDROP_TX_PROBE.notConfiguredError);
  });

  it('POST returns claim tx payload when configured', async () => {
    process.env.AIRDROP_CLAIM_CONTRACT = CLAIM_CONTRACT;
    process.env.AIRDROP_CLAIM_FEE_NANO_TON = '1000000';
    const res = await airdropTxRoute(
      txRequest({ method: 'POST', body: JSON.stringify({ wallet: VALID_WALLET, network: 'mainnet' }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; to: string; amountNanoTon: string };
    expect(body.ok).toBe(true);
    expect(body.to).toBe(CLAIM_CONTRACT);
    expect(body.amountNanoTon).toBe('1000000');
  });

  it('GET returns 405', async () => {
    const res = await airdropTxRoute(txRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});