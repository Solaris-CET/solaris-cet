import { Coins, Zap } from 'lucide-react';
import { Bar, BarChart, Cell,ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useLanguage } from '@/hooks/useLanguage';
import {
  COMPETITION_SCARCITY_CHART_ROWS,
  COMPETITION_TPS_CHART_ROWS,
} from '@/lib/competitionChartData';
import { localeForLang } from '@/lib/localeForLang';
import { skillSeedFromLabel, standardSkillBurst } from '@/lib/meshSkillFeed';

interface CompetitionBarTooltipPayload {
  value?: number;
  name?: string;
}

function CompetitionBarTooltip({
  active,
  payload,
  label,
  valueLabel,
  numberLocale,
}: {
  active?: boolean;
  payload?: readonly CompetitionBarTooltipPayload[];
  label?: string | number;
  valueLabel: string;
  numberLocale: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const name = String(label ?? p?.name ?? '');
  const v = p?.value;
  const skill = standardSkillBurst(skillSeedFromLabel(`competition|${valueLabel}|${name}`));
  const formatted =
    typeof v === 'number' ? v.toLocaleString(numberLocale, { maximumFractionDigits: 0 }) : String(v);
  return (
    <div className="rounded-lg border border-white/12 bg-[color:var(--solaris-panel)] px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)] max-w-[min(90vw,280px)]">
      <p className="font-mono text-sm font-bold text-solaris-text">{name}</p>
      <p className="text-xs text-solaris-muted mt-1 tabular-nums">
        {formatted} {valueLabel}
      </p>
      <p
        className="mt-2 pt-2 border-t border-fuchsia-500/20 text-[10px] font-mono text-fuchsia-200/85 leading-snug line-clamp-3"
        title={skill}
      >
        {skill}
      </p>
    </div>
  );
}

function formatTpsAxis(v: number): string {
  return v >= 1000 ? `${v / 1000}k` : String(v);
}

function formatSupplyAxis(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

/**
 * Recharts throughput + scarcity visuals for `CompetitionSection`.
 * Lazy-loaded; chunk fetch is further gated by viewport in the parent section.
 */
export default function CompetitionCharts() {
  const { t, lang } = useLanguage();
  const cs = t.competitionSection;
  const numberLocale = localeForLang(lang);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bento-card p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-4 h-4 text-solaris-cyan" />
          <span className="hud-label text-solaris-cyan">{cs.chartTpsLabel}</span>
        </div>
        <ResponsiveContainer width="100%" height={220} minWidth={280} minHeight={200}>
          <BarChart data={[...COMPETITION_TPS_CHART_ROWS]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--solaris-muted)', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--solaris-muted)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTpsAxis}
            />
            <Tooltip
              content={(props) => (
                <CompetitionBarTooltip
                  active={props.active}
                  payload={props.payload as readonly CompetitionBarTooltipPayload[] | undefined}
                  label={props.label}
                  valueLabel={cs.tooltipTpsUnit}
                  numberLocale={numberLocale}
                />
              )}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {COMPETITION_TPS_CHART_ROWS.map((entry) => (
                <Cell key={entry.name} fill={entry.isCET ? 'var(--solaris-gold)' : 'rgba(255,255,255,0.15)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-solaris-muted/60 text-[11px] mt-2 font-mono text-center">{cs.chartTpsCaption}</p>
      </div>

      <div className="bento-card p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="w-4 h-4 text-solaris-gold" />
          <span className="hud-label text-solaris-gold">{cs.chartScarcityLabel}</span>
        </div>
        <ResponsiveContainer width="100%" height={220} minWidth={280} minHeight={200}>
          <BarChart data={[...COMPETITION_SCARCITY_CHART_ROWS]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--solaris-muted)', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              scale="log"
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--solaris-muted)', fontSize: 10, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatSupplyAxis}
            />
            <Tooltip
              content={(props) => (
                <CompetitionBarTooltip
                  active={props.active}
                  payload={props.payload as readonly CompetitionBarTooltipPayload[] | undefined}
                  label={props.label}
                  valueLabel={cs.tooltipSupplyUnit}
                  numberLocale={numberLocale}
                />
              )}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {COMPETITION_SCARCITY_CHART_ROWS.map((entry) => (
                <Cell key={entry.name} fill={entry.isCET ? 'var(--solaris-gold)' : 'rgba(255,255,255,0.15)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-solaris-muted/60 text-[11px] mt-2 font-mono text-center">{cs.chartScarcityCaption}</p>
      </div>
    </div>
  );
}
