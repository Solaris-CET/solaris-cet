import { useCallback, useMemo, useState } from 'react';

import { TonConnectFeatureContext } from './TonConnectFeatureContext';
import type { TonConnectFeatureContextValue } from './TonConnectFeatureContext';

export function TonConnectFeatureProvider({ children }: { children: React.ReactNode }) {
  const [requested, setRequested] = useState(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname || '/';
    const noLocale = p.replace(/^\/(en|ro|es|zh|ru|pt|de)(\/|$)/, '/');
    return (
      noLocale === '/wallet' ||
      noLocale === '/account' ||
      noLocale === '/login' ||
      noLocale === '/auth' ||
      noLocale === '/staking' ||
      noLocale === '/tx-history' ||
      noLocale === '/nfts' ||
      noLocale === '/profile' ||
      noLocale === '/airdrop' ||
      noLocale === '/settings'
    );
  });
  const [ready, setReady] = useState(false);
  const [openModalRequested, setOpenModalRequested] = useState(false);

  const enable = useCallback((opts?: { openModal?: boolean }) => {
    setRequested(true);
    if (opts?.openModal) setOpenModalRequested(true);
  }, []);

  const clearOpenModalRequest = useCallback(() => {
    setOpenModalRequested(false);
  }, []);

  const value: TonConnectFeatureContextValue = useMemo(
    () => ({ requested, ready, openModalRequested, enable, clearOpenModalRequest, setReady }),
    [requested, ready, openModalRequested, enable, clearOpenModalRequest],
  );

  return <TonConnectFeatureContext.Provider value={value}>{children}</TonConnectFeatureContext.Provider>;
}
