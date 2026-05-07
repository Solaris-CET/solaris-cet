import { toNano } from '@ton/core';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import WalletConnect from '@/components/WalletConnect';
import { useTonNetwork } from '@/hooks/useTonNetwork';
import { buildJettonTransferB64, buildR2ASubmitForwardPayloadCell, formatCETFromNano, parseCETToNano } from '@/lib/r2aSubmit';
import { truncateAddress } from '@/lib/utils';

type BalanceState =
  | { ok: true; tonBalanceNano: string | null; cetBalanceNano: string | null; cetJettonWalletAddress: string | null }
  | { ok: false; error: string };

const COMPLEXITY_OPTIONS = [
  { value: 1, label: '1x Standard' },
  { value: 2, label: '2x Advanced' },
  { value: 3, label: '3x Expert' },
  { value: 4, label: '4x Research' },
] as const;

export default function R2APage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { network, tonscanBaseUrl } = useTonNetwork();

  const walletAddress = wallet?.account?.address?.trim() ?? '';
  const connected = Boolean(walletAddress) && tonConnectUI.connected;
  const r2aContractAddress = (import.meta.env.VITE_R2A_TASK_CONTRACT_ADDRESS as string | undefined)?.trim() ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [complexity, setComplexity] = useState<number>(1);
  const [stakeCET, setStakeCET] = useState('1');
  const [hours, setHours] = useState('1');

  const [balances, setBalances] = useState<BalanceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const stakeNano = useMemo(() => parseCETToNano(stakeCET), [stakeCET]);
  const hoursNum = useMemo(() => {
    const n = Number(hours);
    return Number.isFinite(n) ? n : NaN;
  }, [hours]);

  const rewardPreview = useMemo(() => {
    const h = hoursNum;
    if (!Number.isFinite(h) || h <= 0) return 0;
    const c = Math.max(1, Math.min(4, Math.floor(complexity)));
    return h * 0.0000267 * c * 1.0;
  }, [hoursNum, complexity]);

  const cetBalanceNanoBigint = useMemo(() => {
    if (!balances || !balances.ok) return null;
    if (!balances.cetBalanceNano) return null;
    try {
      return BigInt(balances.cetBalanceNano);
    } catch {
      return null;
    }
  }, [balances]);

  const submitDisabledReason = useMemo(() => {
    if (!connected) return 'Connect Wallet';
    if (!r2aContractAddress) return 'Contract unavailable';
    if (!title.trim()) return 'Task title required';
    if (!description.trim()) return 'Task description required';
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) return 'Estimated hours must be > 0';
    if (stakeNano == null) return 'Invalid stake amount';
    if (stakeNano < 1_000_000n) return 'Minimum stake is 1 CET';
    if (!balances) return 'Loading balance…';
    if (!balances.ok) return 'Balance unavailable';
    if (!balances.cetBalanceNano) return 'CET balance unavailable';
    if (cetBalanceNanoBigint == null) return 'CET balance unavailable';
    if (stakeNano > cetBalanceNanoBigint) return 'Stake exceeds CET balance';
    if (!balances.cetJettonWalletAddress) return 'CET jetton wallet unavailable';
    return null;
  }, [connected, r2aContractAddress, title, description, hoursNum, stakeNano, balances, cetBalanceNanoBigint]);

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
        const cetJettonWalletAddress =
          typeof (json as { cetJettonWalletAddress?: unknown })?.cetJettonWalletAddress === 'string'
            ? (json as { cetJettonWalletAddress: string }).cetJettonWalletAddress
            : null;
        setBalances({ ok: true, tonBalanceNano, cetBalanceNano, cetJettonWalletAddress });
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

  const fetchLatestHashAfter = async (startedAtSec: number, prevHash: string | null) => {
    for (let i = 0; i < 8; i++) {
      try {
        const res = await fetch(
          `/api/ton/txs?address=${encodeURIComponent(walletAddress)}&network=${encodeURIComponent(network)}&limit=6`,
          { cache: 'no-store' },
        );
        const json = (await res.json().catch(() => null)) as unknown;
        const ok = typeof (json as { ok?: unknown })?.ok === 'boolean' ? (json as { ok: boolean }).ok : false;
        if (!ok) throw new Error('unavailable');
        const items = Array.isArray((json as { items?: unknown }).items) ? ((json as { items: unknown[] }).items as unknown[]) : [];
        const candidates = items
          .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : null))
          .filter((x): x is Record<string, unknown> => Boolean(x))
          .map((x) => ({
            hash: typeof x.hash === 'string' ? x.hash : '',
            now: typeof x.now === 'string' ? x.now : '',
          }))
          .filter((x) => x.hash);
        const found = candidates.find((c) => {
          if (prevHash && c.hash === prevHash) return false;
          const n = Number.parseInt(c.now, 10);
          return Number.isFinite(n) && n >= startedAtSec;
        });
        if (found?.hash) return found.hash;
      } catch {
        void 0;
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    return null;
  };

  const handleSubmitTask = async () => {
    if (submitDisabledReason) {
      toast.error(submitDisabledReason);
      return;
    }
    if (!balances || !balances.ok) return;
    if (!balances.cetJettonWalletAddress) return;
    if (stakeNano == null) return;

    setBusy(true);
    setTxHash(null);
    const startedAtSec = Math.floor(Date.parse(new Date().toISOString()) / 1000);
    let prevHash: string | null = null;
    try {
      const prev = await fetch(`/api/ton/txs?address=${encodeURIComponent(walletAddress)}&network=${encodeURIComponent(network)}&limit=1`, {
        cache: 'no-store',
      });
      const prevJson = (await prev.json().catch(() => null)) as unknown;
      const items = Array.isArray((prevJson as { items?: unknown }).items) ? ((prevJson as { items: unknown[] }).items as unknown[]) : [];
      const first = items[0] && typeof items[0] === 'object' ? (items[0] as Record<string, unknown>) : null;
      prevHash = first && typeof first.hash === 'string' ? first.hash : null;
    } catch {
      void 0;
    }

    try {
      const queryId = BigInt(startedAtSec);
      const hoursValue = Number(hours);
      const forwardPayload = await buildR2ASubmitForwardPayloadCell({
        queryId,
        submitterAddress: walletAddress,
        title,
        description,
        complexity,
        hours: hoursValue,
        stakeNanoCET: stakeNano,
      });
      const payload = buildJettonTransferB64({
        queryId,
        jettonAmountNano: stakeNano,
        destination: r2aContractAddress,
        responseDestination: walletAddress,
        forwardTonAmountNano: toNano('0.03'),
        forwardPayload,
      });

      await tonConnectUI.sendTransaction({
        validUntil: startedAtSec + 360,
        messages: [
          {
            address: balances.cetJettonWalletAddress,
            amount: toNano('0.05').toString(),
            payload,
          },
        ],
      });

      const hash = await fetchLatestHashAfter(startedAtSec, prevHash);
      setTxHash(hash);
      toast.success('Task submitted');
    } catch {
      void 0;
    } finally {
      setBusy(false);
    }
  };

  const formDisabled = !connected || busy;
  const submitButtonDisabled = busy || (connected && Boolean(submitDisabledReason));

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-5xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">R2A Protocol · Submit Task</h1>
            <p className="mt-2 text-white/70 text-sm">Stake CET and submit an AI task request.</p>
          </div>
          <div className="text-xs text-white/60 font-mono">
            {walletAddress ? `Wallet: ${truncateAddress(walletAddress, 6)}` : 'Wallet not connected'}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-white font-semibold">Wallet</div>
                <WalletConnect />
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">Network</div>
                  <div className="text-white font-mono">{network}</div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/60">CET balance</div>
                  <div className="text-white font-mono">
                    {balances?.ok ? (balances.cetBalanceNano ? `${formatCETFromNano(balances.cetBalanceNano)} CET` : '—') : balances ? '—' : '—'}
                  </div>
                </div>
              </div>
              {!r2aContractAddress ? <div className="mt-3 text-xs text-white/60">R2A contract is not configured yet.</div> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Reward preview</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-xs text-white/60 font-mono">CET reward</div>
                  <div className="mt-1 text-white font-semibold">{Number.isFinite(rewardPreview) ? rewardPreview.toFixed(6) : '—'} CET</div>
                </div>
                <div className="text-xs text-white/60">
                  Formula: hours × 0.0000267 × complexity × 1.0
                </div>
              </div>
            </div>

            {txHash ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="text-white font-semibold">Submission</div>
                <div className="mt-2 text-sm text-white/70">Transaction:</div>
                <a
                  className="mt-2 inline-flex items-center gap-2 text-sm text-solaris-gold hover:text-solaris-gold/80"
                  href={`${tonscanBaseUrl}/tx/${encodeURIComponent(txHash)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {txHash}
                </a>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-white font-semibold">Task details</div>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <div className="text-xs text-white/60 font-mono">Task Title</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={formDisabled}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <div className="text-xs text-white/60 font-mono">Task Description (Markdown)</div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={formDisabled}
                    rows={8}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none disabled:opacity-60"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-xs text-white/60 font-mono">Complexity</div>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(Number(e.target.value))}
                      disabled={formDisabled}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none disabled:opacity-60"
                    >
                      {COMPLEXITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <div className="text-xs text-white/60 font-mono">Estimated Hours</div>
                    <input
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      disabled={formDisabled}
                      inputMode="decimal"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none disabled:opacity-60"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-xs text-white/60 font-mono">CET Stake Amount (min 1 CET)</div>
                  <input
                    value={stakeCET}
                    onChange={(e) => setStakeCET(e.target.value)}
                    disabled={formDisabled}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white text-sm outline-none disabled:opacity-60"
                  />
                </label>

                <button
                  type="button"
                  className="btn-filled-gold w-full min-h-[44px] disabled:opacity-60"
                  disabled={submitButtonDisabled}
                  onClick={() => {
                    if (!connected) {
                      void tonConnectUI.openModal();
                      return;
                    }
                    void handleSubmitTask();
                  }}
                >
                  {!connected ? 'Connect Wallet' : busy ? 'Submitting…' : 'Submit Task'}
                </button>

                {submitDisabledReason && connected ? <div className="text-xs text-white/60">Blocked: {submitDisabledReason}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
