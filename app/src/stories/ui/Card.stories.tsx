import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter,CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'UI/Card',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Solaris CET</CardTitle>
        <CardDescription>9,000 CET max supply · 90-year mining horizon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-solaris-muted">A compact card surface with consistent spacing.</div>
      </CardContent>
      <CardFooter>
        <Button size="sm">Learn more</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Card className="w-[420px]">
      <CardHeader>
        <CardTitle>ReAct Terminal</CardTitle>
        <CardDescription>Answer-first, then trace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-solaris-muted">
          <p>Use cards for grouped content.</p>
          <p>Keep typography shallow and consistent.</p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" size="sm">Dismiss</Button>
      </CardFooter>
    </Card>
  ),
};

