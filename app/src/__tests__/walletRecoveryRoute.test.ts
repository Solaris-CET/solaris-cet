// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildWalletRecoveryResponse,
  parseWalletRecoveryBody,
  WALLET_RECOVERY_PATH,
  WALLET_RECOVERY_PROBE,
  WALLET_RECOVERY_STEPS,
} from '../../api/lib/walletRecovery';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import walletRecoveryRoute, { WALLET_RECOVERY_PROBE as routeProbe } from '../../api/recovery/route';

const wallet = 'EQTestWalletAddress1234567890123456789012345';

function recoveryRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${WALLET_RECOVERY_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('walletRecovery helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WALLET_RECOVERY_PROBE.path).toBe('/api/recovery');
    expect(routeProbe.recoveryOptions).toContain('Seed phrase');
  });

  it('buildWalletRecoveryResponse handles missing wallet', () => {
    const payload = buildWalletRecoveryResponse(null);
    expect(payload.message).toBe(WALLET_RECOVERY_PROBE.missingWalletMessage);
    expect(payload.recoverySteps).toEqual(WALLET_RECOVERY_STEPS);
  });

  it('parseWalletRecoveryBody extracts wallet', () => {
    expect(parseWalletRecoveryBody({ wallet })).toBe(wallet);
    expect(parseWalletRecoveryBody({ wallet: 'x' })).toBeNull();
  });
});

describe('/api/recovery e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WALLET_RECOVERY_PATH);
    expect(src).toContain('api/recovery/route.js');
  });

  it('POST without wallet returns guided steps', async () => {
    const res = await walletRecoveryRoute(recoveryRequest({}));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; options: string[] };
    expect(body.message).toBe(WALLET_RECOVERY_PROBE.missingWalletMessage);
    expect(body.options).toContain('Contact support');
  });

  it('POST with wallet returns next actions', async () => {
    const res = await walletRecoveryRoute(recoveryRequest({ wallet }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { wallet: string; nextActions: string[] };
    expect(body.wallet).toBe(wallet);
    expect(body.nextActions).toContain('Open in Tonkeeper');
  });
});