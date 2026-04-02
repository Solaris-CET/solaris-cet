// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from './renderHook';
import { useLanguageState, SUPPORTED_LANGS } from '../hooks/useLanguage';
import type { LangCode } from '../hooks/useLanguage';

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, 'language', {
    value: 'en-US',
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, 'languages', {
    value: ['en-US'],
    writable: true,
    configurable: true,
  });
});

describe('useLanguageState', () => {
  it('defaults, localStorage, invalid key, browser zh, setLang, document lang, t, SUPPORTED_LANGS', async () => {
    Object.defineProperty(navigator, 'language', {
      value: 'ja-JP',
      writable: true,
      configurable: true,
    });
    const { resultRef: r0 } = await renderHook(() => useLanguageState());
    expect(r0.current.lang).toBe('en');

    localStorage.setItem('solaris_lang', 'es');
    const { resultRef: r1 } = await renderHook(() => useLanguageState());
    expect(r1.current.lang).toBe('es');

    localStorage.setItem('solaris_lang', 'xx');
    const { resultRef: r2 } = await renderHook(() => useLanguageState());
    expect(r2.current.lang).toBe('en');

    Object.defineProperty(navigator, 'language', {
      value: 'zh-TW',
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'languages', {
      value: ['zh-TW'],
      writable: true,
      configurable: true,
    });
    const { resultRef: r3 } = await renderHook(() => useLanguageState());
    expect(r3.current.lang).toBe('zh');

    const { resultRef: r4 } = await renderHook(() => useLanguageState());
    await act(() => {
      r4.current.setLang('ru');
    });
    expect(r4.current.lang).toBe('ru');
    expect(localStorage.getItem('solaris_lang')).toBe('ru');

    const { resultRef: r5 } = await renderHook(() => useLanguageState());
    await act(() => {
      r5.current.setLang('ro');
    });
    expect(document.documentElement.lang).toBe('ro');
    expect(document.documentElement.dir).toBe('ltr');

    const { resultRef: r6 } = await renderHook(() => useLanguageState());
    await act(() => {
      r6.current.setLang('es');
    });
    expect(r6.current.t.nav.tokenomics).toBeDefined();
    expect(typeof r6.current.t.nav.tokenomics).toBe('string');

    expect(SUPPORTED_LANGS).toEqual(expect.arrayContaining(['en', 'es', 'zh', 'ru', 'ro', 'pt', 'de']));
    expect(SUPPORTED_LANGS).toHaveLength(7);

    const { resultRef: r7 } = await renderHook(() => useLanguageState());
    for (const lang of SUPPORTED_LANGS as LangCode[]) {
      await act(() => {
        r7.current.setLang(lang);
      });
      expect(r7.current.lang).toBe(lang);
    }
  });
});
