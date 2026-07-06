import { expect } from '@playwright/test';

export async function waitForAppReady(page: any, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 15_000;
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return Boolean(root && root.childElementCount > 0);
  }, { timeout });

  const overlay = page.locator('.loading-overlay');
  if ((await overlay.count()) > 0) {
    await overlay.waitFor({ state: 'hidden', timeout });
  }
}

/**
 * Scroll until an element exists (sections behind `LazyLoadWrapper` are not in DOM until near viewport).
 * Uses absolute `scrollTo` + stuck detection so GSAP scroll snap on xl+ cannot cancel progress the way
 * repeated `scrollBy` sometimes does (e.g. deep link `/#authority-trust` while the id is not mounted yet).
 */
export async function scrollUntilSelectorAttached(
  page: any,
  selector: string,
  options?: { timeout?: number; stepPx?: number; intervals?: number[] },
) {
  const timeout = options?.timeout ?? 45_000;
  const stepPx = options?.stepPx ?? 600;
  const intervals = options?.intervals ?? [100, 200, 300, 400, 500];

  await expect
    .poll(
      async () => {
        return page.evaluate(
          ({ sel, step }: { sel: string; step: number }) => {
            if (document.querySelector(sel)) return true;
            const el = document.documentElement;
            const maxY = Math.max(0, el.scrollHeight - window.innerHeight);
            const y0 = window.scrollY;
            const target = Math.min(y0 + step, maxY);
            window.scrollTo(0, target);
            let y1 = window.scrollY;
            if (y1 <= y0 && y0 < maxY - 2) {
              window.scrollTo(0, Math.min(y0 + step * 2, maxY));
              y1 = window.scrollY;
            }
            if (y1 <= y0 && y0 < maxY - 2) {
              window.scrollTo(0, maxY);
            }
            return !!document.querySelector(sel);
          },
          { sel: selector, step: stepPx },
        );
      },
      { timeout, intervals },
    )
    .toBe(true);
}
