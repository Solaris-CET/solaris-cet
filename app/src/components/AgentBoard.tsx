import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Users, Code2, TrendingUp, Brain, Coins,
  Globe, Palette, Shield, FileCheck, Crown,
  MessageCircle, Lightbulb, CheckCircle, AlertTriangle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type EventKind = 'solved' | 'learned' | 'talking' | 'alert';

interface AgentEvent {
  id: string;
  kind: EventKind;
  dept: string;
  agentId: string;
  collab?: string;         // colleague agent they learned from
  message: string;
  ts: number;              // Date.now() at creation
}

// ─── Department registry ────────────────────────────────────────────────────

interface Dept {
  name: string;
  short: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof Users;
  agents: number;
}

const DEPARTMENTS: Dept[] = [
  { name: 'Customer Ops',  short: 'CX',  color: 'text-cyan-400',     bg: 'bg-cyan-400/10',     border: 'border-cyan-400/30',    icon: Users,     agents: 48_000 },
  { name: 'Engineering',   short: 'ENG', color: 'text-blue-400',     bg: 'bg-blue-400/10',     border: 'border-blue-400/30',    icon: Code2,     agents: 34_000 },
  { name: 'Sales',         short: 'SLS', color: 'text-emerald-400',  bg: 'bg-emerald-400/10',  border: 'border-emerald-400/30', icon: TrendingUp, agents: 27_000 },
  { name: 'Data & AI',     short: 'AI',  color: 'text-purple-400',   bg: 'bg-purple-400/10',   border: 'border-purple-400/30',  icon: Brain,     agents: 21_000 },
  { name: 'Finance',       short: 'FIN', color: 'text-solaris-gold', bg: 'bg-solaris-gold/10', border: 'border-solaris-gold/30',icon: Coins,     agents: 18_000 },
  { name: 'Marketing',     short: 'MKT', color: 'text-orange-400',   bg: 'bg-orange-400/10',   border: 'border-orange-400/30',  icon: Globe,     agents: 17_000 },
  { name: 'Product',       short: 'PRD', color: 'text-pink-400',     bg: 'bg-pink-400/10',     border: 'border-pink-400/30',    icon: Palette,   agents: 13_000 },
  { name: 'Security',      short: 'SEC', color: 'text-red-400',      bg: 'bg-red-400/10',      border: 'border-red-400/30',     icon: Shield,    agents: 10_000 },
  { name: 'Legal',         short: 'LGL', color: 'text-amber-400',    bg: 'bg-amber-400/10',    border: 'border-amber-400/30',   icon: FileCheck, agents: 7_000  },
  { name: 'Research',      short: 'R&D', color: 'text-solaris-cyan', bg: 'bg-solaris-cyan/10', border: 'border-solaris-cyan/30',icon: Crown,     agents: 5_000  },
];

// ─── Event templates ─────────────────────────────────────────────────────────

