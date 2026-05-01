import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TonConnectFeatureProvider } from '@/tonconnect/TonConnectFeatureProvider';

import Navigation from './Navigation';

vi.mock('../hooks/useLanguage', () => ({
  getActiveLangSync: () => 'en',
  useLanguage: () => ({
    t: {
      region: {
        ariaLabel: 'Region',
        eu: 'Europe',
        asia: 'Asia',
        disclaimerEu: 'Region: Europe.',
        disclaimerAsia: 'Region: Asia.',
      },
      nav: {
        primaryNavigation: 'Primary navigation',
        tokenomics: 'Tokenomics',
        rwa: 'RWA',
        cetAi: 'CET AI',
        whitepaper: 'Whitepaper',
        howToBuy: 'How to buy',
        resources: 'Resources',
        faq: 'FAQ',
        buyOnDedust: 'Buy on DeDust',
        opensInNewWindow: '(opens in new window)',
        openMenu: 'Open menu',
        sheetDescription: 'Menu',
      },
      hero: {
        startMining: 'Start mining',
      },
    },
  }),
}));

vi.mock('./SolarisLogoMark', () => ({
  SolarisLogoMark: () => <div data-testid="logo" />,
}));

vi.mock('./LanguageSelector', () => ({
  default: () => <div data-testid="lang" />,
}));

vi.mock('./WalletConnect', () => ({
  default: () => <button type="button">Wallet</button>,
}));

vi.mock('./WalletBalance', () => ({
  default: () => <div data-testid="balance" />,
}));

vi.mock('./HeaderTrustStrip', () => ({
  HeaderTrustStrip: () => <div data-testid="trust" />,
}));

vi.mock('./HeaderPriceTicker', () => ({
  default: () => <div data-testid="ticker" />,
}));

vi.mock('./ThemeToggle', () => ({
  default: () => <button type="button">Toggle theme</button>,
}));

describe('Navigation', () => {
  it('renders primary navigation labels', () => {
    render(
      <TonConnectFeatureProvider>
        <Navigation />
      </TonConnectFeatureProvider>,
    );

    expect(screen.getAllByRole('navigation', { name: 'Primary navigation' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tokenomics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RWA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CET AI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Whitepaper').length).toBeGreaterThan(0);
  });

  it('opens the mobile menu', async () => {
    render(
      <TonConnectFeatureProvider>
        <Navigation />
      </TonConnectFeatureProvider>,
    );

    screen.getByTestId('mobile-menu-toggle').click();
    expect(await screen.findByText(/Solaris/i)).toBeInTheDocument();
    expect(document.getElementById('mobile-menu')).not.toBeNull();
  });
});
