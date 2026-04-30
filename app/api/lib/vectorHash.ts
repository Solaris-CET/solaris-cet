function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hashEmbedding(text: string, dims = 256): number[] {
  const v = new Array<number>(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9ăâîșțáéíóúüñçğışö-]+/giu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 512);

  for (const tok of tokens) {
    const h = fnv1a32(tok);
    const idx = h % dims;
    const sign = (h & 1) === 0 ? 1 : -1;
    v[idx] += sign;
  }

  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) v[i] = v[i]! / norm;
  return v;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

