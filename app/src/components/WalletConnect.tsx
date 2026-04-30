import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useJwtSession } from '@/hooks/useJwtSession';
import { useTonNetwork } from '@/hooks/useTonNetwork';
import { trackWalletConnect } from '@/lib/analytics';
import { mktConversion } from '@/lib/marketing';
import { skillSeedFromLabel,standardSkillBurst } from '@/lib/meshSkillFeed';

/**
 * WalletConnect — thin wrapper around the TonConnect UI button.
 *
 * Renders a single "Connect Wallet" button that opens the TON Connect
 * multi-wallet selector.  The button automatically reflects the connected
 * wallet state (shows address + disconnect option when connected).
 *
 * In development, when a wallet is connected, also renders a "Send Test TON"
 * button for a small test transaction.
 */
type WalletConnectMode = 'auth' | 'link';

type Props = {
  mode?: WalletConnectMode;
  onProof?: (args: {
    walletAddress: string;
    tonProof: Record<string, unknown> | null;
    publicKey: unknown;
    network: string;
  }) => void;
};

const WalletConnect = (props: Props) => {
  const mode: WalletConnectMode = props.mode ?? 'auth';
  const onProof = props.onProof;
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const lastSyncedAddress = useRef<string | null>(null);
  const { token, setToken } = useJwtSession();
  const { network } = useTonNetwork();
  const [challenge, setChallenge] = useState<{ payload: string; expiresAt: string } | null>(null);

  const walletAddress = useMemo(() => wallet?.account?.address?.trim() ?? null, [wallet?.account?.address]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`/api/auth/challenge?network=${encodeURIComponent(network)}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { payload?: unknown; expiresAt?: unknown };
        const payload = typeof json.payload === 'string' ? json.payload : '';
        const expiresAt = typeof json.expiresAt === 'string' ? json.expiresAt : '';
        if (!payload || !expiresAt) return;
        if (!alive) return;
        setChallenge({ payload, expiresAt });
      } catch {
        void 0;
      }
    };
    void run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [network]);

  useEffect(() => {
    if (!challenge?.payload) return;
    try {
      tonConnectUI.setConnectRequestParameters({ state: 'ready', value: { tonProof: challenge.payload } });
    } catch {
      void 0;
    }
  }, [challenge?.payload, tonConnectUI]);

  useEffect(() => {
    if (mode !== 'auth') return;
    if (walletAddress) return;
    if (!token) return;
    setToken(null);
    lastSyncedAddress.current = null;
  }, [mode, setToken, token, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    if (lastSyncedAddress.current === walletAddress) return;

    if (mode === 'auth') {
      try {
        trackWalletConnect({ network, source: 'tonconnect' });
        mktConversion('CompleteRegistration', { network, source: 'tonconnect' });
      } catch {
        void 0;
      }
    }
    lastSyncedAddress.current = walletAddress;

    const tonProof = (() => {
      const w = wallet as unknown as Record<string, unknown>;
      const items = w.connectItems;
      if (!items || typeof items !== 'object') return null;
      const tp = (items as Record<string, unknown>).tonProof;
      if (!tp || typeof tp !== 'object') return null;
      return tp as Record<string, unknown>;
    })();

    const pub = (wallet as unknown as { account?: { publicKey?: unknown } })?.account?.publicKey;
    if (mode === 'link') {
      onProof?.({ walletAddress, tonProof, publicKey: pub, network });
      return;
    }

    void (async () => {
      try {
        const url = new URL(window.location.href);
        const referralCode = url.searchParams.get('ref') || (() => {
          try {
            return localStorage.getItem('solaris_ref');
          } catch {
            return null;
          }
        })();
        const inviteToken = url.searchParams.get('invite') || (() => {
          try {
            return localStorage.getItem('solaris_invite');
          } catch {
            return null;
          }
        })();
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: walletAddress, tonProof, publicKey: pub, network, referralCode, inviteToken }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { token?: unknown };
        const nextToken = typeof json.token === 'string' ? json.token : '';
        if (!nextToken) return;
        setToken(nextToken);
      } catch {
        void 0;
      }
    })();
  }, [mode, network, onProof, setToken, wallet, walletAddress]);

  const handleTestTransaction = async () => {
    if (!tonConnectUI.connected) return;
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{
          address: "UQDUP2y5HBR1tRA3cZ6spDl2PV-KE2Wts_To5JTQQEf2favu",
          amount: "10000000"
        }]
      });
    } catch (err) {
      // Transaction cancelled or rejected by user — no user-facing action needed.
      // Log only in development to aid debugging without polluting production logs.
      if (import.meta.env.DEV) {
        console.warn('[WalletConnect] sendTransaction:', err);
      }
    }
  };

  return (
    <div
      className="flex items-center gap-2 min-h-[44px]"
      title={standardSkillBurst(skillSeedFromLabel('walletConnect|tonMesh'))}
    >
      <div className="touch-manipulation">
        <TonConnectButton className="ton-connect-btn" />
      </div>
      {wallet && import.meta.env.DEV ? (
        <button type="button" className="btn-gold text-sm" onClick={handleTestTransaction}>
          Send Test TON
        </button>
      ) : null}
    </div>
  );
};

export default WalletConnect;
