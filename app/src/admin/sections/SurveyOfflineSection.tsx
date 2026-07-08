import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  SURVEY_OFFLINE_SCHEMA,
  type SurveyOfflineManifest,
} from '@/lib/surveyOfflineManifest';

import { useAdminSession } from '../useAdminSession';

type ManifestApiBody = {
  manifest?: SurveyOfflineManifest;
  error?: string;
};

function isSurveyOfflineManifest(value: unknown): value is SurveyOfflineManifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.schema === 'string' &&
    Array.isArray(m.prefetch_urls) &&
    m.prefetch_urls.every((url) => typeof url === 'string') &&
    typeof m.queue_supported === 'boolean' &&
    typeof m.indexeddb_schema === 'string'
  );
}

function parseManifestBody(raw: unknown): ManifestApiBody {
  if (!raw || typeof raw !== 'object') return {};
  const body = raw as Record<string, unknown>;
  const manifest = isSurveyOfflineManifest(body.manifest) ? body.manifest : undefined;
  const error = typeof body.error === 'string' ? body.error : undefined;
  return { manifest, error };
}

export function SurveyOfflineSection() {
  const { token } = useAdminSession();
  const [manifest, setManifest] = useState<SurveyOfflineManifest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/survey/offline-manifest', { signal });
      const data = parseManifestBody(await res.json());
      if (!res.ok) throw new Error(data.error ?? 'Manifest indisponibil');
      if (signal?.aborted) return;
      setManifest(data.manifest ?? null);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Eroare');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const prefetchUrls = useMemo(() => manifest?.prefetch_urls ?? [], [manifest]);

  return (
    <section className="space-y-4" aria-labelledby="survey-offline-heading" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="survey-offline-heading" className="text-lg font-semibold text-white">
            Survey offline PWA
          </h2>
          <p className="text-sm text-white/55">
            Manifest precache + coadă IndexedDB pentru tehnician pe șantier
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Reîmprospătează manifestul offline"
        >
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {manifest ? (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm space-y-2">
          <p className="font-mono text-xs text-amber-200">{manifest.schema || SURVEY_OFFLINE_SCHEMA}</p>
          <p className="text-white/70">
            IndexedDB: <span className="font-mono text-cyan-200/90">{manifest.indexeddb_schema}</span>
            {' · '}
            Coadă: {manifest.queue_supported ? 'da' : 'nu'}
          </p>
          <ul className="text-xs text-white/50 space-y-1 max-h-48 overflow-y-auto">
            {prefetchUrls.map((url) => (
              <li key={url} className="font-mono">
                {url}
              </li>
            ))}
          </ul>
        </div>
      ) : !loading ? (
        <p className="text-sm text-white/50" role="status">
          Manifest offline indisponibil.
        </p>
      ) : null}
    </section>
  );
}