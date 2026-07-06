import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { adminApi } from '../adminClient';

export function TokenSection({ token }: { token: string }) {
  const [priceUsd, setPriceUsd] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [circulatingSupply, setCirculatingSupply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await adminApi<{ token: { priceUsd: string; totalSupply: string; circulatingSupply: string } | null }>('/api/admin/token', {
        token,
      });
      if (!res.ok) {
        if (!cancelled) setError(res.error);
        return;
      }
      const t = res.data.token;
      if (!cancelled) {
        setPriceUsd(t?.priceUsd ?? '0');
        setTotalSupply(t?.totalSupply ?? '0');
        setCirculatingSupply(t?.circulatingSupply ?? '0');
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi<{ token: unknown }>('/api/admin/token', {
        token,
        method: 'PUT',
        body: { priceUsd, totalSupply, circulatingSupply },
      });
      if (!res.ok) setError(res.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Date token (CET)</div>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Salvez…' : 'Salvează'}
        </Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-white/70 mb-1">Price (USD)</div>
          <Input value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Total supply</div>
          <Input value={totalSupply} onChange={(e) => setTotalSupply(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Circulating supply</div>
          <Input value={circulatingSupply} onChange={(e) => setCirculatingSupply(e.target.value)} />
        </div>
      </Card>
    </div>
  );
}

