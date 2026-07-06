// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchInstallerMe, fetchInstallersAggregate } from '@/lib/installerApi';
import type { InstallerProfile } from '@/lib/surveyApi';

const installer: InstallerProfile = {
  installerId: 'INST-1',
  installerName: 'Alex',
  company: 'Solaris CET',
  installerApiKey: 'secret-key',
};

describe('installerApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('fetchInstallerMe sends X-Installer-Key header', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        installer: { installer_id: 'INST-1', report_count: 2, api_key_configured: true, stats: {}, recent_reports: [] },
      }),
    });
    const profile = await fetchInstallerMe(installer);
    expect(profile.installer_id).toBe('INST-1');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'X-Installer-Key': 'secret-key' });
  });

  it('fetchInstallersAggregate uses admin bearer token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ installers: [{ installer_id: 'INST-1', report_count: 1 }] }),
    });
    const rows = await fetchInstallersAggregate('admin-token');
    expect(rows).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: 'Bearer admin-token' });
  });
});