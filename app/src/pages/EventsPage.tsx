import { CalendarClock, ExternalLink, Mail, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useJwtSession } from '@/hooks/useJwtSession';

type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  joinUrl: string | null;
};

function formatDt(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function EventsPage() {
  const { token } = useJwtSession();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [emailReminders, setEmailReminders] = useState(false);

  const route = useMemo(() => (typeof window === 'undefined' ? '/evenimente' : window.location.pathname), []);
  const slug = useMemo(() => {
    if (!route.startsWith('/evenimente/')) return null;
    const s = route.slice('/evenimente/'.length).split('/')[0];
    return s || null;
  }, [route]);

  const selected = useMemo(() => (slug ? events.find((e) => e.slug === slug) ?? null : null), [events, slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/events', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { events?: unknown } | null;
      const list = Array.isArray(data?.events) ? (data?.events as EventRow[]) : [];
      if (cancelled) return;
      setEvents(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rsvp = async (eventId: string) => {
    if (!token) return;
    setBusy(true);
    try {
      await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId, status: 'yes' }),
        cache: 'no-store',
      });
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, emailRemindersEnabled: emailReminders }),
        cache: 'no-store',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-solaris-gold" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Evenimente</h1>
        </div>
        <p className="mt-2 text-white/70 text-sm">Calendar public + RSVP. Pentru email reminders, setează email în cont.</p>
        <div className="mt-3">
          <a
            href="/api/events/calendar"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            Sync calendar (ICS) <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {slug && selected ? (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white text-xl font-semibold">{selected.title}</div>
              <div className="mt-2 text-white/70 text-sm">{formatDt(selected.startAt)}</div>
              {selected.description ? <div className="mt-4 text-white/80 text-sm whitespace-pre-wrap">{selected.description}</div> : null}
              <div className="mt-5 grid gap-2">
                {selected.location ? (
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <MapPin className="w-4 h-4" /> {selected.location}
                  </div>
                ) : null}
                {selected.joinUrl ? (
                  <a
                    href={selected.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                  >
                    Join link <ExternalLink className="w-4 h-4" />
                  </a>
                ) : null}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void rsvp(selected.id)}
                  disabled={!token || busy}
                  className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60"
                >
                  RSVP
                </button>
                <a href="/evenimente" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10">
                  Înapoi
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Mail className="w-4 h-4 text-solaris-cyan" /> Email reminders
              </div>
              <p className="mt-2 text-white/70 text-sm">Primești un email cu ~1 zi înainte, dacă ai RSVP.</p>
              <div className="mt-4 grid gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplu.com"
                  disabled={!token || busy}
                  className="h-11 rounded-xl bg-black/40 border border-white/10 px-3 text-white placeholder:text-white/40 disabled:opacity-60"
                />
                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={emailReminders}
                    onChange={(e) => setEmailReminders(e.target.checked)}
                    disabled={!token || busy}
                    className="accent-solaris-gold"
                  />
                  Activează remindere
                </label>
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={!token || busy}
                  className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-60"
                >
                  Salvează
                </button>
                {!token ? <div className="text-xs text-white/60">Conectează wallet ca să salvezi setările.</div> : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60 px-3 py-2">Următoarele evenimente</div>
              <div className="divide-y divide-white/10">
                {events.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-white/60">Nu există evenimente publicate încă.</div>
                ) : (
                  events.map((e) => (
                    <a
                      key={e.id}
                      href={`/evenimente/${encodeURIComponent(e.slug)}`}
                      className="block px-3 py-4 hover:bg-white/5"
                    >
                      <div className="text-white font-medium">{e.title}</div>
                      <div className="mt-1 text-sm text-white/70">{formatDt(e.startAt)}</div>
                    </a>
                  ))
                )}
              </div>
            </div>
            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white font-semibold">Tip</div>
              <p className="mt-2 text-white/70 text-sm">După ce publici evenimente în DB, apar aici și în calendar.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
