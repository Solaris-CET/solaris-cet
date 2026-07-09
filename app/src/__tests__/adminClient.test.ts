// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminApi, adminApiErr, parseLeadsTotal } from '@/admin/adminClient';

describe('adminApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('returns data on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ id: '1' }] }),
    });

    const res = await adminApi<{ users: { id: string }[] }>('/api/admin/users', { token: 'tok' });

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.users[0]?.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
    }));
  });

  it('returns error string from JSON payload', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ error: 'Not allowed' }),
    });

    const res = await adminApi<unknown>('/api/admin/me', { token: 'tok' });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(403);
      expect(res.error).toBe('Not allowed');
      expect(adminApiErr(res)).toBe('Not allowed');
    }
  });

  it('falls back to statusText when body has no error field', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => null,
    });

    const res = await adminApi<unknown>('/api/admin/me', { token: null });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('Server Error');
  });

  it('parseLeadsTotal accepts numeric total', () => {
    expect(parseLeadsTotal({ total: 3 })).toBe(3);
    expect(parseLeadsTotal({ total: 'x' })).toBe(0);
    expect(parseLeadsTotal(null)).toBe(0);
  });

  it('adminApiErr returns null for success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const res = await adminApi<{ ok: true }>('/api/admin/ping', { token: 'x' });
    expect(adminApiErr(res)).toBeNull();
  });
});