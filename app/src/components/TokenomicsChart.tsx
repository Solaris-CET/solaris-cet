import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Coins } from 'lucide-react';
import { skillSeedFromLabel, standardSkillBurst } from '@/lib/meshSkillFeed';

const BENTO_TILE_INTERACTION =
  'transition-all duration-300 hover:!-translate-y-1 hover:!scale-100 hover:!shadow-[0_0_15px_rgba(234,179,8,0.2)]';

// ─── CET Token Distribution Data ─────────────────────────────────────────

const DISTRIBUTION = [
  { name: 'Mining Rewards (90yr)', pct: 66.66, color: '#2EE7FF', description: 'Distributed over 90 years via decaying reward schedule' },
  { name: 'DeDust Liquidity Pool', pct: 20.00, color: '#F2C94C', description: 'Initial DEX liquidity on DeDust — locked at launch' },
  { name: 'DCBM Reserve',          pct:  8.34, color: '#A78BFA', description: 'Dynamic Control Buyback Mechanism treasury reserve' },
  { name: 'Team & Development',    pct:  5.00, color: '#34D399', description: 'Founders & long-term development fund — vested 2 years' },
];

// ─── Custom tooltip ───────────────────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: typeof DISTRIBUTION[0] }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const skill = standardSkillBurst(skillSeedFromLabel(`tokenomics|pie|${d.name}`));
  return (
    <div className="bg-[#0D0E17] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono shadow-depth max-w-[min(90vw,260px)]">
      <div className="font-bold mb-1" style={{ color: d.color }}>{d.name}</div>
      <div className="text-solaris-text text-base font-bold">{d.pct.toFixed(2)}%</div>
      <div className="text-solaris-muted mt-1 text-[10px] leading-relaxed">{d.description}</div>
      <div className="text-solaris-muted mt-1">{((d.pct / 100) * 9000).toFixed(0)} CET</div>
      <p
        className="mt-2 pt-2 border-t border-fuchsia-500/20 text-[9px] text-fuchsia-200/85 leading-snug line-clamp-3"
        title={skill}
      >
        {skill}
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────

/**
 * TokenomicsChart — PieChart visualising the 4-way CET token distribution.
 * Total supply: 9,000 CET — shown in the donut center.
 */
const TokenomicsChart = () => {
  return (
    <div className={`bento-card p-6 border border-solaris-gold/20 shadow-depth ${BENTO_TILE_INTERACTION}`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
          <Coins className="w-3.5 h-3.5 text-solaris-gold" />
        </div>
        <span className="hud-label text-solaris-gold text-[10px]">TOKEN DISTRIBUTION · 9,000 CET</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Donut chart */}
        <div className="relative w-52 h-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="pct"
                strokeWidth={0}
                paddingAngle={2}
              >
                {DISTRIBUTION.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="font-mono tabular-nums font-black text-xl text-gradient-gold">9,000</div>
            <div className="text-solaris-muted text-[9px] font-mono tracking-wide">TOTAL CET</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-1 gap-2.5 w-full">
          {DISTRIBUTION.map(entry => (
            <div key={entry.name} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}50` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-solaris-text text-xs font-semibold truncate">{entry.name}</span>
                  <span className="font-mono text-xs font-bold shrink-0" style={{ color: entry.color }}>{entry.pct}%</span>
                </div>
                <div className="text-solaris-muted text-[10px] leading-relaxed">{entry.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenomicsChart;
