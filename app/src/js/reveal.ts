type RevealConfig = {
  threshold: number;
  rootMargin: string;
  staggerMs: number;
  staggerCap: number;
};

const defaultConfig: RevealConfig = {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px',
  staggerMs: 80,
  staggerCap: 5,
};

export class ScrollReveal {
  private config: RevealConfig;
  private observer: IntersectionObserver | null = null;
  private observed = new WeakSet<Element>();
  private handled = new WeakSet<Element>();

  constructor(config: Partial<RevealConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private prefersReducedMotion() {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  refresh() {
    if (typeof document === 'undefined') return;

    const reduce = this.prefersReducedMotion();
    const canObserve = !reduce && typeof IntersectionObserver !== 'undefined';

    if (!canObserve) {
      this.revealAllNow();
      return;
    }

    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement;
            if (!entry.isIntersecting) continue;
            this.handleIntersect(el);
          }
        },
        { threshold: this.config.threshold, rootMargin: this.config.rootMargin },
      );
    }

    const singles = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    for (const el of singles) {
      el.classList.add('reveal');
      if (el.classList.contains('revealed') || this.handled.has(el)) continue;
      if (this.observed.has(el)) continue;
      this.observer.observe(el);
      this.observed.add(el);
    }

    const staggerParents = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal-stagger]'));
    for (const parent of staggerParents) {
      if (this.handled.has(parent)) continue;
      if (this.observed.has(parent)) continue;
      this.observer.observe(parent);
      this.observed.add(parent);
    }
  }

  private revealAllNow() {
    const singles = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    for (const el of singles) {
      el.classList.add('reveal', 'revealed');
    }

    const staggerParents = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal-stagger]'));
    for (const parent of staggerParents) {
      const kids = Array.from(parent.children).filter((x): x is HTMLElement => x instanceof HTMLElement);
      for (const k of kids) {
        k.classList.add('reveal', 'revealed');
      }
    }

    this.disconnect();
  }

  private handleIntersect(el: HTMLElement) {
    if (this.handled.has(el)) return;

    if (el.hasAttribute('data-reveal-stagger')) {
      const msRaw = (el.getAttribute('data-reveal-stagger-ms') ?? '').trim();
      const capRaw = (el.getAttribute('data-reveal-stagger-cap') ?? '').trim();
      const customMs = Number.parseInt(msRaw, 10);
      const customCap = Number.parseInt(capRaw, 10);
      const staggerMs = Number.isFinite(customMs) && customMs > 0 ? customMs : this.config.staggerMs;
      const staggerCap = Number.isFinite(customCap) && customCap >= 0 ? customCap : this.config.staggerCap;

      const kids = Array.from(el.children).filter((x): x is HTMLElement => x instanceof HTMLElement);
      for (let i = 0; i < kids.length; i += 1) {
        const child = kids[i];
        child.classList.add('reveal');
        const delaySteps = Math.min(i, staggerCap);
        const delay = delaySteps * staggerMs;
        window.setTimeout(() => child.classList.add('revealed'), delay);
      }
      this.handled.add(el);
      this.observer?.unobserve(el);
      return;
    }

    el.classList.add('reveal', 'revealed');
    this.handled.add(el);
    this.observer?.unobserve(el);
  }

  disconnect() {
    this.observer?.disconnect();
    this.observer = null;
  }
}

export const scrollReveal = new ScrollReveal();

export function refreshScrollReveal() {
  scrollReveal.refresh();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshScrollReveal, { once: true });
  } else {
    refreshScrollReveal();
  }
}
