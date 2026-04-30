import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getAuthToken } from '@/lib/authToken';
import FooterSection from '@/sections/FooterSection';

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

type WebhookEndpointRow = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type WebhookDeliveryRow = {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  httpStatus: number | null;
  error: string | null;
  durationMs: number | null;
  nextRetryAt: string | null;
  createdAt: string;
};

export default function DeveloperConsolePage() {
  const token = useMemo(() => getAuthToken(), []);
  const [apiKey, setApiKey] = useLocalStorage<string>('solaris_api_key', '');
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('Default');
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState('transaction.created');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookEndpointRow[]>([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState('');
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRow[]>([]);
  const [lastWebhookSecret, setLastWebhookSecret] = useState('');
  const canUseConsole = Boolean(token);

  const headers = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const loadKeys = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/console/api-keys', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = (await res.json()) as { keys?: ApiKeyRow[] };
      setKeys(Array.isArray(json.keys) ? json.keys : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadWebhooks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/console/webhooks', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const json = (await res.json()) as { items?: WebhookEndpointRow[] };
      const items = Array.isArray(json.items) ? json.items : [];
      setWebhooks(items);
      if (!selectedWebhookId && items[0]?.id) setSelectedWebhookId(items[0].id);
    } catch {
      void 0;
    }
  }, [token, selectedWebhookId]);

  const loadDeliveries = useCallback(
    async (endpointId: string) => {
      if (!token) return;
      if (!endpointId) {
        setDeliveries([]);
        return;
      }
      try {
        const res = await fetch(`/api/console/webhooks/deliveries?endpointId=${encodeURIComponent(endpointId)}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { items?: WebhookDeliveryRow[] };
        setDeliveries(Array.isArray(json.items) ? json.items : []);
      } catch {
        void 0;
      }
    },
    [token],
  );

  useEffect(() => {
    void loadKeys();
    void loadWebhooks();
  }, [loadKeys, loadWebhooks]);

  useEffect(() => {
    void loadDeliveries(selectedWebhookId);
  }, [loadDeliveries, selectedWebhookId]);

  const createKey = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/console/api-keys', { method: 'POST', headers, body: JSON.stringify({ name }) });
      const json = (await res.json().catch(() => ({}))) as { rawKey?: unknown; apiKey?: unknown; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || `Failed (${res.status})`);
      const raw = typeof json.rawKey === 'string' ? json.rawKey : '';
      if (raw) setApiKey(raw);
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const rotateKey = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/console/api-keys?action=rotate', { method: 'POST', headers, body: JSON.stringify({ id }) });
      const json = (await res.json().catch(() => ({}))) as { rawKey?: unknown; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || `Failed (${res.status})`);
      const raw = typeof json.rawKey === 'string' ? json.rawKey : '';
      if (raw) setApiKey(raw);
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rotate');
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/api-keys?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!(res.status === 204 || res.ok)) throw new Error(`Failed (${res.status})`);
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setLastWebhookSecret('');
    try {
      const events = webhookEvents
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/console/webhooks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: webhookUrl, events, enabled: webhookEnabled }),
      });
      const json = (await res.json().catch(() => ({}))) as { secret?: unknown; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message || `Failed (${res.status})`);
      const secret = typeof json.secret === 'string' ? json.secret : '';
      if (secret) setLastWebhookSecret(secret);
      setWebhookUrl('');
      await loadWebhooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/webhooks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!(res.status === 204 || res.ok)) throw new Error(`Failed (${res.status})`);
      if (selectedWebhookId === id) setSelectedWebhookId('');
      await loadWebhooks();
      await loadDeliveries('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative w-full overflow-x-clip pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 pb-10">
        <div className="mb-6">
          <p className="hud-label text-[10px]">Developers</p>
          <h1 className="font-display text-3xl md:text-4xl text-white mt-2">Console</h1>
          <p className="text-slate-200/80 mt-3 max-w-3xl leading-relaxed">
            Gestionează cheile API și folosește-le în Swagger UI sau în SDK.
          </p>
        </div>

        {!canUseConsole ? (
          <div className="rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5">
            <div className="text-white font-semibold">Autentificare necesară</div>
            <div className="mt-2 text-sm text-slate-200/80">Conectează wallet-ul pe pagina de login pentru a genera token.</div>
            <div className="mt-4 flex gap-3">
              <a href="/login" className="btn-gold">Login</a>
              <a href="/docs" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white hover:bg-white/[0.06] transition-colors">
                Vezi Docs
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-5 rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5">
              <div className="hud-label text-[10px]">Creează API key</div>
              <label className="block mt-3">
                <div className="text-xs text-white/70">Nume</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                />
              </label>
              <button
                type="button"
                onClick={() => void createKey()}
                disabled={loading}
                className="mt-4 btn-gold disabled:opacity-60"
              >
                Generează
              </button>
              <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3">
                <div className="text-xs text-white/70">Cheia activă (local)</div>
                <div className="mt-2 font-mono text-[12px] text-slate-200/85 break-all">{apiKey || '—'}</div>
                <div className="mt-2 text-xs text-white/60">Este salvată în browser pentru testare rapidă.</div>
              </div>
              {error ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100/90">{error}</div>
              ) : null}
            </div>

            <div className="md:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-5">
              <div className="hud-label text-[10px]">API keys</div>
              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-white/60">
                    <tr className="text-left">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Prefix</th>
                      <th className="py-2 pr-3">Last used</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200/85">
                    {keys.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 text-white/60">{loading ? 'Loading…' : 'No keys yet.'}</td>
                      </tr>
                    ) : (
                      keys.map((k) => (
                        <tr key={k.id} className="border-t border-white/[0.06]">
                          <td className="py-3 pr-3">{k.name}</td>
                          <td className="py-3 pr-3 font-mono text-xs">{k.prefix}</td>
                          <td className="py-3 pr-3 text-xs">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}</td>
                          <td className="py-3 pr-3 text-xs">{k.revoked ? 'revoked' : 'active'}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void rotateKey(k.id)}
                                disabled={loading || k.revoked}
                                className="rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-xs text-white hover:bg-white/[0.06] disabled:opacity-50"
                              >
                                Rotate
                              </button>
                              <button
                                type="button"
                                onClick={() => void revokeKey(k.id)}
                                disabled={loading || k.revoked}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-100/90 hover:bg-red-500/15 disabled:opacity-50"
                              >
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-white/60">
                Folosește cheia în <a href="/docs" className="text-solaris-cyan/90 hover:text-solaris-cyan">/docs</a> sau în request-uri directe.
              </div>
            </div>

            <div className="md:col-span-12 rounded-2xl border border-white/[0.08] bg-slate-950/40 backdrop-blur px-5 py-5">
              <div className="hud-label text-[10px]">Webhooks</div>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className="block">
                    <div className="text-xs text-white/70">Endpoint URL</div>
                    <input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://example.com/webhooks/solaris"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                    />
                  </label>
                  <label className="block mt-3">
                    <div className="text-xs text-white/70">Events (comma-separated)</div>
                    <input
                      value={webhookEvents}
                      onChange={(e) => setWebhookEvents(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20 font-mono"
                    />
                  </label>
                  <label className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <input type="checkbox" checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} />
                    Enabled
                  </label>
                  <button
                    type="button"
                    onClick={() => void createWebhook()}
                    disabled={loading || !webhookUrl.trim()}
                    className="mt-4 btn-gold disabled:opacity-60"
                  >
                    Create webhook
                  </button>
                  {lastWebhookSecret ? (
                    <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3">
                      <div className="text-xs text-white/70">Secret (shown once)</div>
                      <div className="mt-2 font-mono text-[12px] text-slate-200/85 break-all">{lastWebhookSecret}</div>
                      <div className="mt-2 text-xs text-white/60">Signature header: <span className="font-mono">X-Webhook-Signature</span></div>
                    </div>
                  ) : null}
                </div>

                <div className="md:col-span-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs text-white/70">Select endpoint</div>
                    <select
                      value={selectedWebhookId}
                      onChange={(e) => setSelectedWebhookId(e.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                    >
                      <option value="">—</option>
                      {webhooks.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.url}
                        </option>
                      ))}
                    </select>
                    {selectedWebhookId ? (
                      <button
                        type="button"
                        onClick={() => void deleteWebhook(selectedWebhookId)}
                        disabled={loading}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-100/90 hover:bg-red-500/15 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void loadDeliveries(selectedWebhookId)}
                      disabled={loading || !selectedWebhookId}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      Refresh deliveries
                    </button>
                  </div>

                  <div className="mt-3 overflow-auto rounded-xl border border-white/[0.08] bg-white/[0.03]">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-white/60">
                        <tr className="text-left">
                          <th className="py-2 px-3">Time</th>
                          <th className="py-2 px-3">Attempt</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Next retry</th>
                          <th className="py-2 px-3">Error</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-200/85">
                        {deliveries.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-3 px-3 text-white/60">No deliveries.</td>
                          </tr>
                        ) : (
                          deliveries.map((d) => (
                            <tr key={d.id} className="border-t border-white/[0.06]">
                              <td className="py-2 px-3 text-xs">{new Date(d.createdAt).toLocaleString()}</td>
                              <td className="py-2 px-3 text-xs">{d.attempt}</td>
                              <td className="py-2 px-3 text-xs">{d.httpStatus ?? '—'}</td>
                              <td className="py-2 px-3 text-xs">{d.nextRetryAt ? new Date(d.nextRetryAt).toLocaleString() : '—'}</td>
                              <td className="py-2 px-3 text-xs font-mono text-white/70">{d.error ? d.error.slice(0, 80) : '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <FooterSection />
    </main>
  );
}
