import { expect, type Page,test } from '@playwright/test';

import { scrollUntilSelectorAttached, waitForAppReady } from './e2e-helpers';
import { E2E_I18N_START } from './navPrimaryE2eCases';

type TelegramMockParams = {
  bgColor: string;
  textColor: string;
};

function installTelegramMock(page: Page, params: TelegramMockParams) {
  return page.addInitScript(
    ({ bgColor, textColor }) => {
      (window as unknown as { __tgMockInstalled?: boolean }).__tgMockInstalled = true;
      (window as unknown as { __SOLARIS_TG_THEME_PARAMS__?: { bg_color: string; text_color: string } }).__SOLARIS_TG_THEME_PARAMS__ = {
        bg_color: bgColor,
        text_color: textColor,
      };
      const webApp = {
          expand: () => void 0,
          ready: () => void 0,
          enableClosingConfirmation: () => void 0,
          close: () => void 0,
          initData: 'tg_init_data_stub=1',
          initDataUnsafe: { user: { id: 1, first_name: 'Test', language_code: 'en' } },
          themeParams: { bg_color: bgColor, text_color: textColor },
          HapticFeedback: {
            impactOccurred: () => void 0,
            notificationOccurred: () => void 0,
            selectionChanged: () => void 0,
          },
          BackButton: {
            show: () => void 0,
            hide: () => void 0,
            onClick: () => void 0,
          },
          MainButton: {
            show: () => void 0,
            hide: () => void 0,
            setText: () => void 0,
            onClick: () => void 0,
          },
      };

      const w = window as unknown as Record<string, unknown>;
      const existing = (w as { Telegram?: unknown }).Telegram;
      if (existing && typeof existing === 'object') {
        try {
          (existing as { WebApp?: unknown }).WebApp = webApp;
          return;
        } catch {
          void 0;
        }
      }

      try {
        Object.defineProperty(window, 'Telegram', {
          value: { WebApp: webApp },
          writable: false,
          configurable: true,
          enumerable: true,
        });
      } catch {
        (w as { Telegram?: unknown }).Telegram = { WebApp: webApp };
      }
    },
    params,
  );
}

test.describe('Telegram Mini App', () => {
  test.setTimeout(60_000);

  test('aplică tema Telegram ca variabile CSS', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await installTelegramMock(page, { bgColor: '#0b1220', textColor: '#e8f3ff' });
    await page.goto(E2E_I18N_START);
    await waitForAppReady(page, { timeout: 8000 });

    await expect
      .poll(async () => {
        return page.evaluate(() => Boolean((window as unknown as { __tgMockInstalled?: boolean }).__tgMockInstalled));
      })
      .toBe(true);

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const w = window as unknown as { __SOLARIS_TG_THEME_PARAMS__?: { bg_color?: string; text_color?: string } };
          return {
            bg: w.__SOLARIS_TG_THEME_PARAMS__?.bg_color ?? '',
            text: w.__SOLARIS_TG_THEME_PARAMS__?.text_color ?? '',
          };
        });
      })
      .toEqual({ bg: '#0b1220', text: '#e8f3ff' });

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const st = getComputedStyle(document.documentElement);
          return {
            bg: st.getPropertyValue('--tg-theme-bg-color').trim(),
            text: st.getPropertyValue('--tg-theme-text-color').trim(),
          };
        });
      })
      .toEqual({ bg: '#0b1220', text: '#e8f3ff' });

    await scrollUntilSelectorAttached(page, '[data-testid="footer-landmark-section"]');
    const footer = page.locator('[data-testid="footer-landmark-section"]');
    await expect(footer).toBeVisible({ timeout: 15_000 });

    const cssVars = await page.evaluate(() => {
      const st = getComputedStyle(document.documentElement);
      return {
        bg: st.getPropertyValue('--tg-theme-bg-color').trim(),
        text: st.getPropertyValue('--tg-theme-text-color').trim(),
      };
    });

    expect(cssVars.bg).toBe('#0b1220');
    expect(cssVars.text).toBe('#e8f3ff');
  });
});
