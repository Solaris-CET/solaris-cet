import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type GamificationMe = { ok: boolean; user: { referralCode: string | null; walletAddress: string } };
type AffiliateLinks = { ok: boolean; links: Array<{ code: string; active: boolean; createdAt: string; clicks7d: number; signups: number }> };
type Invites = { ok: boolean; invites: Array<{ id: string; usedCount: number; maxUses: number; expiresAt: string | null; revokedAt: string | null; createdAt: string }> };

export default function AccountAffiliateTab({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [me, setMe] = useState<GamificationMe | null>(null);
  const [links, setLinks] = useState<AffiliateLinks | null>(null);
  const [invites, setInvites] = useState<Invites | null>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [maxUses, setMaxUses] = useState('1');

  const load = useCallback(async () => {
    setInfo(null);
    const [mRes, lRes, iRes] = await Promise.all([
      fetch('/api/gamification/me', { headers: authHeaders }),
      fetch('/api/gamification/affiliate/links', { headers: authHeaders }),
      fetch('/api/gamification/invites', { headers: authHeaders }),
    ]);
    const mJson = (await mRes.json()) as GamificationMe;
    const lJson = (await lRes.json()) as AffiliateLinks;
    const iJson = (await iRes.json()) as Invites;
    if (mRes.ok && mJson.ok) setMe(mJson);
    if (lRes.ok && lJson.ok) setLinks(lJson);
    if (iRes.ok && iJson.ok) setInvites(iJson);
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setInfo('Copiat.');
    } catch {
      setInfo('Nu pot copia automat.');
    }
  };

  const createAffiliateLink = async () => {
    setCreatingLink(true);
    setInfo(null);
    try {
      const res = await fetch('/api/gamification/affiliate/links', { method: 'POST', headers: authHeaders });
      const json = (await res.json()) as { ok?: boolean; code?: string; error?: string };
      if (res.ok && json.ok && json.code) {
        await load();
        setInfo(`Cod nou: ${json.code}`);
      } else {
        setInfo(json.error ? String(json.error) : 'Nu pot genera cod.');
      }
    } catch {
      setInfo('Eroare la generare cod.');
    } finally {
      setCreatingLink(false);
    }
  };

  const createInvite = async () => {
    setCreatingInvite(true);
    setInviteToken(null);
    setInfo(null);
    const mu = Number.parseInt(maxUses, 10);
    const maxUsesSafe = Number.isFinite(mu) ? Math.max(1, Math.min(20, Math.floor(mu))) : 1;
    try {
      const res = await fetch('/api/gamification/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ maxUses: maxUsesSafe }),
      });
      const json = (await res.json()) as { ok?: boolean; token?: string; error?: string };
      if (res.ok && json.ok && json.token) {
        setInviteToken(json.token);
        await load();
      } else {
        setInfo(json.error ? String(json.error) : 'Nu pot crea invitație.');
      }
    } catch {
      setInfo('Eroare la invitație.');
    } finally {
      setCreatingInvite(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralUrl = me?.user.referralCode ? `${origin}/?ref=${encodeURIComponent(me.user.referralCode)}` : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-white text-xl font-semibold tracking-tight">Afiliat & Invite</div>
          <div className="mt-1 text-white/60 text-sm">Link-uri unice, statistici și invite-uri cu bonus XP.</div>
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {info ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{info}</div> : null}

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white font-semibold">Referral</div>
        <div className="mt-2 text-white/70 text-sm">Cod: <span className="text-white font-mono">{me?.user.referralCode ?? '—'}</span></div>
        {referralUrl ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input value={referralUrl} readOnly className="max-w-[520px]" />
            <Button type="button" onClick={() => void copy(referralUrl)}>Copy</Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Link-uri de afiliat</div>
            <div className="mt-1 text-white/60 text-sm">Poți genera mai multe coduri (tracking separat).</div>
          </div>
          <Button type="button" onClick={() => void createAffiliateLink()} disabled={creatingLink}>
            Generează cod
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {(links?.links ?? []).map((l) => {
            const url = `${origin}/?ref=${encodeURIComponent(l.code)}`;
            return (
              <div key={l.code} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-white/80 text-sm font-mono">{l.code}</div>
                  <div className="text-white/60 text-xs">
                    clicks7d {l.clicks7d} · signups {l.signups}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input value={url} readOnly className="max-w-[520px]" />
                  <Button type="button" variant="secondary" onClick={() => void copy(url)}>
                    Copy
                  </Button>
                </div>
              </div>
            );
          })}
          {links && links.links.length === 0 ? <div className="text-white/60 text-sm">Nu ai coduri generate încă.</div> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Invite</div>
            <div className="mt-1 text-white/60 text-sm">Creează un token de invitație (bonus XP pentru ambii).</div>
          </div>
          <div className="flex items-center gap-2">
            <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-[96px]" />
            <Button type="button" onClick={() => void createInvite()} disabled={creatingInvite}>
              Creează
            </Button>
          </div>
        </div>

        {inviteToken ? (
          <div className="mt-4 space-y-2">
            <div className="text-white/70 text-sm">Token:</div>
            <div className="flex flex-wrap items-center gap-2">
              <Input value={inviteToken} readOnly className="max-w-[520px]" />
              <Button type="button" onClick={() => void copy(inviteToken)}>
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {(invites?.invites ?? []).map((i) => (
            <div key={i.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-white/60 text-xs font-mono">{i.id}</div>
                <div className="text-white/60 text-xs">
                  used {i.usedCount}/{i.maxUses}
                </div>
              </div>
              <div className="mt-1 text-white/50 text-xs">
                exp {i.expiresAt ?? '—'}
              </div>
            </div>
          ))}
          {invites && invites.invites.length === 0 ? <div className="text-white/60 text-sm">Nu ai invitații încă.</div> : null}
        </div>
      </div>
    </div>
  );
}

