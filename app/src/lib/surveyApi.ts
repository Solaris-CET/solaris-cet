import type { SurveyOrchestration } from './surveyAgent';
import type { TwinFeed } from './twinFeed';
import type { CorrectionPayload, ReportContext } from './surveyContext';
import { permitPackUrl } from './surveyContext';
import type { SoftCostRoi } from './softCostRoi';

export const API_ERRORS = {
  dashboard: 'Dashboard indisponibil',
  jurisdictions: 'Jurisdicții indisponibile',
  stats: 'Statistici indisponibile',
  generate: 'Generare eșuată',
  demo: 'Demo eșuat',
  batch: 'Batch eșuat',
  twinFeed: 'Twin feed indisponibil',
  twinFeedMissing: 'Feed lipsă',
  corrections: 'Corecții indisponibile',
  orchestration: 'Orchestration indisponibilă',
  orchestrationMissing: 'Plan lipsă',
  context: 'Context indisponibil',
  contextMissing: 'Context lipsă',
  correctionSubmit: 'Corecție eșuată',
  crm: 'CRM indisponibil',
} as const;

export function apiErrorMessage(
  payload: { error?: string; detail?: string } | null | undefined,
  fallback: string,
): string {
  if (payload && typeof payload === 'object') {
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
  }
  return fallback;
}

export type ChecklistStatus = 'pass' | 'warning' | 'fail' | 'na';

export type InstallerProfile = {
  installerId: string;
  installerName: string;
  company: string;
  /** Optional SaaS API key — forwarded as X-Installer-Key when set */
  installerApiKey?: string;
};

export type SurveyFormData = {
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientPostal: string;
  clientPhone: string;
  clientEmail: string;
  jurisdictionCode: string;
  siteLatitude: number | null;
  siteLongitude: number | null;
  roofType: string;
  roofOrientation: string;
  roofPitch: number;
  usableAreaM2: number;
  annualConsumptionKwh: number;
  gridConnection: string;
  shadingLevel: string;
  existingSolar: boolean;
  structuralNotes: string;
  premium: boolean;
  checklist: {
    struct: ChecklistStatus;
    electric: ChecklistStatus;
    shading: ChecklistStatus;
    access: ChecklistStatus;
    docs: ChecklistStatus;
    compliance: ChecklistStatus;
  };
};

export type JurisdictionItem = {
  code: string;
  name: string;
  grid_operator: string;
};

export type SurveyPublicStats = {
  platform: string;
  stats: {
    total_reports: number;
    avg_score: number;
    total_capacity_kwp: number;
    total_api_cost_usd: number;
    by_installer: Record<string, number>;
  };
};

export type GenerateReportResult = {
  report_id: string;
  pdf_filename: string;
  ahj_filename: string;
  pdf_url: string;
  ahj_url: string;
  score: number;
  verdict: string;
  capacity_kwp: number;
  annual_kwh: number;
  routing_reason: string;
  cost_usd: number;
  installer_id?: string;
  orchestration?: SurveyOrchestration;
};

export type SurveyHealth = {
  platform: string;
  engine: {
    ok: boolean;
    deepseek?: boolean;
    claude?: boolean;
    kimi?: boolean;
    installer_keys_required?: boolean;
    error?: string;
    cost_budget?: {
      budget_usd: number;
      spent_usd: number;
      remaining_usd: number;
      alert: boolean;
      exceeded: boolean;
    };
  };
  engine_url: string;
};

export type BatchJobInput = {
  job_id: string;
  client_name: string;
  client_city?: string;
  client_address?: string;
  roof_type?: string;
  usable_area_m2?: number;
  annual_consumption_kwh?: number;
  premium?: boolean;
};

export type BatchResultItem = {
  job_id: string;
  success: boolean;
  report_id: string;
  pdf_filename: string;
  ahj_filename: string;
  pdf_url: string;
  ahj_url: string;
  score: number;
  error: string;
};

export type BatchRunResult = {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchResultItem[];
};

