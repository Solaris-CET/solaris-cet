import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const meta: Meta = {
  title: 'UI/Tooltip',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const LongText: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover (long)</Button>
        </TooltipTrigger>
        <TooltipContent>
          This tooltip demonstrates wrapping content and stable spacing.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

