import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, expect, vi } from 'vitest';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

expect.extend(matchers);

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});

vi.mock('@tonconnect/ui-react', () => {
  return {
    TonConnectUIProvider: ({ children }: { children: unknown }) => children,
    TonConnectButton: (props: Record<string, unknown>) => {
      return React.createElement('button', { type: 'button', ...props }, 'TonConnect')
    },
    useTonWallet: () => null,
    useTonConnectUI: () => [
      {
        connected: false,
        setConnectRequestParameters: () => undefined,
        sendTransaction: async () => undefined,
      },
      () => undefined,
    ],
  }
});

export {};
