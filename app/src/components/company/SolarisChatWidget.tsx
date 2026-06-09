import { Bot, ChevronDown, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type CompanyDepartmentId,companyDepartments } from '@/data/companyDepartments';
import { cn } from '@/lib/utils';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'solaris_company_chat_v1';

function safeLoad(): { dept: CompanyDepartmentId; turns: ChatTurn[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { dept?: unknown; turns?: unknown };
    const dept = typeof parsed.dept === 'string' ? (parsed.dept as CompanyDepartmentId) : 'ofertare';
    const turns = Array.isArray(parsed.turns)
      ? (parsed.turns as Array<{ role?: unknown; content?: unknown }>).
          filter((t) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string' && t.content.trim())
          .slice(-24)
          .map((t) => ({ role: t.role as 'user' | 'assistant', content: String(t.content) }))
      : [];
    return { dept, turns };
  } catch {
    return null;
  }
}

function safeSave(state: { dept: CompanyDepartmentId; turns: ChatTurn[] }) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    void 0;
  }
}

export function SolarisChatWidget() {
  const initial = useMemo(() => safeLoad(), []);
  const [open, setOpen] = useState(false);
  const [dept, setDept] = useState<CompanyDepartmentId>(initial?.dept ?? 'ofertare');
  const [turns, setTurns] = useState<ChatTurn[]>(initial?.turns ?? []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeDept = useMemo(() => companyDepartments.find((d) => d.id === dept) ?? companyDepartments[0]!, [dept]);

  useEffect(() => {
    safeSave({ dept, turns });
  }, [dept, turns]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, open]);

  const send = async (content: string) => {
    const q = content.trim();
    if (!q || busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const nextTurns = [...turns, { role: 'user' as const, content: q }].slice(-24);
    setTurns(nextTurns);
    setInput('');
    setBusy(true);

    const page = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          conversation: nextTurns,
          context: { mode: 'company', page, department: dept },
        }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as { response?: unknown; message?: unknown } | null;
      const text = typeof json?.response === 'string' ? json.response : typeof json?.message === 'string' ? json.message : '';
      setTurns((t) =>
        [...t, { role: 'assistant' as const, content: text || 'Nu am putut genera un răspuns acum. Încearcă din nou.' }].slice(-24),
      );
    } catch {
      setTurns((t) => [...t, { role: 'assistant' as const, content: 'Conexiunea a eșuat. Te rog încearcă din nou.' }].slice(-24));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          'fixed z-[980] bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1rem,calc(env(safe-area-inset-right)+1rem))]',
          'h-12 px-4 rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)]',
          'text-solaris-text hover:bg-black/65 transition-colors inline-flex items-center gap-2',
        )}
        onClick={() => setOpen(true)}
        aria-label="Deschide chatbot Solaris CET"
      >
        <Bot className="h-4 w-4 text-solaris-gold" aria-hidden />
        <span className="text-sm font-semibold">Chat</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(92vw,520px)] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-white/10 bg-slate-950">
            <DialogTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Bot className="h-4 w-4 text-solaris-gold" aria-hidden />
                </span>
                <span className="text-base">Asistent Solaris Engineering</span>
              </span>
              <button
                type="button"
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Închide"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="bg-slate-950">
            <div className="px-4 py-3 border-b border-white/10">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left"
                onClick={() => setDeptOpen((v) => !v)}
                aria-expanded={deptOpen}
              >
                <span className="min-w-0">
                  <span className="block text-xs text-solaris-muted">Departament</span>
                  <span className="block truncate text-sm font-semibold text-solaris-text">{activeDept.name}</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-solaris-muted transition-transform', deptOpen ? 'rotate-180' : '')} aria-hidden />
              </button>
              {deptOpen ? (
                <div className="mt-2 rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                  {companyDepartments.map((d) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={cn(
                          'w-full px-3 py-2 text-left flex items-start gap-3 hover:bg-white/5 transition-colors',
                          d.id === dept ? 'bg-white/5' : '',
                        )}
                        onClick={() => {
                          setDept(d.id);
                          setDeptOpen(false);
                        }}
                      >
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 shrink-0">
                          <Icon className="h-4 w-4 text-solaris-gold" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-solaris-text truncate">{d.name}</span>
                          <span className="block text-xs text-solaris-muted line-clamp-2">{d.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div ref={listRef} className="h-[min(52vh,420px)] overflow-y-auto px-4 py-4 space-y-3">
              {turns.length === 0 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-semibold text-solaris-text">Cu ce te pot ajuta?</div>
                    <div className="mt-1 text-xs text-solaris-muted">Alege un prompt rapid sau scrie direct.</div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {activeDept.quickPrompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className="rounded-2xl border border-white/10 bg-black/35 hover:bg-black/45 px-3 py-2 text-left text-sm text-solaris-text transition-colors"
                        onClick={() => void send(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/35 overflow-hidden">
                    <div className="h-40 w-full bg-[radial-gradient(circle_at_20%_20%,rgba(242,201,76,0.18)_0%,transparent_55%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.14)_0%,transparent_52%)]" />
                  </div>
                </div>
              ) : (
                turns.map((t, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'max-w-[92%] rounded-2xl border px-3 py-2 text-sm leading-relaxed',
                      t.role === 'user'
                        ? 'ml-auto border-white/10 bg-white/5 text-solaris-text'
                        : 'mr-auto border-solaris-gold/20 bg-solaris-gold/10 text-solaris-text',
                    )}
                  >
                    {t.content}
                  </div>
                ))
              )}
              {busy ? (
                <div className="mr-auto max-w-[92%] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-solaris-muted animate-pulse">
                  Scriu…
                </div>
              ) : null}
            </div>

            <form
              className="border-t border-white/10 px-4 py-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie mesajul…"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-solaris-text placeholder:text-solaris-muted focus:outline-none focus:ring-2 focus:ring-solaris-gold/40"
                maxLength={1200}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className={cn(
                  'h-10 w-10 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-solaris-text transition-colors',
                  busy || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-solaris-gold/15 hover:border-solaris-gold/25',
                )}
                aria-label="Trimite"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </form>
            <div className="px-4 pb-3 text-[11px] text-solaris-muted">
              Pentru ofertă rapidă: <a className="text-solaris-text hover:underline" href="tel:+40769889721">+40 769 889 721</a> ·{' '}
              <a className="text-solaris-text hover:underline" href="mailto:solaris-cet@protonmail.com">solaris-cet@protonmail.com</a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
