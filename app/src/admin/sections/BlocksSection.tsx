import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { adminApi } from '../adminClient';

const KEYS = ['home.hero', 'home.about', 'layout.header', 'layout.footer'];

type Block = { key: string; format: 'plain' | 'markdown'; content: string };

export function BlocksSection({ token }: { token: string }) {
  const [locale, setLocale] = useState('ro');
  const [values, setValues] = useState<Record<string, Block>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await adminApi<{ blocks: { key: string; format: string; content: string }[] }>(
        `/api/admin/cms/blocks?locale=${encodeURIComponent(locale)}&keys=${encodeURIComponent(KEYS.join(','))}`,
        { token },
      );
      if (!res.ok) {
        if (!cancelled) setError(res.error);
        return;
      }
      const next: Record<string, Block> = {};
      for (const k of KEYS) {
        const found = res.data.blocks.find((b) => b.key === k);
        next[k] = {
          key: k,
          format: found?.format === 'markdown' ? 'markdown' : 'plain',
          content: found?.content ?? '',
        };
      }
      if (!cancelled) {
        setValues(next);
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, locale]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = KEYS.map((k) => ({ key: k, locale, format: values[k]?.format ?? 'plain', content: values[k]?.content ?? '' }));
      const res = await adminApi<{ ok: true }>('/api/admin/cms/blocks', { token, method: 'PUT', body: { updates } });
      if (!res.ok) setError(res.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Texte pagini (blocuri)</div>
        <div className="flex items-center gap-2">
          <Input className="w-[120px]" value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="ro" />
          <Button onClick={save} disabled={saving}>
            {saving ? 'Salvez…' : 'Salvează'}
          </Button>
        </div>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {KEYS.map((k) => (
          <Card key={k} className="border border-white/10 bg-black/30 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-white/90 text-sm font-medium">{k}</div>
              <select
                className="bg-black/40 border border-white/10 text-white/80 text-xs rounded px-2 py-1"
                value={values[k]?.format ?? 'plain'}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [k]: {
                      ...(prev[k] ?? { key: k, content: '' }),
                      format: e.target.value === 'markdown' ? 'markdown' : 'plain',
                    },
                  }))
                }
              >
                <option value="plain">plain</option>
                <option value="markdown">markdown</option>
              </select>
            </div>
            <Textarea
              value={values[k]?.content ?? ''}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [k]: { ...(prev[k] ?? { key: k, format: 'plain', content: '' }), content: e.target.value },
                }))
              }
              className="min-h-[140px]"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

