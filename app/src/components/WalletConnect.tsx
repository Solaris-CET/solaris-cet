import { useEffect, useRef } from 'react';
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { standardSkillBurst, skillSeedFromLabel } from '@/lib/meshSkillFeed';

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
const WalletConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const lastSyncedAddress = useRef<string | null>(null);

  useEffect(() => {
    const address = wallet?.account?.address?.trim();
    if (!address || lastSyncedAddress.current === address) return;
    lastSyncedAddress.current = address;

    void (async () => {
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        });
        if (!res.ok && import.meta.env.DEV) {
          console.warn('[WalletConnect] /api/auth failed:', res.status, await res.text());
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[WalletConnect] /api/auth:', e);
        }
      }
    })();
  }, [wallet?.account?.address]);

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
