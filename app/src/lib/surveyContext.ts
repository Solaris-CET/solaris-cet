export type ExplainableFinding = {
  claim: string;
  confidence: number;
  evidence_photo_ids: string[];
  reasoning_short?: string;
  category?: string;
  photo_id?: string;
};

export type ReportContext = {
  schema: string;
  report_id: string;
  report: {
    client_name: string;
    city: string;
    capacity_kwp: number;
    annual_kwh: number;
    suitability_score: number;
    premium_tier: boolean;
    installer_id: string;
    technician_name: string;
    timestamp: string;
    routing: string;
  };
  jurisdiction: {
    code?: string | null;
    name?: string;
    grid_operator?: string | null;
    ahj_authority?: string;
  };
  site_location?: { latitude: number | null; longitude: number | null } | null;
  crm: {
    submit_url: string;
    lead_search_key: string;
    context_url: string;
  };
  cost: {
    api_usd: number;
    routing: string;
  };
  files: {
    pdf: string;
    ahj: string | null;
    pdf_url: string;
    ahj_url: string | null;
    permit_pack_url: string;
  };
  explainable: {
    findings: ExplainableFinding[];
    low_confidence_count: number;
  };
};

export type CorrectionPayload = {
  report_id: string;
  field: string;
  original?: string;
  corrected: string;
  technician?: string;
  notes?: string;
};

export function permitPackUrl(reportId: string): string {
  return `/api/survey/permit-pack?report_id=${encodeURIComponent(reportId)}`;
}