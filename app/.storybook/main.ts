import path from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  viteFinal: async (cfg) => {
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@sections': path.resolve(__dirname, '../src/sections'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@lib': path.resolve(__dirname, '../src/lib'),
    };
    return cfg;
  },
};

export default config;
