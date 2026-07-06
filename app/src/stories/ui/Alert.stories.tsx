import type { Meta, StoryObj } from '@storybook/react';

import { Alert, AlertDescription,AlertTitle } from '@/components/ui/alert';

const meta: Meta = {
  title: 'UI/Alert',
};

export default meta;
type Story = StoryObj;

export const Info: Story = {
  render: () => (
    <Alert className="w-[520px]">
      <AlertTitle>Offline mode</AlertTitle>
      <AlertDescription>
        Built-in knowledge graph is used when the live API is unavailable.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[520px]">
      <AlertTitle>Rate limited</AlertTitle>
      <AlertDescription>Try again in a few seconds.</AlertDescription>
    </Alert>
  ),
};