export type DashboardData = {
  version: number;
  soft_cost_roi?: SoftCostRoi;
  stats: {
    total_reports: number;
    total_cost_usd: number;
    avg_score: number;
    total_capacity_kwp: number;
    premium_count: number;
    by_installer?: Record<string, number>;
  };
  by_installer?: Record<string, number>;
  cost_by_provider: Record<string, number>;
  total_api_cost_usd: number;
  recent_reports: Array<{
    report_id: string;
    client: string;
    city: string;
    score: number;
    kwp: number;
    cost_usd: number;
    premium: boolean;
    installer_id?: string;
    technician?: string;
  }>;
};

export type AdminSurveyLead = {
  receivedAt: string;
  reportId: string;
  name: string;
  telefon: string;
  email?: string;
  judet: string;
  installerId?: string;
  installerName?: string;
  score?: number;
  capacityKwp?: number;
  pdfUrl?: string;
};

export async function fetchSurveyHealth(): Promise<SurveyHealth> {
  const res = await fetch('/api/survey/health');
  return res.json() as Promise<SurveyHealth>;
}

export async function fetchSurveyDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/survey/dashboard');
  if (!res.ok) throw new Error(API_ERRORS.dashboard);
  return res.json() as Promise<DashboardData>;
}

export async function fetchJurisdictions(): Promise<JurisdictionItem[]> {
  const res = await fetch('/api/survey/jurisdictions');
  if (!res.ok) throw new Error(API_ERRORS.jurisdictions);
  const data = (await res.json()) as { jurisdictions?: JurisdictionItem[] };
  return data.jurisdictions ?? [];
}

export async function fetchSurveyStats(): Promise<SurveyPublicStats> {
  const res = await fetch('/api/survey/stats');
  if (!res.ok) throw new Error(API_ERRORS.stats);
  return res.json() as Promise<SurveyPublicStats>;
}

function installerKeyHeaders(installer: InstallerProfile): HeadersInit | undefined {
  const key = installer.installerApiKey?.trim();
  return key ? { 'X-Installer-Key': key } : undefined;
}

export function buildGenerateFormData(
  photos: File[],
  form: SurveyFormData,
  installer: InstallerProfile,
): FormData {
  const fd = new FormData();
  for (const photo of photos) {
    fd.append('photos', photo);
  }
  fd.append('premium', String(form.premium));
  fd.append('client_name', form.clientName);
  fd.append('client_address', form.clientAddress);
  fd.append('client_city', form.clientCity);
  fd.append('client_postal', form.clientPostal);
  fd.append('client_phone', form.clientPhone);
  fd.append('client_email', form.clientEmail);
  if (form.jurisdictionCode) {
    fd.append('jurisdiction_code', form.jurisdictionCode);
  }
  if (form.siteLatitude != null) {
    fd.append('site_latitude', String(form.siteLatitude));
  }
  if (form.siteLongitude != null) {
    fd.append('site_longitude', String(form.siteLongitude));
  }
  fd.append('technician_name', installer.installerName);
  fd.append('installer_id', installer.installerId);
  fd.append('installer_name', installer.installerName);
  fd.append('roof_type', form.roofType);
  fd.append('roof_orientation', form.roofOrientation);
  fd.append('roof_pitch', String(form.roofPitch));
  fd.append('usable_area_m2', String(form.usableAreaM2));
  fd.append('annual_consumption_kwh', String(form.annualConsumptionKwh));
  fd.append('grid_connection', form.gridConnection);
  fd.append('shading_level', form.shadingLevel);
  fd.append('existing_solar', String(form.existingSolar));
  fd.append('structural_notes', form.structuralNotes);
  fd.append('chk_struct', form.checklist.struct);
  fd.append('chk_electric', form.checklist.electric);
  fd.append('chk_shading', form.checklist.shading);
  fd.append('chk_access', form.checklist.access);
  fd.append('chk_docs', form.checklist.docs);
  fd.append('chk_compliance', form.checklist.compliance);
  return fd;
}

