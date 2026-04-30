import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { type LangCode,LanguageContext } from '../hooks/useLanguage';
import translations from '../i18n/translations';
import BrandAssetsPage from '../pages/BrandAssetsPage';
import WhitepaperPage from '../pages/WhitepaperPage';

function wrapLang(ui: React.ReactNode, lang: LangCode) {
  return (
    <LanguageContext.Provider value={{ lang, setLang: () => undefined, t: translations[lang] }}>
      {ui}
    </LanguageContext.Provider>
  );
}

describe('Brand assets + whitepaper pages', () => {
  it('renders BrandAssetsPage', () => {
    render(wrapLang(<BrandAssetsPage />, 'en'));
    expect(screen.getByRole('heading', { name: 'Brand Assets' })).toBeTruthy();
  });

  it('renders WhitepaperPage', () => {
    render(wrapLang(<WhitepaperPage />, 'en'));
    expect(screen.getByRole('heading', { name: 'Whitepaper' })).toBeTruthy();
  });
});

