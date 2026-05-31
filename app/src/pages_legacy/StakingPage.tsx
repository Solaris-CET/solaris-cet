import { toNano } from '@ton/core';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { apyFromBps,DEFAULT_STAKING_PLANS } from '@/constants/staking';
import { useJwtSession } from '@/hooks/useJwtSession';
import { useTonNetwork } from '@/hooks/useTonNetwork';
import { buildFixedStakingClaimPayload, buildFixedStakingStakePayload, buildFixedStakingUnstakePayload } from '@/lib/stakingPayload';
import { truncateAddress } from '@/lib/utils';

type BalanceState = { ok: true; tonBalanceNano: string | null; cetBalanceNano: string | null } | { ok: false; error: string };

export default function StakingPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { token } = useJwtSession();
  const { network } = useTonNetwork();

  const [planId, setPlanId] = useState(DEFAULT_STAKING_PLANS[0]?.id ?? 1);
  const [amount, setAmount] = useState('1');
  const [balances, setBalances] = useState<BalanceState | null>(null);
  const [nowTs, setNowTs] = useState(() => Math.floor(Date.now() / 1000));
  const [busy, setBusy] = useState<'stake' | 'claim' | 'unstake' | null>(null);

  const stakingAddress = (import.meta.env.VITE_FIXED_STAKING_POOL_ADDRESS as string | undefined)?.trim() ?? '';
  const walletAddress = wallet?.account?.address?.trim() ?? '';

  const selectedPlan = useMemo(() => DEFAULT_STAKING_PLANS.find((p) => p.id === planId) ?? DEFAULT_STAKING_PLANS[0], [planId]);

  const estimatedApy = useMemo(() => apyFromBps(selectedPlan?.apyBps ?? 0), [selectedPlan?.apyBps]);

  const estimatedReward = useMemo(() => {
    const principal = Number(amount);
    if (!Number.isFinite(principal) || principal <= 0) return 0;
    const apy = estimatedApy / 100;
    const seconds = selectedPlan?.durationSeconds ?? 0;
    if (!seconds) return 0;
    const year = 365 * 24 * 60 * 60;
    return principal * apy * (seconds / year);
  }, [amount, estimatedApy, selectedPlan?.durationSeconds]);

  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setBalances(null);
      return;
    }
    let alive = true;
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/ton/balance?address=${encodeURIComponent(walletAddress)}&network=${encodeURIComponent(network)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const json = (await res.json().catch(() => null)) as unknown;
        if (!alive) return;
        const ok = typeof (json as { ok?: unknown })?.ok === 'boolean' ? (json as { ok: boolean }).ok : false;
        if (!ok) {
          setBalances({ ok: false, error: 'unavailable' });
          return;
        }
        const tonBalanceNano = typeof (json as { tonBalanceNano?: unknown })?.tonBalanceNano === 'string' ? (json as { tonBalanceNano: string }).tonBalanceNano : null;
        const cetBalanceNano = typeof (json as { cetBalanceNano?: unknown })?.cetBalanceNano === 'string' ? (json as { cetBalanceNano: string }).cetBalanceNano : null;
        setBalances({ ok: true, tonBalanceNano, cetBalanceNano });
      } catch {
        if (!alive) return;
        setBalances({ ok: false, error: 'unavailable' });
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [network, walletAddress]);

  const createIntent = async (type: 'stake' | 'claim' | 'unstake', meta: Record<string, unknown>) => {
    if (!token) return;
    try {
      await fetch('/api/web3/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, status: 'pending', meta }),
      });
    } catch {
      void 0;
    }
  };

  const stake = async () => {
    if (!tonConnectUI.connected) return;
    if (!stakingAddress) {
      toast.error('Lipsește adresa contractului de staking');
      return;
    }
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) {
      toast.error('Suma invalidă');
      return;
    }
    setBusy('stake');
    try {
      const value = toNano(amount);
      const payload = buildFixedStakingStakePayload(planId);
      await createIntent('stake', { planId, amountTon: amount, stakingAddress, network, ts: nowTs });
      await tonConnectUI.sendTransaction({
        validUntil: nowTs + 360,
        messages: [{ address: stakingAddress, amount: value.toString(), payload }],
      });
      toast.success('Stake trimis');
    } catch {
      void 0;
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    if (!tonConnectUI.connected) return;
    if (!stakingAddress) {
      toast.error('Lipsește adresa contractului de staking');
      return;
    }
    setBusy('claim');
    try {
      const payload = buildFixedStakingClaimPayload();
      await createIntent('claim', { stakingAddress, network, ts: nowTs });
      await tonConnectUI.sendTransaction({
        validUntil: nowTs + 360,
        messages: [{ address: stakingAddress, amount: toNano('0.05').toString(), payload }],
      });
      toast.success('Claim trimis');
    } catch {
      void 0;
    } finally {
      setBusy(null);
    }
  };

  const unstake = async () => {
    if (!tonConnectUI.connected) return;
    if (!stakingAddress) {
      toast.error('Lipsește adresa contractului de staking');
      return;
    }
    setBusy('unstake');
    try {
      const payload = buildFixedStakingUnstakePayload();
      await createIntent('unstake', { stakingAddress, network, ts: nowTs });
      await tonConnectUI.sendTransaction({
        validUntil: nowTs + 360,
        messages: [{ address: stakingAddress, amount: toNano('0.05').toString(), payload }],
      });
      toast.success('Unstake trimis');
    } catch {
      void 0;
    } finally {
      setBusy(null);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-5xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Staking</h1>
            <p className="mt-2 text-white/70 text-sm">Perioade fixe, recompense variabile, claim separat.</p>
          </div>
          <div className="text-xs text-white/60 font-mono">
            {walletAddress ? `Wallet: ${truncateAddress(walletAddress, 6)}` : 'Wallet neconectat'}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Config</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Rețea</div>
                  <div className="text-white font-mono">{network}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Contract</div>
                  <div className="text-white font-mono">{stakingAddress ? truncateAddress(stakingAddress, 6) : '—'}</div>
                </div>
              </div>
              {!stakingAddress ? (
                <div className="mt-3 text-xs text-white/60">
                  Setează <span className="font-mono">VITE_FIXED_STAKING_POOL_ADDRESS</span> pentru a activa tranzacțiile.
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Balans</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">TON</div>
                  <div className="text-white font-mono">
                    {balances?.ok ? (balances.tonBalanceNano ? balances.tonBalanceNano : '—') : balances ? '—' : '—'}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">CET (Jetton)</div>
                  <div className="text-white font-mono">
                    {balances?.ok ? (balances.cetBalanceNano ? balances.cetBalanceNano : '—') : balances ? '—' : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Stake</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-xs text-white/60 font-mono">Plan</div>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none"
                  >
                    {DEFAULT_STAKING_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} · {apyFromBps(p.apyBps).toFixed(2)}% APY
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <div className="text-xs text-white/60 font-mono">Suma (TON)</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">APY</div>
                  <div className="mt-1 text-white font-semibold">{estimatedApy.toFixed(2)}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">Durată</div>
                  <div className="mt-1 text-white font-semibold">{selectedPlan?.durationSeconds ? `${Math.round(selectedPlan.durationSeconds / 86400)}d` : '—'}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">Estimare</div>
                  <div className="mt-1 text-white font-semibold">{Number.isFinite(estimatedReward) ? estimatedReward.toFixed(6) : '—'} TON</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void stake()}
                  disabled={!tonConnectUI.connected || !stakingAddress || busy !== null}
                  className="px-4 py-3 rounded-xl bg-solaris-gold/20 text-solaris-gold border border-solaris-gold/30 hover:bg-solaris-gold/25 disabled:opacity-50"
                >
                  {busy === 'stake' ? 'Sending…' : 'Stake'}
                </button>
                <button
                  type="button"
                  onClick={() => void claim()}
                  disabled={!tonConnectUI.connected || !stakingAddress || busy !== null}
                  className="px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-50"
                >
                  {busy === 'claim' ? 'Sending…' : 'Claim'}
                </button>
                <button
                  type="button"
                  onClick={() => void unstake()}
                  disabled={!tonConnectUI.connected || !stakingAddress || busy !== null}
                  className="px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-50"
                >
                  {busy === 'unstake' ? 'Sending…' : 'Unstake'}
                </button>
              </div>

              {!token ? (
                <div className="mt-3 text-xs text-white/60">
                  Conectează wallet și autentifică-te (TonProof) ca să salvezi tranzacțiile în istoric.
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">APY live</div>
              <div className="mt-2 text-sm text-white/70">
                Actualizare: <span className="font-mono">{nowTs}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {DEFAULT_STAKING_PLANS.map((p) => (
                  <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 flex items-center justify-between gap-3">
                    <div className="text-white">{p.label}</div>
                    <div className="text-white font-mono">{apyFromBps(p.apyBps).toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
