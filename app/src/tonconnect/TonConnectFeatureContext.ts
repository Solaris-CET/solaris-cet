import { createContext, useContext } from 'react';

export type TonConnectFeatureContextValue = {
  requested: boolean;
  ready: boolean;
  openModalRequested: boolean;
  enable: (opts?: { openModal?: boolean }) => void;
  clearOpenModalRequest: () => void;
  setReady: (ready: boolean) => void;
};

export const TonConnectFeatureContext = createContext<TonConnectFeatureContextValue | null>(null);

export function useTonConnectFeature() {
  const ctx = useContext(TonConnectFeatureContext);
  if (!ctx) throw new Error('useTonConnectFeature must be used within TonConnectFeatureProvider');
  return ctx;
}

