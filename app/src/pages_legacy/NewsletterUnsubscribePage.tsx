import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export default function NewsletterUnsubscribePage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URL(window.location.href).searchParams.get('token') ?? '';
  }, []);

  useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Token lipsă.' });
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = (await res.json()) as { ok?: boolean; status?: string; error?: string };
        if (!res.ok || !data.ok) {
          setState({ kind: 'error', message: data.error || 'Token invalid.' });
          return;
        }
        setState({ kind: 'ok', message: 'Ai fost dezabonat(ă). Poți reveni oricând.' });
      } catch {
        setState({ kind: 'error', message: 'Eroare de rețea. Încearcă din nou.' });
      }
    })();
  }, [token]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Dezabonare</h1>
        <div className="mt-4 flex items-start gap-3">
          {state.kind === 'loading' ? (
            <Loader2 className="h-5 w-5 text-white/60 animate-spin" />
          ) : state.kind === 'ok' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-300/90" />
          ) : (
            <XCircle className="h-5 w-5 text-red-300/90" />
          )}
          <p className="text-sm text-white/70 leading-relaxed">
            {state.kind === 'loading' ? 'Se procesează…' : state.message}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
            Home
          </a>
          <a
            href="/app"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            App
          </a>
        </div>
      </div>
    </main>
  );
}

