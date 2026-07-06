import type { InstallerProfile } from './surveyApi';

export type InstallerStats = {
  total_capacity_kwp: number;
  avg_score: number;
  premium_count: number;
  total_cost_usd: number;
  by_month?: Record<string, number>;
};

export type InstallerRecentReport = {
  report_id: string;
  client: string;
  city: string;
  score: number;
  kwp: number;
  timestamp: string;
};

export type InstallerMeProfile = {
  installer_id: string;
  report_count: number;
  api_key_configured: boolean;
  stats: InstallerStats;
  recent_reports: InstallerRecentReport[];
  hint?: string;
};

export type InstallerAggregate = {
  installer_id: string;
  report_count: number;
  total_capacity_kwp: number;
  avg_score: number;
  premium_count: number;
  last_report_at: string;
  technician_names: string[];
  api_key_configured: boolean;
};

function installerHeaders(installer: InstallerProfile): HeadersInit | undefined {
  const key = installer.installerApiKey?.trim();
  return key ? { 'X-Installer-Key': key } : undefined;
}

export async function fetchInstallerMe(installer: InstallerProfile): Promise<InstallerMeProfile> {
  const res = await fetch('/api/survey/installer/me', { headers: installerHeaders(installer) });
  const data = (await res.json()) as { installer?: InstallerMeProfile; error?: string };
  if (!res.ok) throw new Error(data.error || 'Profil instalator indisponibil');
  if (!data.installer) throw new Error('Profil lipsă');
  return data.installer;
}

export async function fetchInstallersAggregate(token: string): Promise<InstallerAggregate[]> {
  const res = await fetch('/api/admin/installers', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { installers?: InstallerAggregate[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Lista instalatori indisponibilă');
  return data.installers ?? [];
}