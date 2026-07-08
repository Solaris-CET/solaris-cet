import { useCallback, useEffect, useMemo, useState } from 'react';

import AccountAffiliateTab from '@/components/account/AccountAffiliateTab';
import AccountAlertsTab, { type Alert } from '@/components/account/AccountAlertsTab';
import AccountLeaderboardTab from '@/components/account/AccountLeaderboardTab';
import AccountNotificationsTab from '@/components/account/AccountNotificationsTab';
import AccountQuestsTab from '@/components/account/AccountQuestsTab';
import AccountShopTab from '@/components/account/AccountShopTab';
import AccountSupportTab from '@/components/account/AccountSupportTab';
import AccountWeb3Tab from '@/components/account/AccountWeb3Tab';
import AccountXpTab from '@/components/account/AccountXpTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletConnect from '@/components/WalletConnect';
import { useJwtSession } from '@/hooks/useJwtSession';
import { subscribePush, testPush, unsubscribePush } from '@/lib/pushClient';

type Profile = {
  email: string | null;
  user: { walletAddress: string; role: string };
  preferences: { marketingNewsletter: boolean; priceAlertsEmail: boolean; pushEnabled: boolean };
  newsletter: { status: string; createdAt: string } | null;
};

type AiConversation = {
  id: string;
  title: string | null;
  lastMessageAt: string;
  messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
};

type TxRow = {
  id: string;
  source: 'app' | 'onchain';
  occurredAt: string;
  address: string | null;
  kind: string;
  txHash: string | null;
  status: string | null;
  amount: string | null;
};

