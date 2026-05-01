export type VirtualParcelStatus = 'tokenized' | 'available' | 'reserved';

export type VirtualParcel = {
  id: string;
  zone: string;
  row: number;
  col: number;
  status: VirtualParcelStatus;
};

export type VirtualLandGrid = {
  rows: number;
  cols: number;
  parcels: VirtualParcel[];
  counts: Record<VirtualParcelStatus, number>;
};

function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function xorshift32(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}

function toParcelId(zone: string, index: number): string {
  const n = String(index).padStart(3, '0');
  return `${zone}-${n}`;
}

export function buildVirtualLandGrid(input?: {
  seed?: string;
  zone?: string;
  rows?: number;
  cols?: number;
  statusOverride?: VirtualParcelStatus[];
}): VirtualLandGrid {
  const zone = (input?.zone ?? 'A').trim().slice(0, 2).toUpperCase() || 'A';
  const rows = Math.max(6, Math.min(32, Math.floor(input?.rows ?? 12)));
  const cols = Math.max(10, Math.min(48, Math.floor(input?.cols ?? 26)));
  const seed = String(input?.seed ?? `CET|VLAND|CETATUIA|${zone}|${rows}x${cols}`);
  const next = xorshift32(fnv1a32(seed));
  const statusOverride = Array.isArray(input?.statusOverride) ? input?.statusOverride : null;

  const parcels: VirtualParcel[] = [];
  const counts: Record<VirtualParcelStatus, number> = { tokenized: 0, available: 0, reserved: 0 };

  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      idx += 1;
      const overridden = statusOverride?.[idx - 1];
      const r = next() / 0xffffffff;
      const status: VirtualParcelStatus =
        overridden === 'tokenized' || overridden === 'available' || overridden === 'reserved'
          ? overridden
          : r < 0.36
            ? 'tokenized'
            : r < 0.82
              ? 'available'
              : 'reserved';
      counts[status] += 1;
      parcels.push({ id: toParcelId(zone, idx), zone, row, col, status });
    }
  }

  return { rows, cols, parcels, counts };
}
