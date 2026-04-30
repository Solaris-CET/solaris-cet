import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

type ShopItem = {
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  costPoints: number;
};

type InventoryItem = ShopItem & { equipped: boolean; acquiredAt: string };

export default function AccountShopTab({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [xp, setXp] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setInfo(null);
    const [itemsRes, invRes, meRes] = await Promise.all([
      fetch('/api/gamification/shop/items'),
      fetch('/api/gamification/shop/inventory', { headers: authHeaders }),
      fetch('/api/gamification/me', { headers: authHeaders }),
    ]);
    const itemsJson = (await itemsRes.json()) as { ok?: boolean; items?: ShopItem[] };
    const invJson = (await invRes.json()) as { ok?: boolean; inventory?: InventoryItem[] };
    const meJson = (await meRes.json()) as { ok?: boolean; xp?: number };
    if (itemsRes.ok && itemsJson.ok && Array.isArray(itemsJson.items)) setItems(itemsJson.items);
    if (invRes.ok && invJson.ok && Array.isArray(invJson.inventory)) setInventory(invJson.inventory);
    if (meRes.ok && meJson.ok && typeof meJson.xp === 'number') setXp(meJson.xp);
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const owned = useMemo(() => new Set(inventory.map((x) => x.slug)), [inventory]);
  const equipped = useMemo(() => new Set(inventory.filter((x) => x.equipped).map((x) => x.slug)), [inventory]);

  const buy = async (slug: string) => {
    setBusy(slug);
    setInfo(null);
    try {
      const res = await fetch('/api/gamification/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ itemSlug: slug }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; purchased?: boolean; alreadyOwned?: boolean };
      if (res.ok && json.ok) {
        setInfo(json.alreadyOwned ? 'Deja deții acest item.' : 'Cumpărat.');
        await load();
      } else {
        setInfo(json.error ? String(json.error) : 'Nu se poate cumpăra.');
      }
    } catch {
      setInfo('Eroare la cumpărare.');
    } finally {
      setBusy(null);
    }
  };

  const equip = async (slug: string) => {
    setBusy(slug);
    setInfo(null);
    try {
      const res = await fetch('/api/gamification/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ itemSlug: slug }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setInfo('Echipat.');
        await load();
      } else {
        setInfo(json.error ? String(json.error) : 'Nu se poate echipa.');
      }
    } catch {
      setInfo('Eroare la echipare.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-white text-xl font-semibold tracking-tight">Shop (XP)</div>
          <div className="mt-1 text-white/60 text-sm">Cumpără cosmetice cu XP, fără bani.</div>
        </div>
        <div className="text-white/70 text-sm">
          XP disponibil: <span className="text-white font-semibold">{xp ?? '—'}</span>
        </div>
      </div>

      {info ? <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{info}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => {
          const isOwned = owned.has(it.slug);
          const isEquipped = equipped.has(it.slug);
          return (
            <div key={it.slug} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{it.title}</div>
                  <div className="mt-1 text-white/60 text-sm">{it.description ?? ''}</div>
                  <div className="mt-2 text-white/50 text-xs font-mono">
                    {it.kind} · cost {it.costPoints} XP
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Button type="button" onClick={() => void buy(it.slug)} disabled={busy === it.slug || isOwned}>
                    {isOwned ? 'Deținut' : 'Cumpără'}
                  </Button>
                  {isOwned ? (
                    <Button type="button" variant="secondary" onClick={() => void equip(it.slug)} disabled={busy === it.slug || isEquipped}>
                      {isEquipped ? 'Echipat' : 'Echipează'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white font-semibold">Inventar</div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {inventory.map((it) => (
            <div key={it.slug} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white/90 text-sm">{it.title}</div>
                <div className="text-white/50 text-xs font-mono">{it.equipped ? 'equipped' : ''}</div>
              </div>
              <div className="text-white/50 text-xs">{it.kind}</div>
            </div>
          ))}
          {inventory.length === 0 ? <div className="text-white/60 text-sm">Nu ai iteme cumpărate încă.</div> : null}
        </div>
      </div>
    </div>
  );
}

