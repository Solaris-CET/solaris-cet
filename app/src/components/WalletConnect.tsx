import { TonConnectButton } from '@tonconnect/ui-react';

/**
 * WalletConnect — thin wrapper around the TonConnect UI button.
 *
 * Renders a single "Connect Wallet" button that opens the TON Connect
 * multi-wallet selector.  The button automatically reflects the connected
 * wallet state (shows address + disconnect option when connected).
 */
const WalletConnect = () => (
  <TonConnectButton className="ton-connect-btn" />
);

export default WalletConnect;
