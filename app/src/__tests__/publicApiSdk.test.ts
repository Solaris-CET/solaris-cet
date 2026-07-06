import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { createSolarisClient } from '@/lib/publicApiSdk';

describe('publicApiSdk', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('sends X-API-Key and builds url with query', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: [], nextCursor: null }) });
    const client = createSolarisClient({ apiKey: 'cet_sk_test', baseUrl: 'https://example.com' });
    await client.v1.transactions.list({ limit: 10, cursor: 'abc' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com/api/v1/transactions?limit=10&cursor=abc');
    expect(init.headers).toMatchObject({ 'X-API-Key': 'cet_sk_test' });
  });

  it('survey.client calls twin-feed path', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ feed: { schema: 'solaris-twin-feed-v1' } }) });
    const client = createSolarisClient({ apiKey: 'cet_sk_test', baseUrl: 'https://example.com' });
    await client.survey.twinFeed('SOL-1');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/survey/twin-feed?report_id=SOL-1');
  });

  it('survey.twinEvents calls twin-events path', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ events: [] }) });
    const client = createSolarisClient({ apiKey: 'cet_sk_test', baseUrl: 'https://example.com' });
    await client.survey.twinEvents('SOL-1', 5);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/survey/twin-events');
    expect(url).toContain('report_id=SOL-1');
  });

  it('survey.installerMe forwards X-Installer-Key', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ installer: { installer_id: 'INST-1' } }) });
    const client = createSolarisClient({ apiKey: 'cet_sk_test', baseUrl: 'https://example.com' });
    await client.survey.installerMe('inst-secret');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-Installer-Key']).toBe('inst-secret');
  });

  it('throws with message from API error payload', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid API key' } }) });
    const client = createSolarisClient({ apiKey: 'bad', baseUrl: 'https://example.com' });
    await expect(client.v1.price()).rejects.toThrow('Invalid API key');
  });
});