const TEMPLATES: Array<{ kind: EventKind; messages: string[]; collab?: true }> = [
  {
    kind: 'solved',
    messages: [
      'Resolved: DeDust pool liquidity anomaly — rebalancing complete',
      'Fixed: Cross-chain bridge timeout after learning retry pattern from ENG',
      'Optimised: RAV reasoning trace — inference time reduced by 41%',
      'Closed: Smart contract edge-case detected by SEC — patch deployed',
      'Resolved: Customer escalation #44821 — refund processed in 0.3s',
      'Fixed: Oracle price feed latency spike — root cause: RPC timeout',
      'Solved: FP&A quarterly model discrepancy — SEC audit trail verified',
      'Resolved: TON wallet deep-link failure on iOS — updated manifest',
      'Fixed: Mining worker thread memory leak — GC pressure eliminated',
      'Closed: Compliance flag on transaction #88203 — false positive confirmed',
    ],
  },
  {
    kind: 'learned',
    collab: true,
    messages: [
      'Adopted retry-with-backoff strategy shared by ENG #$COLLAB',
      'Learned zero-copy buffer pattern from Data & AI #$COLLAB — applying to pipeline',
      'Integrated anomaly detection model shared by R&D #$COLLAB',
      'Adopted smart contract audit checklist from SEC #$COLLAB',
      'Learned PID controller tuning from Finance #$COLLAB — DCBM now 14% tighter',
      'Applied UX friction-reduction insight from PRD #$COLLAB — conversion +8%',
      'Adopted legal clause template from LGL #$COLLAB — contract review 2× faster',
      'Learned geo-targeting logic from MKT #$COLLAB — campaign ROI +22%',
      'Integrated zero-battery mining constraint from R&D #$COLLAB',
      'Applied ReAct reasoning pattern from AI #$COLLAB — task success rate +34%',
    ],
  },
  {
    kind: 'talking',
    messages: [
      'Coordinating with SEC on new smart contract deployment checklist',
      'Sharing token velocity data with FIN — weekly treasury sync',
      'Requesting BRAID reasoning trace from AI for audit trail',
      'Proposing UX improvement to PRD: reduced onboarding steps from 5 → 2',
      'Syncing with R&D on Quantum OS entropy seed rotation schedule',
      'Briefing SLS on new DeDust pool depth data — 3 enterprise prospects flagged',
      'Asking LGL to review new cross-chain bridge terms before deploy',
      'Pushing mining performance data to MKT for community dashboard',
      'Coordinating ENG on critical path for Q2 DAO launch',
      'Requesting CX sentiment analysis from last 1,000 support tickets',
    ],
  },
  {
    kind: 'alert',
    messages: [
      'Network latency spike detected — ENG notified, monitoring',
      'Unusual token transfer pattern flagged — SEC investigating',
      'DCBM price band deviation at 0.4% — within tolerance, logged',
      'Mining hashrate dip detected in EU region — auto-scaling triggered',
      'Whitepaper IPFS gateway response degraded — fallback activated',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomDept(): Dept {
  return DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
}

function randomAgentId(dept: Dept): string {
  const max = dept.agents;
  const id = Math.floor(Math.random() * max) + 1;
  return `${dept.short}-${String(id).padStart(5, '0')}`;
}

function generateEvent(): AgentEvent {
  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const dept = randomDept();
  const agentId = randomAgentId(dept);
  const msg = tpl.messages[Math.floor(Math.random() * tpl.messages.length)];

  let collab: string | undefined;
  let finalMsg = msg;

  if (tpl.collab) {
    const collabDept = DEPARTMENTS.filter(d => d !== dept)[
      Math.floor(Math.random() * (DEPARTMENTS.length - 1))
    ];
    collab = randomAgentId(collabDept);
    finalMsg = msg.replace('$COLLAB', collab);
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

function timeSince(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

const KIND_CONFIG: Record<EventKind, { icon: typeof MessageCircle; label: string; color: string }> = {
  solved:  { icon: CheckCircle,   label: 'SOLVED',   color: 'text-emerald-400' },
  learned: { icon: Lightbulb,     label: 'LEARNED',  color: 'text-solaris-gold' },
  talking: { icon: MessageCircle, label: 'TALKING',  color: 'text-solaris-cyan' },
  alert:   { icon: AlertTriangle, label: 'ALERT',    color: 'text-red-400' },
};

const MAX_EVENTS = 7;
const INTERVAL_MS = 2200;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AgentBoard — a live activity feed showing Solaris CET's 200,000 autonomous
 * agents talking to each other, learning from colleagues, and solving problems
 * in real time. New events appear every ~2 seconds; oldest are pushed off the
 * bottom when the feed reaches MAX_EVENTS entries.
 *
 * The component is self-contained — no props, no external state. It generates
 * synthetic events deterministically from the department × template matrix and
 * uses only CSS transitions for smooth entry/exit animations.
 */
const AgentBoard = () => {
  const [events, setEvents] = useState<AgentEvent[]>(() =>
    Array.from({ length: MAX_EVENTS }, generateEvent)
  );
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setEvents(prev => [generateEvent(), ...prev].slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(tick, INTERVAL_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [tick]);

  return (
    <div className="glass-card p-4 lg:p-6 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span className="hud-label text-emerald-400">LIVE AGENT ACTIVITY</span>
        </div>
        <span className="font-mono text-solaris-muted text-[10px]">200,000 AGENTS ONLINE</span>
      </div>

      {/* Feed */}
      <ul className="space-y-2" aria-live="polite" aria-label="Live agent activity feed">
        {events.map((ev) => {
          const dept = DEPARTMENTS.find(d => d.name === ev.dept) ?? DEPARTMENTS[0];
          const DeptIcon = dept.icon;
          const kc = KIND_CONFIG[ev.kind];
          const KindIcon = kc.icon;

          return (
            <li
              key={ev.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-all duration-300"
            >
              {/* Department badge */}
              <div className={`shrink-0 w-7 h-7 rounded-lg ${dept.bg} flex items-center justify-center`}>
                <DeptIcon className={`w-3.5 h-3.5 ${dept.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-[10px] font-bold ${dept.color}`}>
                    {ev.agentId}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${kc.color}`}>
                    <KindIcon className="w-3 h-3" />
                    {kc.label}
                  </span>
                </div>
                <p className="text-solaris-muted text-xs leading-relaxed mt-0.5 truncate">
                  {ev.message}
                </p>
              </div>

              {/* Timestamp */}
              <span className="shrink-0 font-mono text-[9px] text-solaris-muted/50 mt-0.5">
                {timeSince(ev.ts)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AgentBoard;
