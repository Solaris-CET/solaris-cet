import { Suspense, type ReactNode } from 'react';
import { useNearScreen } from '../hooks/useNearScreen';

interface LazyLoadWrapperProps {
  children: ReactNode;
}

export default function LazyLoadWrapper({ children }: LazyLoadWrapperProps) {
  const { isNearScreen, fromRef } = useNearScreen({ distance: '300px' });

  return (
    <div
      ref={fromRef}
      className="min-h-px"
      aria-busy={!isNearScreen ? 'true' : 'false'}
    >
      {isNearScreen ? <Suspense fallback={null}>{children}</Suspense> : null}
    </div>
  );
}
