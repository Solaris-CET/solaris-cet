export type ContactPrefill = {
  name?: string;
  phone?: string;
  email?: string;
  locality?: string;
  serviceType?: string;
  power?: string;
  roofType?: string;
  message?: string;
  source?: 'survey' | 'calculator';
  reportId?: string;
  surveyScore?: number;
  surveyKwp?: number;
};

export function kwpToPowerOption(kwp: number): string {
  if (kwp < 5) return 'sub-5kw';
  if (kwp <= 10) return '5-10kw';
  if (kwp <= 50) return '10-50kw';
  return 'peste-50kw';
}

export function surveyRoofToContactRoof(roof: string): string {
  const map: Record<string, string> = {
    tile: 'tigla',
    metal: 'tabla-plata',
    flat: 'membrana',
    slate: 'tigla',
    other: 'altul',
  };
  return map[roof] ?? 'altul';
}

export function buildSurveyContactUrl(input: {
  reportId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCity: string;
  capacityKwp: number;
  score: number;
  roofType?: string;
  pdfFilename?: string;
}): string {
  const params = new URLSearchParams({
    from: 'survey',
    report_id: input.reportId,
    name: input.clientName,
    city: input.clientCity,
    kwp: String(input.capacityKwp),
    score: String(input.score),
  });
  if (input.clientPhone) params.set('phone', input.clientPhone);
  if (input.clientEmail) params.set('email', input.clientEmail);
  if (input.roofType) params.set('roof', input.roofType);
  if (input.pdfFilename) params.set('pdf', input.pdfFilename);
  return `/contact?${params.toString()}`;
}

export function buildSurveyQuoteMessage(input: {
  reportId: string;
  score: number;
  capacityKwp: number;
  pdfFilename?: string;
}): string {
  const pdf = input.pdfFilename ? ` PDF: ${input.pdfFilename}.` : '';
  return `Cerere ofertă din raport survey ${input.reportId} — scor ${input.score}/100, ${input.capacityKwp} kWp.${pdf}`;
}

const SURVEY_REPORT_RE = /raport survey ([A-Z0-9][A-Z0-9_-]*)/i;

export function extractSurveyReportId(message: string | null | undefined): string | null {
  if (!message) return null;
  return message.match(SURVEY_REPORT_RE)?.[1] ?? null;
}

export function parseContactSearchParams(search: string): ContactPrefill {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const from = params.get('from');

  if (from === 'survey') {
    const kwp = Number(params.get('kwp'));
    const score = Number(params.get('score'));
    const roof = params.get('roof') ?? '';
    return {
      source: 'survey',
      reportId: params.get('report_id') ?? undefined,
      name: params.get('name') ?? undefined,
      phone: params.get('phone') ?? undefined,
      email: params.get('email') ?? undefined,
      locality: params.get('city') ?? undefined,
      serviceType: 'fotovoltaic-rezidential',
      power: Number.isFinite(kwp) ? kwpToPowerOption(kwp) : undefined,
      roofType: roof ? surveyRoofToContactRoof(roof) : undefined,
      surveyScore: Number.isFinite(score) ? score : undefined,
      surveyKwp: Number.isFinite(kwp) ? kwp : undefined,
      message: params.get('report_id')
        ? buildSurveyQuoteMessage({
            reportId: params.get('report_id')!,
            score: Number.isFinite(score) ? score : 0,
            capacityKwp: Number.isFinite(kwp) ? kwp : 0,
            pdfFilename: params.get('pdf') ?? undefined,
          })
        : undefined,
    };
  }

  if (params.get('service') === 'fotovoltaice' || params.has('consum')) {
    const putere = Number(params.get('putere'));
    return {
      source: 'calculator',
      locality: params.get('judet') ?? undefined,
      serviceType: 'fotovoltaic-rezidential',
      power: Number.isFinite(putere) ? kwpToPowerOption(putere) : undefined,
      message: [
        params.get('consum') ? `Consum estimat: ${params.get('consum')} kWh/lună` : '',
        params.get('pret') ? `Buget calculator: ${params.get('pret')} EUR` : '',
        params.get('baterie') ? `Baterie: ${params.get('baterie')}` : '',
      ]
        .filter(Boolean)
        .join('. ') || undefined,
    };
  }

  return {};
}