import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '@/components/ui/input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Ask Solaris CET AI…',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled',
    disabled: true,
  },
};

