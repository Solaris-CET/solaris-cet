import type { Meta, StoryObj } from '@storybook/react';

import { Tabs, TabsContent,TabsList, TabsTrigger } from '@/components/ui/tabs';

const meta: Meta = {
  title: 'UI/Tabs',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[460px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="mt-3 text-sm text-solaris-muted">High-level protocol overview.</div>
      </TabsContent>
      <TabsContent value="tokenomics">
        <div className="mt-3 text-sm text-solaris-muted">Hard cap: 9,000 CET.</div>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="reason" className="w-[520px]">
      <TabsList>
        <TabsTrigger value="reason">Reason</TabsTrigger>
        <TabsTrigger value="act">Act</TabsTrigger>
        <TabsTrigger value="verify">Verify</TabsTrigger>
      </TabsList>
      <TabsContent value="reason">
        <div className="mt-3 text-sm text-solaris-muted">Gemini produces the diagnostic.</div>
      </TabsContent>
      <TabsContent value="act">
        <div className="mt-3 text-sm text-solaris-muted">Grok produces the directive.</div>
      </TabsContent>
      <TabsContent value="verify">
        <div className="mt-3 text-sm text-solaris-muted">Cross-model check + anchor.</div>
      </TabsContent>
    </Tabs>
  ),
};