export default function AccountPage() {
  const { token, isAuthenticated } = useJwtSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [email, setEmail] = useState('');
  const [marketingNewsletter, setMarketingNewsletter] = useState(false);
  const [priceAlertsEmail, setPriceAlertsEmail] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushInfo, setPushInfo] = useState<string | null>(null);
  const [asset, setAsset] = useState<'CET' | 'TON'>('CET');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetUsd, setTargetUsd] = useState('0.10');
  const [channel, setChannel] = useState<'email' | 'push'>('email');
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [aiHistory, setAiHistory] = useState<AiConversation[]>([]);
  const [txHistory, setTxHistory] = useState<TxRow[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [txBusy, setTxBusy] = useState(false);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const loadAll = useCallback(async () => {
    if (!authHeaders) return;
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/account/profile', { headers: authHeaders }),
        fetch('/api/alerts', { headers: authHeaders }),
      ]);
      const pJson = (await pRes.json()) as { ok?: boolean } & Profile;
      const aJson = (await aRes.json()) as { ok?: boolean; alerts?: Alert[] };
      if (pRes.ok && pJson.ok) {
        setProfile(pJson);
        setEmail(pJson.email ?? '');
        setMarketingNewsletter(Boolean(pJson.preferences?.marketingNewsletter));
        setPriceAlertsEmail(Boolean(pJson.preferences?.priceAlertsEmail));
        setPushEnabled(Boolean(pJson.preferences?.pushEnabled));
      }
      if (aRes.ok && aJson.ok && Array.isArray(aJson.alerts)) {
        setAlerts(aJson.alerts);
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!authHeaders) return;
    setAiBusy(true);
    void (async () => {
      try {
        const res = await fetch('/api/ai/history', { headers: authHeaders, cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as { conversations?: unknown } | null;
        if (res.ok && json && Array.isArray(json.conversations)) {
          setAiHistory(
            (json.conversations as Array<Record<string, unknown>>).map((c) => ({
              id: String(c.id ?? ''),
              title: typeof c.title === 'string' ? c.title : null,
              lastMessageAt: String(c.lastMessageAt ?? ''),
              messages: Array.isArray(c.messages)
                ? (c.messages as Array<Record<string, unknown>>).map((m) => ({
                    id: String(m.id ?? ''),
                    role: String(m.role ?? ''),
                    content: String(m.content ?? ''),
                    createdAt: String(m.createdAt ?? ''),
                  }))
                : [],
            })),
          );
        }
      } finally {
        setAiBusy(false);
      }
    })();
  }, [authHeaders]);

  useEffect(() => {
    if (!authHeaders) return;
    setTxBusy(true);
    void (async () => {
      try {
        const res = await fetch('/api/account/transactions?limit=80&source=all', { headers: authHeaders, cache: 'no-store' });
        const json = (await res.json().catch(() => null)) as { ok?: boolean; transactions?: unknown } | null;
        if (res.ok && json?.ok && Array.isArray(json.transactions)) {
          setTxHistory(
            (json.transactions as Array<Record<string, unknown>>).map((t) => ({
              id: String(t.id ?? ''),
              source: (t.source === 'app' ? 'app' : 'onchain') as 'app' | 'onchain',
              occurredAt: String(t.occurredAt ?? ''),
              address: typeof t.address === 'string' ? t.address : null,
              kind: String(t.kind ?? ''),
              txHash: typeof t.txHash === 'string' ? t.txHash : null,
              status: typeof t.status === 'string' ? t.status : null,
              amount: typeof t.amount === 'string' ? t.amount : null,
            })),
          );
        }
      } finally {
        setTxBusy(false);
      }
    })();
  }, [authHeaders]);

  const saveProfile = async () => {
    if (!authHeaders) return;
    setSavingProfile(true);
    try {
      await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ email: email || null, marketingNewsletter, priceAlertsEmail, pushEnabled }),
      });
      await loadAll();
    } finally {
      setSavingProfile(false);
    }
  };

  const enablePush = async () => {
    if (!token) return;
    setPushBusy(true);
    setPushInfo(null);
    try {
      await subscribePush(token);
      setPushEnabled(true);
      setPushInfo('Push activat.');
      await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ email: email || null, marketingNewsletter, priceAlertsEmail, pushEnabled: true }),
      });
    } catch (e) {
      setPushInfo(`Eroare: ${String(e instanceof Error ? e.message : e).slice(0, 140)}`);
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    if (!token) return;
    setPushBusy(true);
    setPushInfo(null);
    try {
      await unsubscribePush(token);
      setPushEnabled(false);
      setPushInfo('Push dezactivat.');
      await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ email: email || null, marketingNewsletter, priceAlertsEmail, pushEnabled: false }),
      });
    } catch {
      setPushInfo('Nu am putut revoca push.');
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = async () => {
    if (!token) return;
    setPushBusy(true);
    setPushInfo(null);
    try {
      const delivered = await testPush(token);
      setPushInfo(delivered ? 'Test trimis. Verifică notificarea.' : 'Nu există subscripții active.');
    } catch {
      setPushInfo('Eroare la trimiterea testului.');
    } finally {
      setPushBusy(false);
    }
  };

  const upsertAlert = async () => {
    if (!authHeaders) return;
    const payload = {
      id: editingId,
      asset,
      direction,
      targetUsd,
      channel,
      cooldownMinutes,
    };
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    setEditingId(null);
    await loadAll();
  };

  const removeAlert = async (id: string) => {
    if (!authHeaders) return;
    await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders });
    await loadAll();
  };

  const startEdit = (a: Alert) => {
    setEditingId(a.id);
    setAsset(a.asset === 'TON' ? 'TON' : 'CET');
    setDirection(a.direction);
    setTargetUsd(String(a.targetUsd));
    setChannel(a.channel);
    setCooldownMinutes(a.cooldownMinutes);
  };

  if (!isAuthenticated) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
          <h1 className="text-white text-2xl font-semibold tracking-tight">App</h1>
          <p className="mt-3 text-white/70 text-sm">Conectează wallet-ul TON ca să gestionezi alerte și notificări.</p>
          <div className="mt-6">
            <WalletConnect />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
              Home
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-14">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-white/60 text-sm">
              {profile?.user.walletAddress ? `Wallet: ${profile.user.walletAddress}` : 'Wallet conectat'}
              {profile?.newsletter ? ` · Newsletter: ${profile.newsletter.status}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WalletConnect />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <Tabs defaultValue="notifications">
            <TabsList>
              <TabsTrigger value="notifications">Notificări</TabsTrigger>
              <TabsTrigger value="alerts">Alerte preț</TabsTrigger>
              <TabsTrigger value="ai">Istoric AI</TabsTrigger>
              <TabsTrigger value="transactions">Tranzacții</TabsTrigger>
              <TabsTrigger value="xp">XP</TabsTrigger>
              <TabsTrigger value="quests">Misiuni</TabsTrigger>
              <TabsTrigger value="shop">Shop</TabsTrigger>
              <TabsTrigger value="leaderboard">Clasament</TabsTrigger>
              <TabsTrigger value="affiliate">Afiliat</TabsTrigger>
              <TabsTrigger value="web3">Web3</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="mt-6">
              <AccountNotificationsTab
                email={email}
                setEmail={setEmail}
                marketingNewsletter={marketingNewsletter}
                setMarketingNewsletter={setMarketingNewsletter}
                priceAlertsEmail={priceAlertsEmail}
                setPriceAlertsEmail={setPriceAlertsEmail}
                pushEnabled={pushEnabled}
                setPushEnabled={setPushEnabled}
                pushBusy={pushBusy}
                pushInfo={pushInfo}
                onEnablePush={enablePush}
                onDisablePush={disablePush}
                onTestPush={sendTestPush}
                savingProfile={savingProfile}
                onSaveProfile={saveProfile}
              />
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <AccountAlertsTab
                loading={loading}
                alerts={alerts}
                editingId={editingId}
                asset={asset}
                setAsset={setAsset}
                direction={direction}
                setDirection={setDirection}
                targetUsd={targetUsd}
                setTargetUsd={setTargetUsd}
                channel={channel}
                setChannel={setChannel}
                cooldownMinutes={cooldownMinutes}
                setCooldownMinutes={setCooldownMinutes}
                onUpsert={upsertAlert}
                onCancelEdit={() => setEditingId(null)}
                onDelete={removeAlert}
                onStartEdit={startEdit}
              />
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold">Istoric AI</div>
                  <div className="text-white/60 text-xs font-mono">{aiBusy ? 'loading…' : `${aiHistory.length} conv`}</div>
                </div>
                {aiHistory.length === 0 ? (
                  <div className="text-white/60 text-sm">Nu ai conversații încă.</div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
                    {aiHistory.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="text-white/90 text-sm font-semibold">{c.title || 'Untitled'}</div>
                        <div className="mt-1 text-white/50 text-xs font-mono">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : '—'}</div>
                        <div className="mt-3 space-y-2">
                          {c.messages.slice(-4).map((m) => (
                            <div key={m.id} className="text-sm text-white/80">
                              <span className="text-white/50 font-mono text-xs mr-2">{m.role}</span>
                              {m.content.slice(0, 220)}
                              {m.content.length > 220 ? '…' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-white font-semibold">Tranzacții</div>
                  <div className="text-white/60 text-xs font-mono">{txBusy ? 'loading…' : `${txHistory.length} rows`}</div>
                </div>
                {txHistory.length === 0 ? (
                  <div className="text-white/60 text-sm">Nu ai tranzacții încă.</div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
                    {txHistory.map((t) => (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-white/90 text-sm font-semibold">
                            {t.kind}
                            <span className="text-white/40"> · </span>
                            <span className="text-white/60 text-xs font-mono">{t.source}</span>
                          </div>
                          <div className="text-white/50 text-xs font-mono">{t.occurredAt ? new Date(t.occurredAt).toLocaleString() : '—'}</div>
                        </div>
                        <div className="mt-2 text-white/70 text-xs font-mono break-all">
                          {t.txHash ? `tx: ${t.txHash}` : t.address ? `addr: ${t.address}` : t.status ? `status: ${t.status}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="xp" className="mt-6">
              {token ? <AccountXpTab token={token} /> : null}
            </TabsContent>

            <TabsContent value="quests" className="mt-6">
              {token ? <AccountQuestsTab token={token} /> : null}
            </TabsContent>

            <TabsContent value="shop" className="mt-6">
              {token ? <AccountShopTab token={token} /> : null}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-6">
              {token ? <AccountLeaderboardTab token={token} /> : null}
            </TabsContent>

            <TabsContent value="affiliate" className="mt-6">
              {token ? <AccountAffiliateTab token={token} /> : null}
            </TabsContent>

            <TabsContent value="support" className="mt-6">
              {token ? <AccountSupportTab token={token} email={email} /> : null}
            </TabsContent>

            <TabsContent value="web3" className="mt-6">
              {token ? <AccountWeb3Tab token={token} /> : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
