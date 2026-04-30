import React, { Children, cloneElement, isValidElement, type ReactNode,useEffect, useMemo, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export type ScrollStaggerFadeUpProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  staggerMs?: number;
  threshold?: number | number[];
  rootMargin?: string;
};

export function ScrollStaggerFadeUp({
  children,
  className,
  itemClassName,
  staggerMs = 90,
  threshold = 0.15,
  rootMargin = '0px 0px -6% 0px',
}: ScrollStaggerFadeUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [scrollVisible, setScrollVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setScrollVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold, rootMargin]);

  const visible = prefersReducedMotion || scrollVisible;
  const items = useMemo(() => Children.toArray(children), [children]);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => {
        const delay = prefersReducedMotion ? undefined : `${index * staggerMs}ms`;
        const baseClass = cn(
          !prefersReducedMotion && 'transition-[opacity,transform] duration-600 ease-out will-change-transform',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]',
          itemClassName,
        );

        if (isValidElement(child)) {
          const el = child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>;
          const props = el.props;
          return cloneElement(el, {
            className: cn(props.className, baseClass),
            style: { ...props.style, transitionDelay: delay },
          });
        }

        return (
          <div key={`stagger-${index}`} className={baseClass} style={{ transitionDelay: delay }}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
