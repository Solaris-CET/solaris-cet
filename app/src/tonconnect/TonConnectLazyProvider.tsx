import { lazy, Suspense, useEffect } from 'react';

import { useTonConnectFeature } from './TonConnectFeatureContext';
import { ensureBuffer } from '@/lib/ensureBuffer';

const TonConnectUIProviderLazy = lazy(async () => {
  await ensureBuffer();
  const mod = await import('@tonconnect/ui-react');
  return { default: mod.TonConnectUIProvider };
});

export function TonConnectLazyProvider({
  requested,
  manifestUrl,
  blockWhileLoading = false,
  children,
}: {
  requested: boolean;
  manifestUrl: string;
  blockWhileLoading?: boolean;
  children: React.ReactNode;
}) {
  if (!requested) return <>{children}</>;

  return (
    <Suspense fallback={blockWhileLoading ? null : <>{children}</>}>
      <TonConnectUIProviderLazy manifestUrl={manifestUrl}>
        <TonConnectReadyMarker />
        {children}
      </TonConnectUIProviderLazy>
    </Suspense>
  );
}

function TonConnectReadyMarker() {
  const { setReady } = useTonConnectFeature();
  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, [setReady]);
  return null;
}
