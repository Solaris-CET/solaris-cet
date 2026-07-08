// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TwinAgentPanel } from '@/components/survey/TwinAgentPanel';
import { TWIN_AGENT_SCHEMA, type TwinAgentPlan } from '@/lib/twinAgent';

const useTwinAgentMock = vi.fn();
const executeMock = vi.fn();
const reloadMock = vi.fn();

const samplePlan: TwinAgentPlan = {
  schema: TWIN_AGENT_SCHEMA,
  agent_version: 1,
  generated_at: '2026-01-01T00:00:00Z',
  report_id: 'SOL-AG-1',
  confidence: 0.82,
  reasoning: ['Feed stabil', 'Scor bun'],
  twin_feed_schema: 'solaris-twin-feed-v1',
  actions: [
    {
      id: 'act-crm',
      type: 'suggest_crm',
      label: 'Trimite în CRM',
      priority: 'normal',
      reason: 'Lead cald',
      status: 'pending',
    },
    {
      id: 'act-permit',
      type: 'suggest_permit',
      label: 'Verifică permit',
      priority: 'high',
      reason: 'Risc mediu',
      status: 'pending',
      url: '/permit',
    },
  ],
  recommended_next: 'act-permit',
  actions_total: 2,
};

vi.mock('@/hooks/useTwinAgent', () => ({
  useTwinAgent: (...args: unknown[]) => useTwinAgentMock(...args),
}));

describe('TwinAgentPanel', () => {
  beforeEach(() => {
    useTwinAgentMock.mockReturnValue({
      plan: null,
      loading: false,
      executing: null,
      error: '',
      lastExecuted: null,
      execute: executeMock,
      reload: reloadMock,
    });
  });

  afterEach(() => {
    cleanup();
    useTwinAgentMock.mockReset();
    executeMock.mockReset();
    reloadMock.mockReset();
  });

  it('shows idle message when no plan is loaded', () => {
    render(<TwinAgentPanel reportId="SOL-1" />);
    expect(screen.getByText(/Agentul analizează twin feed/)).toBeTruthy();
  });

  it('shows error and reload control', async () => {
    const user = userEvent.setup();
    useTwinAgentMock.mockReturnValue({
      plan: null,
      loading: false,
      executing: null,
      error: 'Twin agent eșuat',
      lastExecuted: null,
      execute: executeMock,
      reload: reloadMock,
    });

    render(<TwinAgentPanel reportId="SOL-1" />);
    expect(screen.getByText('Twin agent eșuat')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Reîmprospătează planul agentului Twin' }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('renders recommended action and executes CRM suggestion', async () => {
    const user = userEvent.setup();
    const onCrmAction = vi.fn();
    useTwinAgentMock.mockReturnValue({
      plan: samplePlan,
      loading: false,
      executing: null,
      error: '',
      lastExecuted: null,
      execute: executeMock,
      reload: reloadMock,
    });

    render(<TwinAgentPanel reportId="SOL-1" onCrmAction={onCrmAction} />);

    expect(screen.getByText(/Următor pas recomandat/)).toBeTruthy();
    expect(screen.getAllByText('Verifică permit').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Deschide Verifică permit' })).toHaveAttribute(
      'href',
      '/permit',
    );

    const executeButtons = screen.getAllByRole('button', { name: /Execută/ });
    await user.click(executeButtons[0]);
    expect(onCrmAction).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledWith(samplePlan.actions[0]);
  });
});