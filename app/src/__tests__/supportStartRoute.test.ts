import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const recorded = {
    contacts: [] as Array<Record<string, unknown>>,
    conversations: [] as Array<Record<string, unknown>>,
    messages: [] as Array<Record<string, unknown>>,
  };

  const schema = {
    contacts: { name: 'contacts' },
    crmConversations: { name: 'crmConversations' },
    crmMessages: { name: 'crmMessages' },
  };

  const db = {
    insert(table: unknown) {
      if (table === schema.contacts) {
        return {
          values(values: Record<string, unknown>) {
            recorded.contacts.push(values);
            return {
              onConflictDoUpdate() {
                return {
                  async returning() {
                    return [{ id: 'contact-1' }];
                  },
                };
              },
              async returning() {
                return [{ id: 'contact-1' }];
              },
            };
          },
        };
      }

      if (table === schema.crmConversations) {
        return {
          values(values: Record<string, unknown>) {
            recorded.conversations.push(values);
            return {
              async returning() {
                return [{ id: 'conv-1' }];
              },
            };
          },
        };
      }

      if (table === schema.crmMessages) {
        return {
          async values(values: Record<string, unknown>) {
            recorded.messages.push(values);
            return undefined;
          },
        };
      }

      throw new Error('Unknown table mock');
    },
  };

  return { db, recorded, schema };
});

vi.mock('../../db/client', () => ({
  getDb: () => mocks.db,
  schema: mocks.schema,
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async () => null,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/publicApiRateLimit', () => ({
  decideRateLimit: () => ({ ok: true, limit: 5, remaining: 4, resetAtEpochSeconds: 1735689600 }),
  rateLimitHeaders: () => ({
    'X-RateLimit-Limit': '5',
    'X-RateLimit-Remaining': '4',
    'X-RateLimit-Reset': '1735689600',
  }),
}));

import supportStartRoute from '../../api/support/start/route';

function resetRecorded() {
  mocks.recorded.contacts.length = 0;
  mocks.recorded.conversations.length = 0;
  mocks.recorded.messages.length = 0;
}

describe('/api/support/start', () => {
  beforeEach(() => {
    resetRecorded();
  });

  it('accepta JSON din SPA si salveaza conversatia', async () => {
    const req = new Request('http://test/api/support/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin: 'https://x.test' },
      body: JSON.stringify({
        name: 'Client Test',
        email: 'client@example.com',
        message: 'Vreau o oferta pentru un sistem fotovoltaic.',
        pageUrl: '/contact',
        utm: { utm_source: 'google' },
      }),
    });

    const res = await supportStartRoute(req);
    const body = (await res.json()) as { ok: boolean; conversationId: string };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.conversationId).toBe('conv-1');
    expect(mocks.recorded.contacts[0]?.email).toBe('client@example.com');
    expect(mocks.recorded.messages[0]?.body).toBe('Vreau o oferta pentru un sistem fotovoltaic.');
  });

  it('accepta formular HTML clasic si raspunde cu confirmare HTML', async () => {
    const form = new URLSearchParams({
      name: 'Ana Popescu',
      phone: '0769889721',
      email: 'ana@example.com',
      service: 'fotovoltaice',
      location: 'Vaslui',
      urgent: 'yes',
      message: 'Doresc o oferta pentru casa verde.',
      consent: 'yes',
      pageUrl: '/contact',
    });

    const req = new Request('http://test/api/support/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    const res = await supportStartRoute(req);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(text).toContain('Solicitare trimisă');
    expect(text).toContain('conv-1');
    expect(mocks.recorded.messages[0]?.body).toContain('Serviciu: Fotovoltaice');
    expect(mocks.recorded.messages[0]?.body).toContain('Telefon: 0769889721');
    expect(mocks.recorded.messages[0]?.body).toContain('Locație: Vaslui');
  });

  it('respinge formularul HTML fara consimtamant', async () => {
    const form = new URLSearchParams({
      name: 'Ana Popescu',
      phone: '0769889721',
      message: 'Mesaj scurt',
      pageUrl: '/contact',
    });

    const req = new Request('http://test/api/support/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    const res = await supportStartRoute(req);
    const text = await res.text();

    expect(res.status).toBe(400);
    expect(text).toContain('acordul');
    expect(mocks.recorded.contacts).toHaveLength(0);
    expect(mocks.recorded.messages).toHaveLength(0);
  });
});
