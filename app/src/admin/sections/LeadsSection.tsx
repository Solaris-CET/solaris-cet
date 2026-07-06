import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { extractSurveyReportId } from '@/lib/contactPrefill';
import { formatEur, formatMinutes } from '@/lib/softCostRoi';
import type { AdminSurveyLead, DashboardData } from '@/lib/surveyApi';

import { useAdminSession } from '../useAdminSession';

type DbLead = {
  id: string;
  source: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string | null;
  location: string;
  serviceType: string;
  message?: string | null;
};

export default function LeadsSection() {
  const { token } = useAdminSession();
  const [tab, setTab] = useState<'quotes' | 'surveys'>('surveys');
  const [dbLeads, setDbLeads] = useState<DbLead[]>([]);
  const [surveyLeads, setSurveyLeads] = useState<AdminSurveyLead[]>([]);
  const [installers, setInstallers] = useState<string[]>([]);
  const [filterInstaller, setFilterInstaller] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [engineStats, setEngineStats] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<Record<string, { low_confidence: boolean; low_confidence_count: number }>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [quotesRes, surveysRes] = await Promise.all([
        fetch('/api/admin/leads?limit=30', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/surveys?limit=30${filterInstaller ? `&installer_id=${encodeURIComponent(filterInstaller)}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (quotesRes.ok) {
        const q = (await quotesRes.json()) as { leads?: DbLead[] };
        setDbLeads(q.leads ?? []);
      }
      if (surveysRes.ok) {
        const s = (await surveysRes.json()) as {
          crm_leads?: AdminSurveyLead[];
          installers?: string[];
          engine?: DashboardData | null;
        };
        setSurveyLeads(s.crm_leads ?? []);
        setInstallers(s.installers ?? []);
        setEngineStats(s.engine ?? null);
      } else {
        setError('Nu am putut încărca rapoartele survey.');
      }
    } catch {
      setError('Eroare la încărcare.');
    } finally {
      setLoading(false);
    }
  }, [token, filterInstaller]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token || surveyLeads.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, { low_confidence: boolean; low_confidence_count: number }> = {};
      for (const lead of surveyLeads.slice(0, 8)) {
        if (!lead.reportId) continue;
        try {
          const res = await fetch(
            `/api/admin/survey-insights?report_id=${encodeURIComponent(lead.reportId)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!res.ok) continue;
          const data = (await res.json()) as { flags?: { low_confidence?: boolean; low_confidence_count?: number } };
          if (data.flags) {
            next[lead.reportId] = {
              low_confidence: Boolean(data.flags.low_confidence),
              low_confidence_count: data.flags.low_confidence_count ?? 0,
            };
          }
        } catch {
          /* optional enrichment */
        }
      }
      if (!cancelled) setInsights(next);
    })();
    return () => { cancelled = true; };
  }, [token, surveyLeads]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Leads & Survey CRM</h2>
          <p className="text-sm text-white/55">Oferte site + rapoarte șantier trimise din /survey</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      <div className="flex gap-2">
        {(['surveys', 'quotes'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${tab === t ? 'border-amber-200/30 bg-white/5 text-white' : 'border-white/10 text-white/60'}`}
          >
            {t === 'surveys' ? `Survey (${surveyLeads.length})` : `Oferte (${dbLeads.length})`}
          </button>
        ))}
      </div>

      {tab === 'surveys' && installers.length > 0 && (
        <select
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          value={filterInstaller}
          onChange={(e) => setFilterInstaller(e.target.value)}
        >
          <option value="">Toți instalatorii</option>
          {installers.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {engineStats ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm">
            <p className="font-semibold text-white">Analytics survey-engine</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <div><span className="text-white/45">Rapoarte</span><p className="font-bold text-amber-200">{engineStats.stats.total_reports}</p></div>
              <div><span className="text-white/45">Scor mediu</span><p className="font-bold text-amber-200">{engineStats.stats.avg_score}/100</p></div>
              <div><span className="text-white/45">Capacitate</span><p className="font-bold text-amber-200">{engineStats.stats.total_capacity_kwp} kWp</p></div>
              <div><span className="text-white/45">Cost API</span><p className="font-bold text-amber-200">${engineStats.total_api_cost_usd.toFixed(2)}</p></div>
            </div>
            {Object.keys(engineStats.cost_by_provider ?? {}).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                {Object.entries(engineStats.cost_by_provider).map(([prov, cost]) => (
                  <span key={prov} className="rounded-full border border-white/10 px-2 py-0.5">
                    {prov}: <strong className="text-amber-200">${Number(cost).toFixed(4)}</strong>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {engineStats.soft_cost_roi ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-sm">
              <p className="font-semibold text-white">Soft Cost ROI (documentare șantier)</p>
              <p className="mt-1 text-xs text-white/50">
                Baseline {engineStats.soft_cost_roi.config.baseline_minutes_manual} min → SOLARIS{' '}
                {engineStats.soft_cost_roi.config.target_minutes_solaris} min ·{' '}
                {formatEur(engineStats.soft_cost_roi.config.installer_hourly_rate_eur)}/h instalator
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-white/45">Timp salvat total</span>
                  <p className="font-bold text-emerald-300">
                    {formatMinutes(engineStats.soft_cost_roi.platform.minutes_saved_total)}
                  </p>
                </div>
                <div>
                  <span className="text-white/45">€ muncă salvată</span>
                  <p className="font-bold text-emerald-300">
                    {formatEur(engineStats.soft_cost_roi.platform.eur_labor_saved_total)}
                  </p>
                </div>
                <div>
                  <span className="text-white/45">€ / raport (muncă)</span>
                  <p className="font-bold text-emerald-300">
                    {formatEur(engineStats.soft_cost_roi.platform.eur_per_report_labor)}
                  </p>
                </div>
                <div>
                  <span className="text-white/45">Valoare netă (− API)</span>
                  <p className="font-bold text-emerald-300">
                    {formatEur(engineStats.soft_cost_roi.platform.eur_net_value_total)}
                  </p>
                </div>
              </div>
              {engineStats.soft_cost_roi.by_installer.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/45">
                        <th className="py-2 pr-3">Instalator</th>
                        <th className="py-2 pr-3">Rapoarte</th>
                        <th className="py-2 pr-3">Min salvate</th>
                        <th className="py-2 pr-3">€ muncă</th>
                        <th className="py-2">€ / raport</th>
                      </tr>
                    </thead>
                    <tbody>
                      {engineStats.soft_cost_roi.by_installer.map((row) => (
                        <tr key={row.installer_id} className="border-b border-white/5 text-white/80">
                          <td className="py-2 pr-3 font-mono text-amber-200/90">{row.installer_id}</td>
                          <td className="py-2 pr-3">{row.reports}</td>
                          <td className="py-2 pr-3">{formatMinutes(row.minutes_saved)}</td>
                          <td className="py-2 pr-3 text-emerald-300">{formatEur(row.eur_labor_saved)}</td>
                          <td className="py-2 text-emerald-300/90">
                            {formatEur(
                              row.reports > 0 ? row.eur_labor_saved / row.reports : 0,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'surveys' ? (
        <div className="space-y-2">
          {surveyLeads.length === 0 ? (
            <p className="text-sm text-white/50">Niciun raport survey în CRM încă.</p>
          ) : (
            surveyLeads.map((l) => (
              <div key={`${l.reportId}-${l.receivedAt}`} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{l.name} · {l.judet}</p>
                    <p className="text-white/55">{l.telefon}{l.email ? ` · ${l.email}` : ''}</p>
                    <p className="mt-1 font-mono text-xs text-amber-200/80">{l.reportId}</p>
                    {insights[l.reportId]?.low_confidence ? (
                      <span className="mt-1 inline-block rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                        Încredere scăzută ({insights[l.reportId].low_confidence_count})
                      </span>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-white/60">
                    {l.score != null ? <p className="font-bold text-amber-200">{l.score}/100</p> : null}
                    {l.capacityKwp != null ? <p>{l.capacityKwp} kWp</p> : null}
                    {l.installerName ? <p>{l.installerName}</p> : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-white/45">
                  <span>{new Date(l.receivedAt).toLocaleString('ro-RO')}</span>
                  <span className="flex gap-2">
                    {l.pdfUrl ? (
                      <a href={l.pdfUrl} target="_blank" rel="noreferrer" className="text-amber-300 hover:underline">
                        PDF
                      </a>
                    ) : null}
                    <a
                      href={`/api/survey/context?report_id=${encodeURIComponent(l.reportId)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-300 hover:underline"
                    >
                      Context
                    </a>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {dbLeads.length === 0 ? (
            <p className="text-sm text-white/50">Nicio ofertă în baza de date.</p>
          ) : (
            dbLeads.map((l) => {
              const linkedReport = extractSurveyReportId(l.message);
              return (
              <div key={l.id} className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <p className="font-semibold text-white">{l.name} · {l.location}</p>
                <p className="text-white/55">{l.phone} · {l.serviceType}</p>
                {linkedReport ? (
                  <p className="mt-1 font-mono text-xs text-emerald-300/90">
                    Legat de survey: {linkedReport}
                  </p>
                ) : null}
                {l.message ? <p className="mt-1 text-white/70">{l.message}</p> : null}
                <p className="mt-2 text-xs text-white/45">{l.createdAt}</p>
              </div>
            );
            })
          )}
        </div>
      )}
    </div>
  );
}