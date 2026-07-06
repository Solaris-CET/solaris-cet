export function cronAuthResult(req: Request):
  | { ok: true }
  | { ok: false; status: number; error: string } {
  const cronSecret = String(process.env.CRON_SECRET ?? '').trim();
  const cronToken = String(process.env.CRON_TOKEN ?? '').trim();
  if (!cronSecret && !cronToken) return { ok: false, status: 501, error: 'Not configured' };

  const providedSecret = String(req.headers.get('x-cron-secret') ?? '').trim();
  if (cronSecret && providedSecret && providedSecret === cronSecret) return { ok: true };

  const url = new URL(req.url);
  const tokenQuery = String(url.searchParams.get('token') ?? '').trim();
  if (cronToken && tokenQuery && tokenQuery === cronToken) return { ok: true };

  const auth = String(req.headers.get('authorization') ?? '');
  if (cronToken && auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice('bearer '.length).trim();
    if (token === cronToken) return { ok: true };
  }

  return { ok: false, status: 403, error: 'Forbidden' };
}

export function requireCron(req: Request): boolean {
  return cronAuthResult(req).ok;
}
