import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SURVEY_OFFLINE_SCHEMA } from '@/lib/surveyOfflineManifest';

import { useAdminSession } from '../useAdminSession';

type ManifestResponse = {
  manifest?: {
    schema: string;
    prefetch_urls: string[];
    queue_supported: boolean;
    indexeddb_schema: string;
  };
  error?: string;
};

export function SurveyOfflineSection() {
  const { token } = useAdminSession();
  const [manifest, setManifest] = useState<ManifestResponse['manifest'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/survey/offline-manifest');
      const data = (await res.json()) as ManifestResponse;
      if (!res.ok) throw new Error(data.error || 'Manifest indisponibil');
      setManifest(data.manifest ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Survey offline PWA</h2>
          <p className="text-sm text-white/55">
            Manifest precache + coadă IndexedDB pentru tehnician pe șantier
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {manifest ? (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm space-y-2">
          <p className="font-mono text-xs text-amber-200">{manifest.schema || SURVEY_OFFLINE_SCHEMA}</p>
          <p className="text-white/70">
            IndexedDB: <span className="font-mono text-cyan-200/90">{manifest.indexeddb_schema}</span>
            {' · '}
            Coadă: {manifest.queue_supported ? 'da' : 'nu'}
          </p>
          <ul className="text-xs text-white/50 space-y-1 max-h-48 overflow-y-auto">
            {manifest.prefetch_urls.map((url) => (
              <li key={url} className="font-mono">
                {url}
              </li>
            ))}
          </ul>
        </div>
      ) : !loading ? (
        <p className="text-sm text-white/50">Manifest offline indisponibil.</p>
      ) : null}
    </div>
  );
}