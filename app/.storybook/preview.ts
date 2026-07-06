import '../src/index.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'solar',
      values: [
        { name: 'solar', value: '#05060B' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default preview;

