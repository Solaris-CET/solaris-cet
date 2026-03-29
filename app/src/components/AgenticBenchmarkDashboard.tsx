import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Gauge, Sparkles } from 'lucide-react';

/** Normalised 0–100 scores for narrative comparison (illustrative). */
const rows = [
  { metric: 'Parallel agents', solaris: 100, standard: 4, marketplace: 28 },
  { metric: 'Dual verification', solaris: 100, standard: 12, marketplace: 42 },
  { metric: 'Chain + RWA synergy', solaris: 100, standard: 2, marketplace: 18 },
  { metric: 'Open-web reach', solaris: 100, standard: 22, marketplace: 48 },
  { metric: 'Effective throughput', solaris: 100, standard: 6, marketplace: 10 },
  { metric: 'Supply scarcity (inv.)', solaris: 100, standard: 8, marketplace: 8 },
];

const AgenticBenchmarkDashboard = () => (
  <div className="bento-card border border-white/10 p-5 sm:p-6">
    <div className="flex items-center gap-2 mb-1">
      <Gauge className="w-4 h-4 text-solaris-cyan" />
      <span className="hud-label text-solaris-cyan text-[10px]">VISUAL BENCHMARK · 200K DISTRIBUTED MESH</span>
    </div>
    <p className="text-solaris-muted text-xs sm:text-sm leading-relaxed mb-4 max-w-2xl flex flex-wrap items-start gap-2">
      <Sparkles className="w-3.5 h-3.5 text-solaris-gold shrink-0 mt-0.5" />
      Normalised scores: Solaris CET vs a typical single-model chat product vs a generic “agent marketplace”
      stack — same axes, different physics once you add dual-AI RAV, TON settlement, and two hundred thousand
      concurrent workers.
    </p>

    <div className="w-full h-[min(380px,55vh)] min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#a6a9b6', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="metric"
            width={118}
            tick={{ fill: '#e8eaf2', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0D0E17',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value) => [`${value ?? ''}`, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => (
              <span className="text-solaris-muted">
                {value === 'solaris' ? 'Solaris (200k + RAV)' : value === 'standard' ? 'Standard AI app' : 'Agent marketplace'}
              </span>
            )}
          />
          <Bar dataKey="solaris" name="solaris" fill="#F2C94C" radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar dataKey="standard" name="standard" fill="rgba(255,255,255,0.18)" radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar dataKey="marketplace" name="marketplace" fill="rgba(46,231,255,0.35)" radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="text-[10px] text-solaris-muted/60 font-mono mt-2">
      Indices are qualitative composites for communication — not a third-party benchmark.
    </p>
  </div>
);

export default AgenticBenchmarkDashboard;
