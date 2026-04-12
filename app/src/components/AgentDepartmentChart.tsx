import { RadialBarChart, RadialBar, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain } from 'lucide-react';
import { solarisDepartments } from '@/data/solarisDepartments';
import { MESH_ID_TO_AGENT_BOARD_LABEL } from '@/lib/agentBoardSkillMix';
import {
  skillFlashForBoardDept,
  skillSeedFromLabel,
  meshWhisperFromKey,
  meshStandardBurstFromKey,
} from '@/lib/meshSkillFeed';

// ─── Department data (headcount from registry; labels match AgentBoard / meshSkillFeed) ─

const CHART_FILLS = [
  '#2EE7FF',
  '#60A5FA',
  '#34D399',
  '#A78BFA',
  '#F2C94C',
  '#FB923C',
  '#F472B6',
  '#F87171',
  '#FBBF24',
  '#6EE7B7',
] as const;

const DEPT_DATA = solarisDepartments.map((d, i) => ({
  name: MESH_ID_TO_AGENT_BOARD_LABEL[d.id] ?? d.name,
  agents: d.agentCount,
  fill: CHART_FILLS[i] ?? '#94a3b8',
}));

const TOTAL = DEPT_DATA.reduce((s, d) => s + d.agents, 0);

// Normalise to 0–100 scale for radial bar
const chartData = DEPT_DATA.map(d => ({
  ...d,
  value: Math.round((d.agents / DEPT_DATA[0].agents) * 100),
  pct: ((d.agents / TOTAL) * 100).toFixed(1),
}));

// ─── Tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayload {
  payload: { name: string; agents: number; pct: string; fill: string };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const skillSalt = skillSeedFromLabel(d.name);
  const skillLine = skillFlashForBoardDept(d.name, skillSalt);
  return (
    <div className="bg-[#0D0E17] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono shadow-depth w-max max-w-[min(280px,calc(100dvw-1.5rem))]">
      <div className="font-bold mb-1" style={{ color: d.fill }}>{d.name}</div>
      <div className="text-solaris-text">{d.agents.toLocaleString()} agents</div>
      <div className="text-solaris-muted">{d.pct}% of total</div>
      {skillLine ? (
        <div
          className="mt-2 pt-2 border-t border-fuchsia-500/20 text-[9px] leading-snug text-fuchsia-200/85 line-clamp-2"
          title={skillLine}
        >
          {skillLine}
        </div>
      ) : null}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────

/**
 * AgentDepartmentChart — a radial bar chart visualising the 10 Solaris CET
 * AI agent departments by headcount, powered by recharts.
 * Designed to sit inside AITeamSection as a bento card.
 */
const AgentDepartmentChart = () => {
  return (
    <div className="bento-card p-6 border border-white/8 shadow-depth">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-solaris-gold" />
        </div>
        <span className="hud-label text-solaris-gold text-[10px]">AGENT DISTRIBUTION BY DEPARTMENT</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Radial chart */}
        <div className="w-full lg:w-64 h-64 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
            <RadialBarChart
              innerRadius="20%"
              outerRadius="90%"
              data={chartData}
              startAngle={180}
              endAngle={-180}
            >
              <RadialBar
                dataKey="value"
                background={{ fill: 'rgba(255,255,255,0.03)' }}
                cornerRadius={4}
                label={false}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1.5 w-full">
          {DEPT_DATA.map(dept => (
            <div
              key={dept.name}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/3 transition-colors"
              title={`${meshStandardBurstFromKey(`agentChart|dept|${dept.name}`)}\n—\n${meshWhisperFromKey(`agentChart|whisper|${dept.name}`)}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dept.fill }} />
                <span className="text-solaris-muted text-[11px] truncate">{dept.name}</span>
              </div>
              <span className="font-mono text-[11px] font-bold shrink-0" style={{ color: dept.fill }}>
                {(dept.agents / 1000).toFixed(0)}k
              </span>
            </div>
          ))}
          <div className="sm:col-span-2 mt-1 pt-2 border-t border-white/5 flex items-center justify-between px-2">
            <span className="text-solaris-muted text-[10px] font-mono">TOTAL</span>
            <span className="text-solaris-gold text-[11px] font-mono font-bold">
              {TOTAL.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDepartmentChart;
