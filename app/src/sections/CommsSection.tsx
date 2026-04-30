import { Check, Mail, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { mktConversion } from '@/lib/marketing';
import { cn } from '@/lib/utils';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string };

export default function CommsSection() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  const helper = useMemo(() => {
    if (state.kind === 'sent') return 'Ți-am trimis un email de confirmare. Verifică inbox-ul.';
    if (state.kind === 'error') return state.message;
    return 'Newsletter double opt-in. Fără spam. Unsubscribe oricând.';
  }, [state]);

  const canSubmit = consent && email.trim().length > 0 && state.kind !== 'submitting';

  const submit = async () => {
    if (!canSubmit) return;
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale: lang, consent: true }),
      });
      if (!res.ok) {
        const txt = await res.text();
        setState({ kind: 'error', message: txt ? `Eroare: ${txt.slice(0, 140)}` : 'Eroare la abonare.' });
        return;
      }
      setState({ kind: 'sent' });
      mktConversion('Lead', { source: 'newsletter', locale: lang });
    } catch {
      setState({ kind: 'error', message: 'Rețea indisponibilă. Încearcă din nou.' });
    }
  };

  return (
    <section aria-label="Notificări și newsletter" className="relative z-40 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Sparkles className="h-5 w-5 text-solaris-gold" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white text-xl font-semibold tracking-tight">Rămâi conectat</h2>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">
                  Primești confirmare email, apoi 3 mesaje de onboarding cu setări utile (alerte, push, Web3).
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <label className="text-xs text-white/60">Email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state.kind !== 'idle') setState({ kind: 'idle' });
                    }}
                    placeholder="nume@domeniu.com"
                    className="pl-9"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
                <Button onClick={submit} disabled={!canSubmit} className="rounded-xl">
                  {state.kind === 'sent' ? <Check className="h-4 w-4" /> : 'Abonează-te'}
                </Button>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v: boolean | 'indeterminate') => {
                    setConsent(Boolean(v));
                    if (state.kind !== 'idle') setState({ kind: 'idle' });
                  }}
                  id="newsletter-consent"
                />
                <label htmlFor="newsletter-consent" className="text-xs text-white/60 leading-relaxed">
                  Sunt de acord să primesc emailuri de produs (newsletter + onboarding).
                </label>
              </div>

              <div
                className={cn(
                  'text-xs leading-relaxed',
                  state.kind === 'error' ? 'text-red-300/90' : state.kind === 'sent' ? 'text-emerald-200/90' : 'text-white/55',
                )}
              >
                {helper}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl">
            <h3 className="text-white text-lg font-semibold tracking-tight">Alerte rapide</h3>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              În App poți seta praguri $CET (↑/↓), cooldown și canal (email/push).
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="/app" className="btn-gold rounded-xl px-4 py-2 text-sm font-semibold">
                Deschide App
              </a>
              <a href="/login" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
