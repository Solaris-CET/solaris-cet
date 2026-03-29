import { useEffect, useState } from 'react';
import {
  Users, Code2, TrendingUp, Brain, Coins,
  Globe, Palette, Shield, FileCheck, Crown,
  MessageCircle, Lightbulb, CheckCircle, AlertTriangle, Dna,
} from 'lucide-react';
import { useAgentBoard, type EventKind } from '../hooks/useAgentBoard';
import { AGENT_BOARD_DEPT_TO_MESH_ID } from '@/lib/agentBoardSkillMix';
import {
  shortSkillWhisper,
  meshWhisperForAiTeamRoleAgent,
  meshWhisperForBoardLiveAgent,
  meshStandardBurstForBoardLiveAgent,
  meshWhisperForBoardCollab,
  meshStandardBurstForBoardCollab,
} from '@/lib/meshSkillFeed';

// ─── Department display config ───────────────────────────────────────────

interface DeptDisplay {
  name: string;
  short: string;
  color: string;
  bg: string;
  bar: string;
  icon: typeof Users;
}

const DEPT_DISPLAY: Record<string, DeptDisplay> = {
  'Customer Ops': { name: 'Customer Ops', short: 'CX',  color: 'text-cyan-400',     bg: 'bg-cyan-400/10',     bar: 'bg-cyan-400',      icon: Users      },
  'Engineering':  { name: 'Engineering',  short: 'ENG', color: 'text-blue-400',     bg: 'bg-blue-400/10',     bar: 'bg-blue-400',      icon: Code2      },
  'Sales':        { name: 'Sales',        short: 'SLS', color: 'text-emerald-400',  bg: 'bg-emerald-400/10',  bar: 'bg-emerald-400',   icon: TrendingUp },
  'Data & AI':    { name: 'Data & AI',    short: 'AI',  color: 'text-purple-400',   bg: 'bg-purple-400/10',   bar: 'bg-purple-400',    icon: Brain      },
  'Finance':      { name: 'Finance',      short: 'FIN', color: 'text-solaris-gold', bg: 'bg-solaris-gold/10', bar: 'bg-solaris-gold',  icon: Coins      },
  'Marketing':    { name: 'Marketing',    short: 'MKT', color: 'text-orange-400',   bg: 'bg-orange-400/10',   bar: 'bg-orange-400',    icon: Globe      },
  'Product':      { name: 'Product',      short: 'PRD', color: 'text-pink-400',     bg: 'bg-pink-400/10',     bar: 'bg-pink-400',      icon: Palette    },
  'Security':     { name: 'Security',     short: 'SEC', color: 'text-red-400',      bg: 'bg-red-400/10',      bar: 'bg-red-400',       icon: Shield     },
  'Legal':        { name: 'Legal',        short: 'LGL', color: 'text-amber-400',    bg: 'bg-amber-400/10',    bar: 'bg-amber-400',     icon: FileCheck  },
  'Research':     { name: 'Research',     short: 'R&D', color: 'text-solaris-cyan', bg: 'bg-solaris-cyan/10', bar: 'bg-solaris-cyan',  icon: Crown      },
};

