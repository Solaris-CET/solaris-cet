import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { adminApi } from '../adminClient';

type Row = { id: string; key: string; value: string };

function I18nRow({ item, onSave }: { item: Row; onSave: (k: string, v: string) => void }) {
  const [v, setV] = useState(item.value);
  useEffect(() => setV(item.value), [item.value]);
  return (
    <tr className="border-t border-white/10">
      <td className="py-2 font-mono text-xs break-all">{item.key}</td>
      <td className="py-2"><Input value={v} onChange={(e) => setV(e.target.value)} /></td>
      <td className="py-2 text-right">
        <Button size="sm" variant="outline" onClick={() => onSave(item.key, v)}>Save</Button>
      </td>
    </tr>
  );
}

export function I18nSection({ token }: { token: string }) {
  const [locale, setLocale] = useState('ro');
  const [namespace, setNamespace] = useState('common');
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminApi<{ translations: Row[] }>(
      `/api/admin/i18n?locale=${encodeURIComponent(locale)}&namespace=${encodeURIComponent(namespace)}&q=${encodeURIComponent(q)}`,
      { token },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setItems(res.data.translations);
    setError(null);
  }, [token, locale, namespace, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (k: string, v: string) => {
    const res = await adminApi<{ ok: true }>('/api/admin/i18n', { token, method: 'PUT', body: { locale, namespace, key: k, value: v } });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    void load();
  };

  const exportJson = async () => {
    const res = await adminApi<{ translations: Record<string, string> }>(
      `/api/admin/i18n/export?locale=${encodeURIComponent(locale)}&namespace=${encodeURIComponent(namespace)}`,
      { token },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const blob = new Blob([JSON.stringify(res.data.translations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${locale}.${namespace}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Traduceri (cheie-valoare)</div>
        <div className="flex items-center gap-2">
          <Input className="w-[90px]" value={locale} onChange={(e) => setLocale(e.target.value)} />
          <Input className="w-[140px]" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
          <Button variant="outline" onClick={exportJson}>Export JSON</Button>
        </div>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută key…" />
          <Button variant="outline" onClick={load}>Caută</Button>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm text-white/80">
            <thead className="text-xs text-white/60">
              <tr>
                <th className="text-left py-2 w-[40%]">Key</th>
                <th className="text-left py-2">Value</th>
                <th className="text-right py-2">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <I18nRow key={t.id} item={t} onSave={save} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
