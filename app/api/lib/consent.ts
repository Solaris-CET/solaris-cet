export const CONSENT_PATH = '/api/consent';
export const CONSENT_METHODS = 'POST, OPTIONS';

export const CONSENT_PROBE = {
  path: CONSENT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'consent' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  maxConsentKeyLength: 120,
  maxPolicyVersionLength: 40,
  maxPolicyHashLength: 128,
  maxSourceLength: 60,
  maxUserAgentLength: 220,
  defaultSource: 'unknown' as const,
  essentialConsent: true,
  invalidJsonError: 'Invalid JSON' as const,
  invalidPayloadError: 'Invalid payload' as const,
};

export type ConsentIncoming = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentPostBody = {
  consentKey: string;
  consent: ConsentIncoming;
  policyVersion: string;
  policyHash: string | null;
  source: string;
  meta: Record<string, unknown> | null;
};

export function parseConsentPostBody(body: unknown): ConsentPostBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const consentKey = typeof rec.consentKey === 'string' ? rec.consentKey.trim() : '';
  if (!consentKey || consentKey.length > CONSENT_PROBE.maxConsentKeyLength) return null;

  const consentRaw = rec.consent;
  if (!consentRaw || typeof consentRaw !== 'object') return null;
  const c = consentRaw as Record<string, unknown>;
  const analytics = Boolean(c.analytics);
  const marketing = Boolean(c.marketing);

  const policyVersion = typeof rec.policyVersion === 'string' ? rec.policyVersion.trim() : '';
  if (!policyVersion || policyVersion.length > CONSENT_PROBE.maxPolicyVersionLength) return null;
  const policyHash =
    typeof rec.policyHash === 'string' && rec.policyHash.trim()
      ? rec.policyHash.trim().slice(0, CONSENT_PROBE.maxPolicyHashLength)
      : null;

  const sourceRaw = typeof rec.source === 'string' ? rec.source.trim() : '';
  const source = sourceRaw ? sourceRaw.slice(0, CONSENT_PROBE.maxSourceLength) : CONSENT_PROBE.defaultSource;

  const metaRaw = rec.meta;
  const meta = metaRaw && typeof metaRaw === 'object' ? (metaRaw as Record<string, unknown>) : null;

  return { consentKey, consent: { analytics, marketing }, policyVersion, policyHash, source, meta };
}