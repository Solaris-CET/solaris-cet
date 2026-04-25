declare module 'gsap' {
  export type Tween = { kill: () => void };
  export type Timeline = Tween & {
    to: (...args: unknown[]) => Timeline;
    fromTo: (...args: unknown[]) => Timeline;
    set: (...args: unknown[]) => Timeline;
  };
  export type Context = { revert: () => void };

  export type Gsap = {
    registerPlugin: (...plugins: unknown[]) => void;
    context: (fn: () => void, scope?: unknown) => Context;
    set: (target: unknown, vars: Record<string, unknown>) => void;
    to: (target: unknown, vars: Record<string, unknown>) => Tween;
    fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => Tween;
    timeline: (vars?: Record<string, unknown>) => Timeline;
    killTweensOf: (target: unknown) => void;
  };

  export const gsap: Gsap;
}

declare module 'gsap/ScrollTrigger' {
  export class ScrollTrigger {
    vars: Record<string, unknown>;
    start: number;
    end?: number;
    kill(): void;

    static create(vars: Record<string, unknown>): ScrollTrigger;
    static getAll(): ScrollTrigger[];
    static maxScroll(target: unknown): number;
  }
}
