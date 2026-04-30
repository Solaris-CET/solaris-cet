import { BadgeCheck, ExternalLink, Flame, Landmark, Vote } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import BridgeSimulatorPanel from '@/components/account/BridgeSimulatorPanel';
import EvmWalletPanel from '@/components/EvmWalletPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/lib/analytics';

type Intent = {
  id: string;
  type: 'stake' | 'unstake' | 'vote' | 'bridge' | 'onramp';
  status: 'created' | 'pending' | 'confirmed' | 'failed';
  txHash: string | null;
  providerRef: string | null;
  meta: unknown;
  createdAt: string;
};

type Props = { token: string };

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const proposals = [
  { id: 'p-001', title: 'DAO formation parameters', summary: 'Quorum 12% · Timelock 24h · Snapshot weekly' },
  { id: 'p-002', title: 'Bridge mainnet rollout', summary: 'Phase 1: TON → EVM · Phase 2: liquidity routing' },
];

export default function AccountWeb3Tab(props: Props) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${props.token}` }), [props.token]);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [stakeAmount, setStakeAmount] = useState('100');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/web3/intents', { headers: authHeaders });
    if (!res.ok) return;
    const json = (await res.json()) as { intents?: Intent[] };
    setIntents(Array.isArray(json.intents) ? json.intents : []);
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const createIntent = async (type: Intent['type'], meta?: AnalyticsParams) => {
    setBusy(true);
    try {
      const res = await fetch('/api/web3/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ type, status: 'created', meta: meta ?? null }),
      });
      if (res.ok) {
        trackEvent('web3_intent_created', { type, ...(meta ?? {}) });
        if (type === 'stake') trackEvent('stake_start', { ...(meta ?? {}) });
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Flame className="h-4 w-4 text-solaris-gold" />
          Staking
        </div>
        <div className="mt-2 text-sm text-white/70 leading-relaxed">
          Demo intent tracking. Pentru execuție on-chain, vei integra contract wrapper-ul când build artifacts sunt disponibile.
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} inputMode="decimal" />
          <Button onClick={() => createIntent('stake', { amountCET: stakeAmount })} disabled={busy} className="rounded-xl">
            Stake
          </Button>
          <Button
            variant="outline"
            onClick={() => createIntent('unstake', { amountCET: stakeAmount })}
            disabled={busy}
            className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Unstake
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Vote className="h-4 w-4 text-solaris-cyan" />
          Governance
        </div>
        <div className="mt-4 space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="text-sm text-white font-semibold">{p.title}</div>
              <div className="mt-1 text-xs text-white/55">{p.summary}</div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => createIntent('vote', { proposalId: p.id, choice: 'yes' })} disabled={busy} className="rounded-xl">
                  Vote Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => createIntent('vote', { proposalId: p.id, choice: 'no' })}
                  disabled={busy}
                  className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Vote No
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EvmWalletPanel />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Landmark className="h-4 w-4" />
          On-ramp
        </div>
        <div className="mt-2 text-sm text-white/70 leading-relaxed">Intrare fiat → crypto prin provider (ex: Transak).</div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => createIntent('onramp', { provider: 'transak' })} disabled={busy} className="rounded-xl">
            <BadgeCheck className="h-4 w-4" />
            Create Intent
          </Button>
          <a
            href="https://global.transak.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Open Transak <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <BridgeSimulatorPanel token={props.token} />

      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-semibold">Activity</div>
        <div className="mt-3 space-y-2 max-h-[320px] overflow-auto pr-2">
          {intents.length === 0 ? (
            <div className="text-sm text-white/60">Nicio acțiune încă.</div>
          ) : (
            intents.map((i) => (
              <div key={i.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div className="text-sm text-white font-semibold">{i.type} · {i.status}</div>
                <div className="mt-1 text-xs text-white/55">{new Date(i.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
