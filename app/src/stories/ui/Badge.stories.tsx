import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '@/components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'LIVE',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'LOCAL',
  },
};

