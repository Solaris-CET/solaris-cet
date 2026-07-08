// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AIRDROP_PROOF_PATH,
  AIRDROP_PROOF_PROBE,
  parseAirdropProofNetwork,
  parseAirdropProofsEnv,
  parseAirdropProofWallet,
} from '../../api/lib/airdropProof';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

import airdropProofRoute, { AIRDROP_PROOF_PROBE as routeProbe } from '../../api/airdrop/proof/route';

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

function proofRequest(path: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${path}`, { ...init, headers });
}

describe('airdropProof helpers', () => {
  it('parseAirdropProofWallet and network', () => {
    expect(parseAirdropProofWallet(new URLSearchParams(`wallet=${VALID_WALLET}`))).toBe(VALID_WALLET);
    expect(parseAirdropProofNetwork(new URLSearchParams('network=testnet'))).toBe('testnet');
    expect(parseAirdropProofNetwork(new URLSearchParams())).toBe('mainnet');
  });

  it('parseAirdropProofsEnv parses JSON map', () => {
    const proofs = parseAirdropProofsEnv(JSON.stringify({ [VALID_WALLET]: { amountNanoCET: '100', proof: ['a'], index: 0 } }));
    expect(proofs?.[VALID_WALLET]?.amountNanoCET).toBe('100');
    expect(parseAirdropProofsEnv('bad')).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(AIRDROP_PROOF_PROBE.path).toBe('/api/airdrop/proof');
    expect(routeProbe.rateLimitKey).toBe('airdrop-proof');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/airdrop/proof e2e probe', () => {
  const envBackup = {
    merkle: process.env.AIRDROP_MERKLE_ROOT,
    proofs: process.env.AIRDROP_PROOFS_JSON,
    expires: process.env.AIRDROP_EXPIRES_AT,
  };

  beforeEach(() => {
    delete process.env.AIRDROP_MERKLE_ROOT;
    delete process.env.AIRDROP_PROOFS_JSON;
    delete process.env.AIRDROP_EXPIRES_AT;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.AIRDROP_MERKLE_ROOT = envBackup.merkle;
    process.env.AIRDROP_PROOFS_JSON = envBackup.proofs;
    process.env.AIRDROP_EXPIRES_AT = envBackup.expires;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AIRDROP_PROOF_PATH);
    expect(src).toContain('api/airdrop/proof/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await airdropProofRoute(proofRequest(AIRDROP_PROOF_PATH, { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET rejects invalid wallet', async () => {
    const res = await airdropProofRoute(proofRequest(`${AIRDROP_PROOF_PATH}?wallet=bad`, { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AIRDROP_PROOF_PROBE.invalidAddressError);
  });

  it('GET returns not_configured when env missing', async () => {
    const res = await airdropProofRoute(
      proofRequest(`${AIRDROP_PROOF_PATH}?wallet=${encodeURIComponent(VALID_WALLET)}`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe(AIRDROP_PROOF_PROBE.notConfiguredError);
  });

  it('GET returns eligible proof when configured', async () => {
    process.env.AIRDROP_MERKLE_ROOT = 'root-hash';
    process.env.AIRDROP_PROOFS_JSON = JSON.stringify({
      [VALID_WALLET]: { amountNanoCET: '500000000', proof: ['leaf', 'root'], index: 2 },
    });
    const res = await airdropProofRoute(
      proofRequest(`${AIRDROP_PROOF_PATH}?wallet=${encodeURIComponent(VALID_WALLET)}`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; eligible: boolean; amountNanoCET?: string };
    expect(body.ok).toBe(true);
    expect(body.eligible).toBe(true);
    expect(body.amountNanoCET).toBe('500000000');
  });

  it('POST returns 405', async () => {
    const res = await airdropProofRoute(proofRequest(AIRDROP_PROOF_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});