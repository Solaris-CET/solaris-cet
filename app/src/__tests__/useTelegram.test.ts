// @vitest-environment jsdom
import { afterEach,describe, expect, it } from 'vitest';

import { useTelegram } from '../hooks/useTelegram';
import { renderHook } from './renderHook';

function installTelegramWebApp(overrides?: Partial<{ initData: string }>) {
  const mock = {
    expand: () => {},
    ready: () => {},
    enableClosingConfirmation: () => {},
    close: () => {},
    initData: overrides?.initData ?? 'query_id=AAA&user=123',
    initDataUnsafe: {
      user: { id: 123, first_name: 'Solaris', username: 'solaris_cet' },
    },
    themeParams: { bg_color: '#05060B', text_color: '#F4F6FF' },
    HapticFeedback: {
      impactOccurred: () => {},
      notificationOccurred: () => {},
      selectionChanged: () => {},
    },
    BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
    MainButton: { show: () => {}, hide: () => {}, setText: () => {}, onClick: () => {} },
  };
  Object.defineProperty(window, 'Telegram', {
    writable: true,
    configurable: true,
    value: { WebApp: mock },
  });
  return mock;
}

function removeTelegramWebApp() {
  Object.defineProperty(window, 'Telegram', {
    writable: true,
    configurable: true,
    value: undefined,
  });
}

describe('useTelegram', () => {
  afterEach(() => removeTelegramWebApp());

  it('outside / inside / empty initData + return shape + haptic', async () => {
    removeTelegramWebApp();
    const { resultRef: out, unmount: u0 } = await renderHook(() => useTelegram());
    expect(out.current.isTelegram).toBe(false);
    expect(out.current.tg).toBeNull();
    expect(() => out.current.haptic()).not.toThrow();
    expect(() => out.current.haptic('heavy')).not.toThrow();
    expect(out.current).toHaveProperty('isTelegram');
    expect(out.current).toHaveProperty('tg');
    expect(out.current).toHaveProperty('haptic');
    expect(typeof out.current.haptic).toBe('function');
    await u0();

    installTelegramWebApp();
    const { resultRef: inTg, unmount: u1 } = await renderHook(() => useTelegram());
    expect(inTg.current.isTelegram).toBe(true);
    expect(inTg.current.tg).not.toBeNull();
    await u1();
    removeTelegramWebApp();

    installTelegramWebApp({ initData: '' });
    const { resultRef: empty, unmount: u2 } = await renderHook(() => useTelegram());
    expect(empty.current.isTelegram).toBe(false);
    await u2();
  });
});
