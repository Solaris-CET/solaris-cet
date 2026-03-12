import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

/**
 * WalletConnect — thin wrapper around the TonConnect UI button.
 *
 * Renders a single "Connect Wallet" button that opens the TON Connect
 * multi-wallet selector.  The button automatically reflects the connected
 * wallet state (shows address + disconnect option when connected).
 *
 * When a wallet is connected, also renders a "Send Test TON" button that
 * sends a small test transaction to the Solaris CET contract address.
 */
const WalletConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const handleTestTransaction = async () => {
    if (!tonConnectUI.connected) return;
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{
          address: "0QCSES0TZYqcVkgoguhIb8iMEo4cvaEwmIrU5qbQgnN8fo2A",
          amount: "10000000",
          payload: "Test"
        }]
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TonConnectButton className="ton-connect-btn" />
      {wallet && (
        <button className="btn-gold text-sm" onClick={handleTestTransaction}>
          Send Test TON
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
