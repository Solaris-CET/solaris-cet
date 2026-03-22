// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from './renderHook';
import { useTelegram } from '../hooks/useTelegram';

// ─── Helper: install a mock TelegramWebApp on window ─────────────────────

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
    themeParams: {
      bg_color: '#05060B',
      text_color: '#F4F6FF',
    },
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

// ─── Tests ────────────────────────────────────────────────────────────────

describe('useTelegram — outside Telegram WebApp', () => {
  beforeEach(() => removeTelegramWebApp());

  it('isTelegram is false when window.Telegram is not set', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.isTelegram).toBe(false);
    await unmount();
  });

  it('tg is null outside Telegram WebApp', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.tg).toBeNull();
    await unmount();
  });

  it('haptic() is a no-op and does not throw', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(() => resultRef.current.haptic()).not.toThrow();
    expect(() => resultRef.current.haptic('heavy')).not.toThrow();
    await unmount();
  });
});

describe('useTelegram — inside Telegram WebApp', () => {
  beforeEach(() => installTelegramWebApp());
  afterEach(() => removeTelegramWebApp());

  it('isTelegram is true when initData is present', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.isTelegram).toBe(true);
    await unmount();
  });

  it('tg is not null inside Telegram WebApp', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.tg).not.toBeNull();
    await unmount();
  });
});

describe('useTelegram — empty initData', () => {
  beforeEach(() => installTelegramWebApp({ initData: '' }));

  it('isTelegram is false when initData is empty string', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current.isTelegram).toBe(false);
    await unmount();
  });
});

describe('useTelegram — return shape', () => {
  beforeEach(() => removeTelegramWebApp());

  it('always returns isTelegram, tg, and haptic', async () => {
    const { resultRef, unmount } = await renderHook(() => useTelegram());
    expect(resultRef.current).toHaveProperty('isTelegram');
    expect(resultRef.current).toHaveProperty('tg');
    expect(resultRef.current).toHaveProperty('haptic');
    expect(typeof resultRef.current.haptic).toBe('function');
    await unmount();
  });
});
