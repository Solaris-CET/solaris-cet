import JSZip from 'jszip';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import type { BrandAsset } from './brandAssetsCatalog';
import { blobUrlDownload } from './brandDownloads';

export function BrandKitCard({
  assets,
  title,
  cta,
  generating,
  failed,
}: {
  assets: BrandAsset[];
  title: string;
  cta: string;
  generating: string;
  failed: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notes = useMemo(
    () => [
      'Folosește fișierele originale; evită re-encoding.',
      'Nu distorsiona logo-ul (fără stretch/skew).',
      'Păstrează spațiu liber în jurul mark-urilor.',
    ],
    [],
  );

  const buildKit = async () => {
    setError(null);
    setBusy(true);
    try {
      const zip = new JSZip();
      const commit = String(import.meta.env.VITE_GIT_COMMIT_HASH ?? 'unknown').slice(0, 7);
      zip.file(
        'README.txt',
        [
          'Solaris CET — Brand Kit',
          `Build: ${commit}`,
          '',
          'Included assets:',
          ...assets.map((a) => `- ${a.name} (${a.format})`),
          '',
          'Usage notes:',
          ...notes.map((n) => `- ${n}`),
          '',
          `Generated at: ${new Date().toISOString()}`,
        ].join('\n'),
      );

      await Promise.all(
        assets.map(async (a) => {
          const res = await fetch(a.href);
          if (!res.ok) throw new Error('fetch failed');
          const blob = await res.blob();
          const ext = a.format.toLowerCase();
          const safeBase = a.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 64);
          zip.file(`${safeBase}.${ext}`, blob);
        }),
      );

      const out = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      blobUrlDownload(`solaris-cet-brand-kit-${commit}.zip`, out);
    } catch {
      setError(failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
      <div className="hud-label text-solaris-gold">{title}</div>
      <div className="mt-3 text-sm text-solaris-muted leading-relaxed">
        Include automat asset-urile vizibile în listă + un README. Kit-ul este generat în browser.
      </div>
      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-[12px] text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        <Button type="button" className="w-full" onClick={buildKit} disabled={busy}>
          <Download className="w-4 h-4" aria-hidden />
          {busy ? generating : cta}
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs font-semibold text-solaris-text">Notes</div>
        <ul className="mt-2 space-y-1 text-[11px] text-solaris-muted">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

