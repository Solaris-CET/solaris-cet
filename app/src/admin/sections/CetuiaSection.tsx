import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { adminApi } from '../adminClient';

type TokenStatus = 'available' | 'reserved' | 'sold';

type TokenRow = {
  id: number;
  status: TokenStatus;
  ownerWalletAddress: string | null;
  updatedAt?: string | Date;
};

export function CetuiaSection({ token }: { token: string }) {
  const [counts, setCounts] = useState<{ total: number; available: number; reserved: number; sold: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [tokenId, setTokenId] = useState('');
  const [row, setRow] = useState<TokenRow | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsedId = useMemo(() => {
    const n = Number.parseInt(tokenId.trim(), 10);
    return Number.isFinite(n) && n >= 1 && n <= 9000 ? n : null;
  }, [tokenId]);

  const refreshCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true; counts: { total: number; available: number; reserved: number; sold: number } }>(
        '/api/admin/cetuia/tokens',
        { token },
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCounts(res.data.counts);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  const seed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true; before: number; after: number; total: number }>('/api/admin/cetuia/seed', {
        token,
        method: 'POST',
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await refreshCounts();
    } finally {
      setSeeding(false);
    }
  };

  const loadToken = async () => {
    if (!parsedId) {
      setError('ID invalid (1–9000)');
      return;
    }
    setLoadingToken(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true; token: TokenRow | null }>(`/api/admin/cetuia/tokens?id=${parsedId}`, { token });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRow(res.data.token);
    } finally {
      setLoadingToken(false);
    }
  };

  const saveToken = async () => {
    if (!parsedId) {
      setError('ID invalid (1–9000)');
      return;
    }
    if (!row) {
      setError('Încarcă un token înainte de salvare');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true; token: TokenRow | null }>('/api/admin/cetuia/tokens', {
        token,
        method: 'PUT',
        body: { id: parsedId, status: row.status, ownerWalletAddress: row.ownerWalletAddress },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRow(res.data.token);
      await refreshCounts();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Cetățuia · 9,000 tokens</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshCounts} disabled={loading || seeding}>
            {loading ? 'Refresh…' : 'Refresh'}
          </Button>
          <Button onClick={seed} disabled={seeding || loading}>
            {seeding ? 'Seeding…' : 'Seed 9,000'}
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <Card className="border border-white/10 bg-black/30 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-white/70 mb-1">Available</div>
          <div className="text-white font-mono">{counts ? counts.available.toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Reserved</div>
          <div className="text-amber-200 font-mono">{counts ? counts.reserved.toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Sold</div>
          <div className="text-rose-200 font-mono">{counts ? counts.sold.toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">Rows in DB</div>
          <div className="text-white/80 font-mono">{counts ? counts.total.toLocaleString() : '—'}</div>
        </div>
      </Card>

      <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_140px] gap-3 items-end">
          <div>
            <div className="text-xs text-white/70 mb-1">Token ID (1–9000)</div>
            <Input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="ex: 42" inputMode="numeric" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadToken} disabled={loadingToken}>
              {loadingToken ? 'Loading…' : 'Load'}
            </Button>
            <Button onClick={saveToken} disabled={saving || !row}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <div className="text-xs text-white/55 md:text-right">
            {row ? `Updated: ${row.updatedAt ? String(row.updatedAt).slice(0, 19) : '—'}` : '—'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/70 mb-2">Status</div>
            <div className="flex items-center gap-2">
              {(['available', 'reserved', 'sold'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn(
                    'px-3 py-2 rounded-xl border text-xs font-mono transition-colors',
                    'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                    row?.status === s &&
                      (s === 'sold'
                        ? 'border-rose-300/40 bg-rose-400/10 text-rose-200'
                        : s === 'reserved'
                          ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                          : 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200'),
                  )}
                  onClick={() => setRow((r) => (r ? { ...r, status: s } : r))}
                  disabled={!row}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-white/70 mb-1">Owner wallet (optional)</div>
            <Input
              value={row?.ownerWalletAddress ?? ''}
              onChange={(e) => setRow((r) => (r ? { ...r, ownerWalletAddress: e.target.value.trim() || null } : r))}
              placeholder="wallet address"
              disabled={!row}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
