export function logApiRouteEvent(
  label: string,
  event: 'request' | 'success' | 'error',
  meta: Record<string, unknown> = {},
): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;
  console.info(JSON.stringify({ route: label, event, ...meta, ts: new Date().toISOString() }));
}