import { expect, type Page } from '@playwright/test';

export async function waitForAppReady(page: Page, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 4000;
  await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout }).catch(() => {});
}

/**
 * Scroll until an element exists (sections behind `LazyLoadWrapper` are not in DOM until near viewport).
 * Uses absolute `scrollTo` + stuck detection so GSAP scroll snap on xl+ cannot cancel progress the way
 * repeated `scrollBy` sometimes does (e.g. deep link `/#authority-trust` while the id is not mounted yet).
 */
export async function scrollUntilSelectorAttached(
  page: Page,
  selector: string,
  options?: { timeout?: number; stepPx?: number; intervals?: number[] },
) {
  const timeout = options?.timeout ?? 45_000;
  const stepPx = options?.stepPx ?? 900;
  const intervals = options?.intervals ?? [100, 200, 300, 400, 500];

  await expect
    .poll(
      async () => {
        return page.evaluate(
          ({ sel, step }) => {
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
