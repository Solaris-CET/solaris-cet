import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type AnimatedCounterProps = {
  value?: number;
  end?: number;
  label?: string;
  labelClassName?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
  wrapperClassName?: string;
  meshTitleKey?: string;
};

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  end,
  label,
  labelClassName,
  prefix = '',
  suffix = '',
  duration = 2.5,
  decimals = 0,
  className = '',
  wrapperClassName = '',
  meshTitleKey,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targetValue = typeof value === 'number' ? value : (end ?? 0);
    if (reducedMotion) {
      const formatted = targetValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      node.innerText = `${prefix}${formatted}${suffix}`;
      return;
    }
    const target = { val: 0 };
    gsap.to(target, {
      val: targetValue,
      duration: duration,
      ease: "power3.out",
      onUpdate: () => {
        if (node) {
          const formatted = target.val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
          node.innerText = `${prefix}${formatted}${suffix}`;
        }
      },
      scrollTrigger: {
        trigger: node,
        start: "top 95%",
      }
    });
  }, [value, end, prefix, suffix, duration, decimals]);

  return (
    <div className={`flex flex-col items-center group relative p-3 rounded-2xl transition-colors hover:bg-white/[0.02] ${wrapperClassName}`}>
      <div 
        ref={nodeRef} 
        title={meshTitleKey}
        className={`text-3xl md:text-5xl font-black text-white tracking-tighter ${className}`}
      >
        {prefix}0{suffix}
      </div>
      {label ? (
        <div
          className={
            labelClassName ??
            'text-[10px] md:text-xs text-teal-400/80 tracking-[0.2em] uppercase mt-2 font-medium'
          }
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
export default AnimatedCounter;
