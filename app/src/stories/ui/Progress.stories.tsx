import type { Meta, StoryObj } from '@storybook/react';

import { Progress } from '@/components/ui/progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Mid: Story = {
  args: {
    value: 55,
    className: 'w-[320px]',
  },
};

export const Full: Story = {
  args: {
    value: 100,
    className: 'w-[320px]',
  },
};

