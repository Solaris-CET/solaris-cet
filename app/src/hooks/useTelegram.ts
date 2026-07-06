import { useLayoutEffect, useState } from 'react';

interface TelegramWebApp {
  expand: () => void;
  ready: () => void;
  enableClosingConfirmation: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (fn: () => void) => void;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (fn: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
    __SOLARIS_TG_THEME_PARAMS__?: TelegramWebApp['themeParams'];
  }
}

interface UseTelegramResult {
  isTelegram: boolean;
  tg: TelegramWebApp | null;
  haptic: (style?: 'light' | 'medium' | 'heavy') => void;
}

const getTelegramWebApp = (): TelegramWebApp | null => {
  const webApp = window.Telegram?.WebApp;
  return webApp?.initData ? webApp : null;
};

export const useTelegram = (): UseTelegramResult => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const isTelegram = tg !== null;

  useLayoutEffect(() => {
    const forcedTheme = window.__SOLARIS_TG_THEME_PARAMS__;
    if (forcedTheme?.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', forcedTheme.bg_color);
    }
    if (forcedTheme?.text_color) {
      document.documentElement.style.setProperty('--tg-theme-text-color', forcedTheme.text_color);
    }

    const webApp = getTelegramWebApp();
    if (!webApp) return;

    setTg(webApp);

    webApp.expand();
    webApp.ready();
    webApp.enableClosingConfirmation();

    if (webApp.themeParams.bg_color) {
      document.documentElement.style.setProperty('--tg-theme-bg-color', webApp.themeParams.bg_color);
    }
    if (webApp.themeParams.text_color) {
      document.documentElement.style.setProperty('--tg-theme-text-color', webApp.themeParams.text_color);
    }
  }, []);

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    tg?.HapticFeedback?.impactOccurred(style);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const ms = style === 'heavy' ? 26 : style === 'medium' ? 18 : 12;
        navigator.vibrate?.(ms);
      }
    } catch {
      void 0;
    }
  };

  return { isTelegram, tg, haptic };
};
