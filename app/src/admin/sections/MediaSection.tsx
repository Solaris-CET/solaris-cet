import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MediaSection({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<{ url: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setUploaded(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: unknown } | null;
        setError(j && typeof j.error === 'string' ? j.error : 'Upload failed');
        return;
      }
      const payload = (await res.json()) as { url: string; asset: { id: string } };
      setUploaded({ url: payload.url, id: payload.asset.id });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Media (upload imagini)</div>
        <Button onClick={upload} disabled={!file || loading}>
          {loading ? 'Urc…' : 'Încarcă'}
        </Button>
      </div>
      <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-white/80 text-sm"
        />
        {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-[220px] rounded border border-white/10" /> : null}
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
        {uploaded ? <div className="text-xs text-white/80 font-mono break-all">{uploaded.url}</div> : null}
      </Card>
    </div>
  );
}

