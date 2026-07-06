import type { SurveyFormData } from '@/lib/surveyApi';

export type SurveyPrefill = {
  clientCity?: string;
  annualConsumptionKwh?: number;
  usableAreaM2?: number;
  roofType?: string;
  source?: 'calculator' | 'contact';
};

/** Map calculator roof labels to survey engine roof_type values. */
export function calculatorRoofToSurvey(roof: string): string {
  const map: Record<string, string> = {
    tigla: 'tile',
    tabla: 'metal',
    'tabla-plata': 'metal',
    membrana: 'flat',
    altul: 'other',
  };
  return map[roof.toLowerCase()] ?? 'tile';
}

/**
 * Parse URL params from /survey?from=calculator&...
 * Supports: judet, consum (kWh/month), putere (kWp), roof, suprafata
 */
export function parseSurveySearchParams(search: string): SurveyPrefill {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.get('from') !== 'calculator') return {};

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
    prefill.usableAreaM2 = Math.round(putere * 7);
  } else if (Number.isFinite(suprafata) && suprafata > 0) {
    prefill.usableAreaM2 = suprafata;
  }

  if (roof) prefill.roofType = calculatorRoofToSurvey(roof);

  return prefill;
}

export function applySurveyPrefill(form: SurveyFormData, prefill: SurveyPrefill): SurveyFormData {
  if (!prefill.source) return form;
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
  return `/survey?${params.toString()}`;
}