export async function generateSurveyReport(
  photos: File[],
  form: SurveyFormData,
  installer: InstallerProfile,
): Promise<GenerateReportResult> {
  const res = await fetch('/api/survey/generate', {
    method: 'POST',
    headers: installerKeyHeaders(installer),
    body: buildGenerateFormData(photos, form, installer),
  });
  const data = (await res.json()) as GenerateReportResult & { error?: string; detail?: string };
  if (!res.ok) {
    throw new Error(apiErrorMessage(data, API_ERRORS.generate));
  }
  return data;
}

export async function generateDemoReport(): Promise<GenerateReportResult> {
  const res = await fetch('/api/survey/demo', { method: 'POST' });
  const data = (await res.json()) as GenerateReportResult & { error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.demo));
  return data;
}

export function buildBatchFormData(manifest: BatchJobInput[], photos: File[]): FormData {
  const fd = new FormData();
  fd.append('manifest', JSON.stringify(manifest));
  for (const photo of photos) {
    fd.append('photos', photo, photo.name);
  }
  return fd;
}

export async function runSurveyBatch(
  manifest: BatchJobInput[],
  photos: File[],
  installer: InstallerProfile = { installerId: '', installerName: '', company: '' },
): Promise<BatchRunResult> {
  const res = await fetch('/api/survey/batch', {
    method: 'POST',
    headers: installerKeyHeaders(installer),
    body: buildBatchFormData(manifest, photos),
  });
  const data = (await res.json()) as BatchRunResult & { error?: string; detail?: string };
  if (!res.ok) {
    throw new Error(apiErrorMessage(data, API_ERRORS.batch));
  }
  return data;
}

export type SurveyCorrection = {
  report_id: string;
  field: string;
  original: string;
  corrected: string;
  technician: string;
  timestamp: string;
};

export async function fetchTwinFeed(reportId: string): Promise<TwinFeed> {
  const res = await fetch(`/api/survey/twin-feed?report_id=${encodeURIComponent(reportId)}`);
  const data = (await res.json()) as { feed?: TwinFeed; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.twinFeed));
  if (!data.feed) throw new Error(API_ERRORS.twinFeedMissing);
  return data.feed;
}

export async function fetchCorrections(reportId?: string): Promise<SurveyCorrection[]> {
  const qs = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  const res = await fetch(`/api/survey/corrections${qs}`);
  const data = (await res.json()) as { corrections?: SurveyCorrection[]; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.corrections));
  return data.corrections ?? [];
}

export async function fetchOrchestration(reportId: string): Promise<SurveyOrchestration> {
  const res = await fetch(`/api/survey/orchestrate?report_id=${encodeURIComponent(reportId)}`);
  const data = (await res.json()) as { orchestration?: SurveyOrchestration; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.orchestration));
  if (!data.orchestration) throw new Error(API_ERRORS.orchestrationMissing);
  return data.orchestration;
}

export async function fetchReportContext(reportId: string): Promise<ReportContext> {
  const res = await fetch(`/api/survey/context?report_id=${encodeURIComponent(reportId)}`);
  const data = (await res.json()) as { context?: ReportContext; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.context));
  if (!data.context) throw new Error(API_ERRORS.contextMissing);
  return data.context;
}

export async function submitSurveyCorrection(
  payload: CorrectionPayload,
  installer: InstallerProfile = { installerId: '', installerName: '', company: '' },
): Promise<{ ok: boolean }> {
  const res = await fetch('/api/survey/corrections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...installerKeyHeaders(installer),
    },
    body: JSON.stringify({
      ...payload,
      technician: payload.technician || installer.installerName,
    }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.correctionSubmit));
  return { ok: Boolean(data.ok) };
}

export { permitPackUrl };

export async function submitSurveyToCrm(payload: {
  report_id: string;
  pdf_filename: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_city?: string;
  installer_id?: string;
  installer_name?: string;
  score: number;
  capacity_kwp: number;
  notes?: string;
}): Promise<{ success: boolean; pdfUrl?: string }> {
  const res = await fetch('/api/survey/crm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { success?: boolean; pdfUrl?: string; error?: string };
  if (!res.ok) throw new Error(apiErrorMessage(data, API_ERRORS.crm));
  return { success: Boolean(data.success), pdfUrl: data.pdfUrl };
}