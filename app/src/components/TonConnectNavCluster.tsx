import { useEffect } from 'react';

import { useTonConnectUI } from '@tonconnect/ui-react';

import { useTonConnectFeature } from '@/tonconnect/TonConnectFeatureContext';

import { useSpecialNftBadge } from '@/hooks/useSpecialNftBadge';

import WalletBalance from './WalletBalance';
import WalletConnect from './WalletConnect';
import { HeaderTrustStrip } from './HeaderTrustStrip';

export function TonConnectNavCluster({ align = 'end' }: { align?: 'end' | 'center' }) {
  const { openModalRequested, clearOpenModalRequest } = useTonConnectFeature();
  const [tonConnectUI] = useTonConnectUI();
  const { hasSpecial } = useSpecialNftBadge();

  useEffect(() => {
    if (!openModalRequested) return;
    clearOpenModalRequest();
    void tonConnectUI.openModal().catch(() => null);
  }, [openModalRequested, clearOpenModalRequest, tonConnectUI]);

  return (
    <>
      <div className={align === 'center' ? 'w-full flex flex-col items-center gap-2' : 'flex flex-col items-end gap-1 shrink-0'}>
        <WalletConnect />
        <WalletBalance className={align === 'center' ? 'justify-center' : undefined} />
        <HeaderTrustStrip align={align === 'center' ? 'center' : undefined} />
      </div>
      {hasSpecial ? (
        <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
          <span className="text-[10px] font-mono text-emerald-200">SPECIAL NFT</span>
        </div>
      ) : null}
    </>
  );
}
