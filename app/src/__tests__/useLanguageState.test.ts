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
  it('defaults to "en" when no stored preference or browser lang match exists', async () => {
    Object.defineProperty(navigator, 'language', {
      value: 'ja-JP', // unsupported → falls back to "en"
      writable: true,
      configurable: true,
    });
    const { resultRef } = await renderHook(() => useLanguageState());
    expect(resultRef.current.lang).toBe('en');
  });

  it('picks up a persisted language from localStorage', async () => {
    localStorage.setItem('solaris_lang', 'es');
    const { resultRef } = await renderHook(() => useLanguageState());
    expect(resultRef.current.lang).toBe('es');
  });

  it('falls back to "en" for an invalid value in localStorage', async () => {
    localStorage.setItem('solaris_lang', 'xx');
    const { resultRef } = await renderHook(() => useLanguageState());
    expect(resultRef.current.lang).toBe('en');
  });

  it('auto-detects a supported browser language', async () => {
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
    const { resultRef } = await renderHook(() => useLanguageState());
    expect(resultRef.current.lang).toBe('zh');
  });

  it('updates lang and persists to localStorage when setLang is called', async () => {
    const { resultRef } = await renderHook(() => useLanguageState());
    await act(() => { resultRef.current.setLang('ru'); });
    expect(resultRef.current.lang).toBe('ru');
    expect(localStorage.getItem('solaris_lang')).toBe('ru');
  });

  it('returns a translations object for the selected language', async () => {
    const { resultRef } = await renderHook(() => useLanguageState());
    await act(() => { resultRef.current.setLang('es'); });
    expect(resultRef.current.t.nav.tokenomics).toBeDefined();
    expect(typeof resultRef.current.t.nav.tokenomics).toBe('string');
  });

  it('exposes all supported languages', () => {
    expect(SUPPORTED_LANGS).toEqual(expect.arrayContaining(['en', 'es', 'zh', 'ru', 'ro', 'pt']));
    expect(SUPPORTED_LANGS).toHaveLength(6);
  });

  it('setLang accepts every supported language without throwing', async () => {
    const { resultRef } = await renderHook(() => useLanguageState());
    for (const lang of SUPPORTED_LANGS as LangCode[]) {
      await act(() => { resultRef.current.setLang(lang); });
      expect(resultRef.current.lang).toBe(lang);
    }
  });
});