const KIND_CONFIG: Record<EventKind, { icon: typeof MessageCircle; label: string; color: string; bg: string }> = {
  solved:  { icon: CheckCircle,   label: 'SOLVED',  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  learned: { icon: Lightbulb,     label: 'LEARNED', color: 'text-solaris-gold', bg: 'bg-solaris-gold/10' },
  talking: { icon: MessageCircle, label: 'TALKING', color: 'text-solaris-cyan', bg: 'bg-solaris-cyan/10' },
  alert:   { icon: AlertTriangle, label: 'ALERT',   color: 'text-red-400',     bg: 'bg-red-400/10' },
  skill:   { icon: Dna,           label: 'SKILL',   color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/15' },
};

function timeSince(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * AgentBoard — enterprise-grade live activity feed. 200,000 agents talking,
 * learning, and solving problems in real time. Styled as a bento card with
 * colour-coded department bars and event-type badges.
 */
const AgentBoard = () => {
  const events = useAgentBoard({ maxEvents: 7, intervalMs: 2200 });
  const [footTick, setFootTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setFootTick((n) => n + 1), 7200);
    return () => window.clearInterval(id);
  }, []);

  const footerSkill = shortSkillWhisper(900 + footTick);

  return (
    <div className="bento-card border border-white/8 overflow-hidden shadow-depth">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-white/6 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5">
          <span className="live-dot" />
          <span className="hud-label text-emerald-400 text-[10px]">LIVE AGENT ACTIVITY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-solaris-muted text-[10px]">200,000 ONLINE</span>
          <div className="flex gap-1">
            {(['solved', 'learned', 'talking', 'alert', 'skill'] as EventKind[]).map(k => {
              const kc = KIND_CONFIG[k];
              const KindIcon = kc.icon;
              return (
                <span key={k} className={`w-5 h-5 rounded-md ${kc.bg} flex items-center justify-center`}>
                  <KindIcon className={`w-2.5 h-2.5 ${kc.color}`} />
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feed */}
      <ul className="divide-y divide-white/4" aria-live="polite" aria-label="Live agent activity feed">
        {events.map((ev) => {
          const dept = DEPT_DISPLAY[ev.dept] ?? DEPT_DISPLAY['Engineering'];
          const DeptIcon = dept.icon;
          const kc = KIND_CONFIG[ev.kind];
          const KindIcon = kc.icon;
          const meshDeptId = AGENT_BOARD_DEPT_TO_MESH_ID[ev.dept];
          const instanceBurst = meshStandardBurstForBoardLiveAgent(
            ev.agentId,
            ev.dept,
            ev.kind,
            ev.roleTitle,
            ev.message
          );
          const rowTitle = [
            ev.message,
            instanceBurst,
            ev.collab
              ? `↔ ${ev.collab}\n${meshStandardBurstForBoardCollab(ev.collab)}\n${meshWhisperForBoardCollab(ev.collab)}`
              : '',
          ]
            .filter(Boolean)
            .join('\n—\n');
          const agentBadgeTitle =
            ev.roleTitle && meshDeptId
              ? meshWhisperForAiTeamRoleAgent(meshDeptId, ev.roleTitle)
              : meshWhisperForBoardLiveAgent(
                  ev.agentId,
                  ev.dept,
                  ev.kind,
                  ev.roleTitle,
                  ev.message
                );

          return (
            <li
              key={ev.id}
              className="flex items-stretch gap-0 group hover:bg-white/2 transition-colors duration-150"
              title={rowTitle}
            >
              {/* Dept colour bar */}
              <div className={`w-0.5 shrink-0 ${dept.bar} opacity-60`} />

              {/* Content */}
              <div className="flex items-start gap-3 px-4 py-3 flex-1 min-w-0">
                {/* Department badge */}
                <div className={`shrink-0 w-7 h-7 rounded-lg ${dept.bg} flex items-center justify-center mt-0.5`}>
                  <DeptIcon className={`w-3.5 h-3.5 ${dept.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono text-[10px] font-bold ${dept.color}`}
                      title={agentBadgeTitle}
                    >
                      {ev.agentId}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${kc.bg} text-[9px] font-bold ${kc.color}`}>
                      <KindIcon className="w-2.5 h-2.5" />
                      {kc.label}
                    </span>
                  </div>
                  <p className="text-solaris-muted text-xs leading-relaxed mt-0.5 truncate">
                    {ev.message}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="shrink-0 font-mono text-[9px] text-solaris-muted/40 mt-1">
                  {timeSince(ev.ts)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-white/6 bg-black/20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1 min-w-0 sm:flex-row sm:items-center sm:gap-4 sm:flex-1 sm:min-w-0">
          <span className="text-solaris-muted/50 text-[10px] font-mono shrink-0">
            Powered by RAV Protocol · Grok × Gemini
          </span>
          <span
            className="text-[9px] font-mono text-fuchsia-300/70 truncate min-w-0"
            title={footerSkill}
          >
            {footerSkill}
          </span>
        </div>
        <div className="flex gap-1 shrink-0 self-end sm:self-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                background: `hsl(${i * 36}, 80%, 60%)`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentBoard;
