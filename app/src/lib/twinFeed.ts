export type TwinFeed = {
  schema: string;
  feed_version: number;
  generated_at: string;
  report_id: string;
  site: {
    client_name: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  };
  system: {
    capacity_kwp: number;
    annual_kwh: number;
    suitability_score: number;
    premium_tier: boolean;
  };
  jurisdiction?: Record<string, unknown>;
  explainable?: { findings: unknown[]; low_confidence_count: number };
  low_confidence_count: number;
  corrections_count: number;
  corrections_recent: unknown[];
  files?: Record<string, unknown>;
  cost?: Record<string, unknown>;
  crm?: Record<string, unknown>;
};