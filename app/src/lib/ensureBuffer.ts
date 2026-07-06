export async function ensureBuffer() {
  const g = globalThis as unknown as { Buffer?: unknown };
  if (g.Buffer) return;
  const mod = await import('buffer');
  g.Buffer = mod.Buffer;
}
