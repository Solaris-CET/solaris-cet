import type { SurveyFormData } from '@/lib/surveyApi';

export const PREFILL_SOURCES = ['calculator', 'contact'] as const;
export type SurveyPrefillSource = (typeof PREFILL_SOURCES)[number];

export const CALCULATOR_ROOF_MAP: Record<string, string> = {
  tigla: 'tile',
  tabla: 'metal',
  'tabla-plata': 'metal',
  membrana: 'flat',
  altul: 'other',
};

export const DEFAULT_SURVEY_ROOF_TYPE = 'tile';
export const KWP_TO_AREA_FACTOR = 7;
export const SURVEY_PREFILL_PATH = '/survey';

export type SurveyPrefill = {
  clientCity?: string;
  annualConsumptionKwh?: number;
  usableAreaM2?: number;
  roofType?: string;
  source?: SurveyPrefillSource;
};

export function isSurveyPrefillSource(value: string): value is SurveyPrefillSource {
  return (PREFILL_SOURCES as readonly string[]).includes(value);
}

export function hasSurveyPrefill(prefill: SurveyPrefill): boolean {
  return Boolean(
    prefill.source &&
      (prefill.clientCity ||
        prefill.annualConsumptionKwh ||
        prefill.usableAreaM2 ||
        prefill.roofType),
  );
}

/** Map calculator roof labels to survey engine roof_type values. */
export function calculatorRoofToSurvey(roof: string): string {
  return CALCULATOR_ROOF_MAP[roof.toLowerCase()] ?? DEFAULT_SURVEY_ROOF_TYPE;
}

/**
 * Parse URL params from /survey?from=calculator&...
 * Supports: judet, consum (kWh/month), putere (kWp), roof, suprafata
 */
export function parseSurveySearchParams(search: string): SurveyPrefill {
  const normalized = search.trim();
  if (!normalized) return {};

  const params = new URLSearchParams(normalized.startsWith('?') ? normalized.slice(1) : normalized);
  const from = params.get('from') ?? '';
  if (from !== 'calculator') return {};

  const consumMonth = Number(params.get('consum'));
  const putere = Number(params.get('putere'));
  const suprafata = Number(params.get('suprafata'));
  const roof = params.get('roof') ?? params.get('acoperis') ?? '';

  const prefill: SurveyPrefill = { source: 'calculator' };

  const judet = params.get('judet') ?? params.get('city');
  if (judet) prefill.clientCity = judet;

  if (Number.isFinite(consumMonth) && consumMonth > 0) {
    prefill.annualConsumptionKwh = Math.round(consumMonth * 12);
  }

  if (Number.isFinite(putere) && putere > 0) {
    prefill.usableAreaM2 = Math.round(putere * KWP_TO_AREA_FACTOR);
  } else if (Number.isFinite(suprafata) && suprafata > 0) {
    prefill.usableAreaM2 = suprafata;
  }

  if (roof) prefill.roofType = calculatorRoofToSurvey(roof);

  return prefill;
}

export function applySurveyPrefill(form: SurveyFormData, prefill: SurveyPrefill): SurveyFormData {
  if (!hasSurveyPrefill(prefill)) return form;
  return {
    ...form,
    clientCity: prefill.clientCity ?? form.clientCity,
    annualConsumptionKwh: prefill.annualConsumptionKwh ?? form.annualConsumptionKwh,
    usableAreaM2: prefill.usableAreaM2 ?? form.usableAreaM2,
    roofType: prefill.roofType ?? form.roofType,
  };
}

export function buildCalculatorSurveyUrl(input: {
  judet?: string;
  consumKwhMonth?: number;
  putereKwp?: number;
  roof?: string;
  suprafataM2?: number;
}): string {
  const params = new URLSearchParams({ from: 'calculator' });
  if (input.judet) params.set('judet', input.judet);
  if (input.consumKwhMonth) params.set('consum', String(input.consumKwhMonth));
  if (input.putereKwp) params.set('putere', String(input.putereKwp));
  if (input.roof) params.set('roof', input.roof);
  if (input.suprafataM2) params.set('suprafata', String(input.suprafataM2));
  return `${SURVEY_PREFILL_PATH}?${params.toString()}`;
}