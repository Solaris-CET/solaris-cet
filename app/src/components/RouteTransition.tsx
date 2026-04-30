import { type ReactNode,useMemo } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export function RouteTransition({
  routeKey,
  className,
  children,
}: {
  routeKey: string;
  className?: string;
  children: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  const animate = useMemo(() => !prefersReducedMotion, [prefersReducedMotion]);

  return (
    <div
      className={cn(animate ? 'solaris-route-transition' : '', className)}
      data-route={routeKey}
    >
      {children}
    </div>
  );
}
