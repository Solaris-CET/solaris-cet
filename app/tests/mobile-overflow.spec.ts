import { expect,test } from '@playwright/test';

import { scrollUntilSelectorAttached,waitForAppReady } from './e2e-helpers';

type OverflowItem = {
  tag: string;
  id: string | null;
  className: string | null;
  left: number;
  right: number;
  width: number;
};

async function getOverflowing(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const bad: OverflowItem[] = [];

    if (scrollWidth <= vw + 1) {
      return { vw, scrollWidth, bad };
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('body *'));
    for (const el of nodes) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        bad.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: el.className ? String(el.className).slice(0, 180) : null,
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
      if (bad.length >= 20) break;
    }
    return { vw, scrollWidth, bad };
  });
}

test.describe('Mobile layout (no horizontal overflow)', () => {
  test.setTimeout(90_000);
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const step of [
    { name: 'hero', selector: '#hero' },
    { name: 'staking', selector: '#staking' },
    { name: 'competition', selector: '#competition' },
    { name: 'faq', selector: '#faq' },
  ]) {
    test(`no overflow at ${step.name}`, async ({ page }, testInfo) => {
      await page.goto('/?lang=ro');
      await waitForAppReady(page, { timeout: 15_000 });
      await scrollUntilSelectorAttached(page, step.selector, { timeout: 60_000 });
      await page.locator(step.selector).scrollIntoViewIfNeeded();
      await page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );

      const result = await getOverflowing(page);
      if (result.scrollWidth > result.vw + 1) {
        await testInfo.attach(`overflow-${step.name}.json`, {
          body: Buffer.from(JSON.stringify(result, null, 2)),
          contentType: 'application/json',
        });
      }
      expect(
        result.scrollWidth,
        `Unexpected horizontal overflow at ${step.name} (scrollWidth=${result.scrollWidth}, vw=${result.vw})`,
      ).toBeLessThanOrEqual(result.vw + 1);
    });
  }
});
