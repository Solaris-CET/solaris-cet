import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyTelegramInitData } from '../../api/telegram/initData';

function hmacSha256Hex(key: Buffer | string, message: string): string {
  return createHmac('sha256', key).update(message).digest('hex');
}

function buildInitData(botToken: string, params: Record<string, string>): string {
  const entries = Object.entries(params).filter(([k]) => k !== 'hash');
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const check = entries.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = hmacSha256Hex(secretKey, check);
  const qs = new URLSearchParams({ ...params, hash });
  return qs.toString();
}

describe('verifyTelegramInitData', () => {
  it('acceptă initData semnat corect', () => {
    const token = '123:abc';
    const nowMs = 1_700_000_000_000;
    const authDate = Math.floor(nowMs / 1000);
    const initData = buildInitData(token, {
      auth_date: String(authDate),
      query_id: 'AAEAAAE',
      user: JSON.stringify({ id: 123456, username: 'solaris' }),
    });
    const res = verifyTelegramInitData(initData, token, { nowMs, maxAgeSeconds: 3600 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user?.id).toBe(123456);
      expect(res.user?.username).toBe('solaris');
    }
  });

  it('respinge initData modificat', () => {
    const token = '123:abc';
    const nowMs = 1_700_000_000_000;
    const authDate = Math.floor(nowMs / 1000);
    const initData = buildInitData(token, {
      auth_date: String(authDate),
      query_id: 'AAEAAAE',
      user: JSON.stringify({ id: 123456, username: 'solaris' }),
    });
    const tampered = initData.replace('solaris', 'evil');
    const res = verifyTelegramInitData(tampered, token, { nowMs, maxAgeSeconds: 3600 });
    expect(res.ok).toBe(false);
  });

  it('respinge initData expirat', () => {
    const token = '123:abc';
    const nowMs = 1_700_000_000_000;
    const authDate = Math.floor(nowMs / 1000) - 10_000;
    const initData = buildInitData(token, {
      auth_date: String(authDate),
      query_id: 'AAEAAAE',
      user: JSON.stringify({ id: 123456 }),
    });
    const res = verifyTelegramInitData(initData, token, { nowMs, maxAgeSeconds: 60 });
    expect(res.ok).toBe(false);
  });
});

