import type { Meta, StoryObj } from '@storybook/react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Initiate Protocol',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Trash2 />
      Delete
    </Button>
  ),
};

