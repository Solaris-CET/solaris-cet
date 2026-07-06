/** Soft-cost ROI — mirrors survey-engine `soft_cost_roi.py` for admin display. */

export type SoftCostRoiInstaller = {
  installer_id: string;
  reports: number;
  capacity_kwp: number;
  api_cost_usd: number;
  minutes_saved: number;
  eur_labor_saved: number;
  eur_design_benchmark_saved: number;
  eur_net_labor_minus_api: number;
};

export type SoftCostRoiPlatform = {
  total_reports: number;
  total_capacity_kwp: number;
  minutes_saved_total: number;
  eur_labor_saved_total: number;
  eur_design_benchmark_saved_total: number;
  api_cost_usd_total: number;
  api_cost_eur_total: number;
  eur_net_value_total: number;
  eur_per_report_labor: number;
  minutes_per_report: number;
};

export type SoftCostRoi = {
  config: {
    baseline_minutes_manual: number;
    target_minutes_solaris: number;
    minutes_saved_per_report: number;
    installer_hourly_rate_eur: number;
    soft_cost_usd_per_w: number;
    eur_usd_rate: number;
    eur_labor_saved_per_report: number;
  };
  platform: SoftCostRoiPlatform;
  by_installer: SoftCostRoiInstaller[];
};

export function formatEur(value: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMinutes(value: number): string {
  return `${Math.round(value)} min`;
}

/** Labor € saved per single report (minutes_saved × hourly_rate). */
export function laborEurPerReport(
  minutesSaved: number,
  hourlyRateEur: number,
): number {
  return Math.round((minutesSaved / 60) * hourlyRateEur * 100) / 100;
}