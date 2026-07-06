import { useCallback,useEffect, useRef, useState } from 'react';

import { AGENT_BOARD_DEPARTMENTS } from '@/lib/agentBoardDepartments';
import { buildSkillLatticePayload } from '@/lib/agentBoardSkillMix';

// ─── Types (shared with AgentBoard component) ─────────────────────────────

export type EventKind = 'solved' | 'learned' | 'talking' | 'alert' | 'skill';

export interface AgentEvent {
  id: string;
  kind: EventKind;
  dept: string;
  agentId: string;
  /** Set for `skill` events — ties this instance to AI Team role-agent mesh keys. */
  roleTitle?: string;
  collab?: string;
  message: string;
  ts: number;
}

export interface UseAgentBoardOptions {
  /** Number of events to keep visible at once. Default: 7 */
  maxEvents?: number;
  /** Milliseconds between new events. Default: 2200 */
  intervalMs?: number;
  /** Seed function for generating events. Defaults to the built-in generator. */
  generateEvent?: () => AgentEvent;
}

// ─── Department + template data (headcount: solarisDepartments via agentBoardDepartments) ─

const DEPARTMENTS = AGENT_BOARD_DEPARTMENTS;

type TemplateKind = Exclude<EventKind, 'skill'>;
type BoardDept = (typeof DEPARTMENTS)[number];

const TEMPLATES: Array<{ kind: TemplateKind; messages: string[]; collab?: true }> = [
  {
    kind: 'solved',
    messages: [
      'Resolved: DeDust pool liquidity anomaly — rebalancing complete',
      'Fixed: Cross-chain bridge timeout after learning retry pattern',
      'Optimised: RAV reasoning trace — inference time reduced by 41%',
      'Closed: Smart contract edge-case detected by SEC — patch deployed',
      'Resolved: Customer escalation — refund processed in 0.3s',
      'Fixed: Oracle price feed latency spike — root cause: RPC timeout',
      'Solved: FP&A quarterly model discrepancy — audit trail verified',
      'Fixed: Mining worker thread memory leak — GC pressure eliminated',
    ],
  },
  {
    kind: 'learned',
    collab: true,
    messages: [
      'Adopted retry-with-backoff strategy shared by #$COLLAB',
      'Learned zero-copy buffer pattern from #$COLLAB — applying to pipeline',
      'Integrated anomaly detection model shared by #$COLLAB',
      'Adopted smart contract audit checklist from SEC #$COLLAB',
      'Learned PID controller tuning from Finance #$COLLAB — DCBM 14% tighter',
      'Applied UX friction insight from #$COLLAB — conversion +8%',
      'Applied ReAct reasoning pattern from AI #$COLLAB — success rate +34%',
    ],
  },
  {
    kind: 'talking',
    messages: [
      'Coordinating with SEC on new smart contract deployment checklist',
      'Sharing token velocity data with FIN — weekly treasury sync',
      'Requesting BRAID reasoning trace from AI for audit trail',
      'Proposing UX improvement to PRD: onboarding steps from 5 → 2',
      'Syncing with R&D on Quantum OS entropy seed rotation schedule',
      'Briefing SLS on new DeDust pool depth — 3 enterprise prospects flagged',
    ],
  },
  {
    kind: 'alert',
    messages: [
      'Network latency spike detected — ENG notified, monitoring',
      'Unusual token transfer pattern flagged — SEC investigating',
      'DCBM price band deviation at 0.4% — within tolerance, logged',
      'Mining hashrate dip in EU region — auto-scaling triggered',
    ],
  },
];

function randomDept() {
  return DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
}

function randomAgentId(dept: BoardDept): string {
  const id = Math.floor(Math.random() * dept.agents) + 1;
  return `${dept.short}-${String(id).padStart(5, '0')}`;
}

/** Monotonic seq for deterministic skill lattice lines across ticks. */
let boardSkillSeq = 0;

export function defaultGenerateEvent(): AgentEvent {
  if (Math.random() < 0.28) {
    const dept = randomDept();
    const payload = buildSkillLatticePayload(dept.name, boardSkillSeq++);
    if (payload) {
      return {
        id: `skill-${Date.now()}-${Math.random()}`,
        kind: 'skill',
        dept: dept.name,
        agentId: randomAgentId(dept),
        roleTitle: payload.roleTitle,
        message: payload.line,
        ts: Date.now(),
      };
    }
  }

  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const dept = randomDept();
  const agentId = randomAgentId(dept);
  const msg = tpl.messages[Math.floor(Math.random() * tpl.messages.length)];

  let collab: string | undefined;
  let finalMsg = msg;

  if (tpl.collab) {
    const others = DEPARTMENTS.filter(d => d !== dept);
    const collabDept = others[Math.floor(Math.random() * others.length)];
    collab = randomAgentId(collabDept);
    finalMsg = msg.replaceAll('$COLLAB', collab);
  }

  return {
    id: `${Date.now()}-${Math.random()}`,
    kind: tpl.kind,
    dept: dept.name,
    agentId,
    collab,
    message: finalMsg,
    ts: Date.now(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * useAgentBoard — manages a live stream of agent activity events.
 *
 * Returns the current event list. A new event is prepended every `intervalMs`
 * milliseconds; once the list exceeds `maxEvents` items the oldest is dropped.
 *
 * @example
 * ```tsx
 * const events = useAgentBoard({ maxEvents: 5, intervalMs: 1500 });
 * ```
 */
export function useAgentBoard({
  maxEvents = 7,
  intervalMs = 2200,
  generateEvent = defaultGenerateEvent,
}: UseAgentBoardOptions = {}): AgentEvent[] {
  const [events, setEvents] = useState<AgentEvent[]>(() =>
    Array.from({ length: maxEvents }, generateEvent)
  );

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setEvents(prev => [generateEvent(), ...prev].slice(0, maxEvents));
  }, [generateEvent, maxEvents]);

  useEffect(() => {
    tickRef.current = setInterval(tick, intervalMs);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [tick, intervalMs]);

  return events;
}
