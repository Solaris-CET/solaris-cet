// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildGdprDsarMessage,
  GDPR_DSAR_PATH,
  GDPR_DSAR_PROBE,
  normalizeGdprDsarType,
  parseGdprDsarPostBody,
} from '../../api/lib/gdprDsar';

const dsarMocks = vi.hoisted(() => {
  const schema = {
    contacts: { email: 'contacts.email' },
    crmConversations: { id: 'crmConversations.id' },
    crmMessages: { body: 'crmMessages.body' },
  };

  const bag = {
    user: null as { id: string; walletAddress: string; role: string } | null,
    messageInserted: null as string | null,
  };

  const getDb = () => ({
    insert(table: unknown) {
      if (table === schema.contacts) {
        return {
          values() {
            return {
              onConflictDoUpdate() {
                return {
                  returning: async () => [{ id: 'contact-1' }],
                };
              },
              returning: async () => [{ id: 'contact-1' }],
            };
          },
        };
      }
      if (table === schema.crmConversations) {
        return {
          values() {
            return {
              returning: async () => [{ id: 'conv-1' }],
            };
          },
        };
      }
      if (table === schema.crmMessages) {
        return {
          values: async (row: { body: string }) => {
            bag.messageInserted = row.body;
          },
        };
      }
      throw new Error('unknown table');
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => dsarMocks.user,
}));

vi.mock('../../db/client', () => ({
  getDb: dsarMocks.getDb,
  schema: dsarMocks.schema,
}));

import gdprDsarRoute, { GDPR_DSAR_PROBE as routeProbe } from '../../api/gdpr/dsar/route';

function dsarRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${GDPR_DSAR_PATH}`, { ...init, headers });
}

describe('gdprDsar helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(GDPR_DSAR_PROBE.path).toBe('/api/gdpr/dsar');
    expect(routeProbe.rateLimitKey).toBe('gdpr_dsar');
  });

  it('parseGdprDsarPostBody and normalizeGdprDsarType', () => {
    const parsed = parseGdprDsarPostBody({ type: 'access', message: 'Please export my data', email: 'User@Example.com' });
    expect(normalizeGdprDsarType(parsed.type)).toBe('access');
    expect(parsed.email).toBe('user@example.com');
    expect(buildGdprDsarMessage(parsed, 'access', null)).toContain('Please export my data');
  });
});

describe('/api/gdpr/dsar e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dsarMocks.user = null;
    dsarMocks.messageInserted = null;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(GDPR_DSAR_PATH);
    expect(src).toContain('api/gdpr/dsar/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await gdprDsarRoute(dsarRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without email for anonymous user returns 400', async () => {
    const res = await gdprDsarRoute(
      dsarRequest({ method: 'POST', body: JSON.stringify({ type: 'access', message: 'Export please' }) }),
    );
    expect(res.status).toBe(400);
  });

  it('POST creates DSAR conversation', async () => {
    const res = await gdprDsarRoute(
      dsarRequest({
        method: 'POST',
        body: JSON.stringify({ type: 'delete', message: 'Delete my account data', email: 'user@example.com' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; conversationId: string };
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBe('conv-1');
    expect(dsarMocks.messageInserted).toContain('Delete my account data');
  });
});