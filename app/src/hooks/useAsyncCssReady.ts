import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __solarisAsyncCssReady?: boolean;
  }
}

export function useAsyncCssReady(): boolean {
  const [ready, setReady] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.__solarisAsyncCssReady !== false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__solarisAsyncCssReady !== false) return;
    const onReady = () => setReady(true);
    window.addEventListener('solaris:cssReady', onReady);
    return () => window.removeEventListener('solaris:cssReady', onReady);
  }, []);

  return ready;
}

