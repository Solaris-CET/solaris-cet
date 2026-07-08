import type { ChecklistStatus } from '@/lib/surveyApi';

export const SURVEY_TABS = ['report', 'dashboard', 'batch'] as const;
export type SurveyTab = (typeof SURVEY_TABS)[number];

export const MAX_SURVEY_PHOTOS = 20;
export const MIN_CLIENT_NAME_LEN = 2;
export const MIN_CLIENT_CITY_LEN = 2;

export const SURVEY_PAGE_TITLE = 'Raport șantier în sub 20 min';
export const SURVEY_PAGE_DESCRIPTION =
  'Încarcă poze, completează checklist-ul și generează raport PDF permit-ready cu analiză AI.';

export const SURVEY_PAGE_MESSAGES = {
  generateIncomplete: 'Completează client, oraș și încarcă cel puțin o poză.',
  offlineQueued: 'Offline — raport salvat în coadă. Se sincronizează la reconectare.',
  offlineSaveFailed: 'Nu am putut salva raportul offline.',
  gpsUnavailable: 'Geolocația nu este disponibilă pe acest dispozitiv.',
  gpsFailed: 'Nu am putut obține coordonatele GPS. Verifică permisiunile.',
  calcPrefillNote: 'Date precompletate din calculator solar.',
  engineConnected: '● Survey engine conectat',
  engineDemo: '● Mod demo — pornește survey-engine pe :8000',
  costBudgetAlert: 'Atenție: bugetul API survey este aproape epuizat. Verifică dashboard-ul costuri.',
} as const;

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  pass: 'OK',
  warning: 'Atenție',
  fail: 'Eșuat',
  na: 'N/A',
};

export const SURVEY_TAB_LABELS: Record<SurveyTab, string> = {
  report: 'Raport nou',
  dashboard: 'Dashboard',
  batch: 'Batch',
};

export function checklistStatusLabel(status: ChecklistStatus): string {
  return CHECKLIST_STATUS_LABELS[status];
}

export function surveyTabLabel(tab: SurveyTab): string {
  return SURVEY_TAB_LABELS[tab];
}

export function canGenerateSurvey(clientName: string, clientCity: string, photoCount: number): boolean {
  return (
    photoCount > 0 &&
    clientName.trim().length >= MIN_CLIENT_NAME_LEN &&
    clientCity.trim().length >= MIN_CLIENT_CITY_LEN
  );
}

export function scoreRingColor(score: number): string {
  const pct = Math.min(100, Math.max(0, score));
  if (pct >= 75) return '#22c55e';
  if (pct >= 50) return '#fbbf24';
  return '#f87171';
}

export function toSurveyPageError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function isSurveyTab(value: string): value is SurveyTab {
  return (SURVEY_TABS as readonly string[]).includes(value);
}