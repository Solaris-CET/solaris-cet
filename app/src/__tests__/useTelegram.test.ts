// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from './renderHook';
import { useTelegram } from '../hooks/useTelegram';

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

  it('outside WebApp: false, null tg, haptic no-op, return shape', async () => {
    removeTelegramWebApp();
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.isTelegram).toBe(false);
    expect(resultRef.current.tg).toBeNull();
    expect(() => resultRef.current.haptic()).not.toThrow();
    expect(() => resultRef.current.haptic('heavy')).not.toThrow();
    expect(resultRef.current).toHaveProperty('isTelegram');
    expect(resultRef.current).toHaveProperty('tg');
    expect(resultRef.current).toHaveProperty('haptic');
    expect(typeof resultRef.current.haptic).toBe('function');
    await unmount();
  });

  it('inside WebApp vs empty initData', async () => {
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
