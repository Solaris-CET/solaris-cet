import { type ReactNode, Suspense, useEffect, useState } from 'react';

import { useNearScreen } from '../hooks/useNearScreen';

interface LazyLoadWrapperProps {
  children: ReactNode;
}

export default function LazyLoadWrapper({ children }: LazyLoadWrapperProps) {
  const { isNearScreen, fromRef } = useNearScreen({ distance: '300px' });
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (!hash) return;
      const el = fromRef.current;
      if (!el) return;
      try {
        if (el.closest(hash)) setForced(true);
      } catch {
        void 0;
      }
    };

    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [fromRef]);

  const isReady = isNearScreen || forced;

  return (
    <div
      ref={fromRef}
      className="min-h-px"
      aria-busy={!isReady ? 'true' : 'false'}
    >
      {isReady ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  );
}
