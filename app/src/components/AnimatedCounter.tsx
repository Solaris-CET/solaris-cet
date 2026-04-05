import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AnimatedCounter: React.FC<{
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}> = ({ value, label, prefix = '', suffix = '', duration = 2.5 }) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const target = { val: 0 };
    gsap.to(target, {
      val: value,
      duration: duration,
      ease: "power3.out",
      onUpdate: () => {
        if (node) {
          node.innerText = `${prefix}${Math.floor(target.val).toLocaleString()}${suffix}`;
        }
      },
      scrollTrigger: {
        trigger: node,
        start: "top 95%",
      }
    });
  }, [value, prefix, suffix, duration]);

  return (
    <div className="flex flex-col items-center group relative p-3 rounded-2xl transition-colors hover:bg-white/[0.02]">
      <div 
        ref={nodeRef} 
        className="text-3xl md:text-5xl font-black font-syne text-white tracking-tighter"
      >
        {prefix}0{suffix}
      </div>
      <div className="text-[10px] md:text-xs text-teal-400/80 tracking-[0.2em] uppercase mt-2 font-medium">
        {label}
      </div>
    </div>
  );
};
export default AnimatedCounter;
