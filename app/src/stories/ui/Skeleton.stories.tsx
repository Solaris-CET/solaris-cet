import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from '@/components/ui/skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextRows: Story = {
  render: () => (
    <div className="w-[360px] space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ),
};

export const CardBlock: Story = {
  render: () => (
    <div className="w-[420px] rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  ),
};

