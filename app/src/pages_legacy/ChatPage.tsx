import { AlertTriangle, Send, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDataSaver } from '@/hooks/useDataSaver';
import { useDocumentHidden } from '@/hooks/useDocumentHidden';
import { useJwtSession } from '@/hooks/useJwtSession';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { readEnvelope, writeEnvelope } from '@/lib/localJsonStore';

type Room = { id: string; slug: string; title: string; kind: string; eventId: string | null };
type Message = { id: string; userId: string; body: string; createdAt: string; status?: string };

export default function ChatPage() {
  const { token } = useJwtSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const lastTsRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const online = useOnlineStatus();
  const hidden = useDocumentHidden();
  const { enabled: dataSaver } = useDataSaver();
  const pullRef = useRef<{ y0: number; pulling: boolean; dy: number }>({ y0: 0, pulling: false, dy: 0 });
  const [pullDy, setPullDy] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const activeRoom = useMemo(() => rooms.find((r) => r.id === activeRoomId) ?? null, [rooms, activeRoomId]);
  const cacheKey = useMemo(() => (activeRoomId ? `solaris_chat_cache:${activeRoomId}` : ''), [activeRoomId]);

  const setAppBadge = useCallback(async (count: number) => {
    const navAny = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (count <= 0) {
      await navAny.clearAppBadge?.();
      return;
    }
    await navAny.setAppBadge?.(count);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/chat/rooms', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { rooms?: unknown } | null;
      const list = Array.isArray(data?.rooms) ? (data?.rooms as Room[]) : [];
      if (cancelled) return;
      setRooms(list);
      if (!activeRoomId && list[0]?.id) setActiveRoomId(list[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeRoomId, token]);

  useEffect(() => {
    if (!activeRoomId) return;
    let cancelled = false;

    const poll = async (mode: 'since' | 'full' = 'since') => {
      if (!online) return;
      const since = lastTsRef.current;
      const url = new URL(window.location.origin + '/api/chat/messages');
      url.searchParams.set('roomId', activeRoomId);
      if (mode === 'since' && since) url.searchParams.set('since', since);
      const res = await fetch(url.toString(), {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json().catch(() => null)) as { messages?: unknown; canModerate?: unknown } | null;
      const list = Array.isArray(data?.messages) ? (data?.messages as Message[]) : [];
      if (cancelled) return;
      setCanModerate(Boolean(data?.canModerate));
      if (list.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const next = [...prev];
          for (const m of list) if (!seen.has(m.id)) next.push(m);
          const sliced = next.slice(-160);
          writeEnvelope(cacheKey, sliced);
          if (hidden) {
            void setAppBadge(Math.min(99, list.length));
          }
          return sliced;
        });
        lastTsRef.current = list[list.length - 1]?.createdAt ?? lastTsRef.current;
      }
    };

    lastTsRef.current = null;
    setMessages([]);
    const cached = cacheKey ? readEnvelope<Message[]>(cacheKey, 1000 * 60 * 60 * 24 * 14) : null;
    if (cached && cached.length) {
      setMessages(cached.slice(-160));
      lastTsRef.current = cached[cached.length - 1]?.createdAt ?? null;
    }
    void poll('full');
    const intervalMs = dataSaver || hidden ? 8000 : 2200;
    const id = window.setInterval(() => void poll('since'), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeRoomId, token, cacheKey, dataSaver, hidden, online, setAppBadge]);

  const doRefresh = useCallback(async () => {
    if (!activeRoomId) return;
    setRefreshing(true);
    try {
      lastTsRef.current = null;
      const url = new URL(window.location.origin + '/api/chat/messages');
      url.searchParams.set('roomId', activeRoomId);
      const res = await fetch(url.toString(), {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json().catch(() => null)) as { messages?: unknown; canModerate?: unknown } | null;
      const list = Array.isArray(data?.messages) ? (data?.messages as Message[]) : [];
      setCanModerate(Boolean(data?.canModerate));
      setMessages(() => {
        const sliced = list.slice(-160);
        if (cacheKey) writeEnvelope(cacheKey, sliced);
        return sliced;
      });
      lastTsRef.current = list[list.length - 1]?.createdAt ?? null;
      if (!hidden) {
        void setAppBadge(0);
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeRoomId, cacheKey, hidden, setAppBadge, token]);

  const send = async () => {
    const text = draft.trim();
    if (!token || !activeRoomId || !text || text.length > 500) return;
    setSending(true);
    setDraft('');
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: activeRoomId, body: text }),
        cache: 'no-store',
      });
    } finally {
      setSending(false);
    }
  };

  const report = async (messageId: string) => {
    if (!token) return;
    const reason = 'abuz';
    await fetch('/api/chat/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageId, reason }),
      cache: 'no-store',
    });
  };

  const moderate = async (messageId: string, action: 'hide' | 'approve') => {
    if (!token) return;
    await fetch('/api/chat/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageId, action }),
      cache: 'no-store',
    });
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-solaris-cyan" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Chat</h1>
        </div>
        <p className="mt-2 text-white/70 text-sm">Chat simplu cu moderare de bază. Pentru a scrie, conectează wallet.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60 px-2 py-2">Camere</div>
            <div className="space-y-1">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRoomId(r.id)}
                  className={
                    'w-full text-left px-3 py-2 rounded-xl border transition ' +
                    (r.id === activeRoomId
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10')
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.title}</span>
                    {r.kind !== 'global' ? <Shield className="w-3.5 h-3.5 text-solaris-gold" /> : null}
                  </div>
                  <div className="text-[11px] text-white/50">/{r.slug}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-9 rounded-2xl border border-white/10 bg-black/30 p-3 flex flex-col min-h-[560px]">
            <div className="px-2 py-2 flex items-center justify-between">
              <div className="text-white text-sm font-semibold">{activeRoom?.title ?? '—'}</div>
              {!token ? <div className="text-xs text-white/60">read-only</div> : null}
            </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-auto px-2 py-3 space-y-2"
              onTouchStart={(e) => {
                const el = scrollRef.current;
                if (!el) return;
                if (el.scrollTop > 0) return;
                pullRef.current = { y0: e.touches[0]?.clientY ?? 0, pulling: true, dy: 0 };
              }}
              onTouchMove={(e) => {
                const state = pullRef.current;
                const el = scrollRef.current;
                if (!state.pulling || !el) return;
                if (el.scrollTop > 0) {
                  pullRef.current.pulling = false;
                  setPullDy(0);
                  return;
                }
                const y = e.touches[0]?.clientY ?? state.y0;
                const dy = Math.max(0, y - state.y0);
                state.dy = dy;
                setPullDy(Math.min(90, dy * 0.55));
              }}
              onTouchEnd={() => {
                const state = pullRef.current;
                const should = state.pulling && state.dy > 90;
                pullRef.current.pulling = false;
                pullRef.current.dy = 0;
                setPullDy(0);
                if (should) void doRefresh();
              }}
              style={pullDy ? { transform: `translateY(${pullDy}px)`, transition: 'transform 120ms ease-out' } : undefined}
            >
              {pullDy || refreshing ? (
                <div className="sticky top-0 z-10 mb-2">
                  <div className="mx-auto w-fit rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] text-white/70">
                    {refreshing ? 'Se actualizează…' : 'Trage pentru refresh'}
                  </div>
                </div>
              ) : null}
              {messages.length === 0 ? (
                <div className="text-sm text-white/60 px-2 py-3">Niciun mesaj încă.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] text-white/50">{new Date(m.createdAt).toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        {m.status === 'queued' ? (
                          <span className="text-[11px] text-solaris-gold">în coadă</span>
                        ) : null}
                        {canModerate && m.status === 'queued' ? (
                          <button
                            type="button"
                            onClick={() => void moderate(m.id, 'approve')}
                            className="text-[11px] text-white/70 hover:text-white"
                          >
                            Approve
                          </button>
                        ) : null}
                        {canModerate ? (
                          <button
                            type="button"
                            onClick={() => void moderate(m.id, 'hide')}
                            className="text-[11px] text-white/70 hover:text-white"
                          >
                            Hide
                          </button>
                        ) : null}
                        {token ? (
                          <button
                            type="button"
                            onClick={() => void report(m.id)}
                            className="text-[11px] text-white/60 hover:text-white flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Raportează
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-white text-sm whitespace-pre-wrap break-words mt-1">{m.body}</div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-3 border-t border-white/10 px-2">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={token ? 'Scrie un mesaj…' : 'Conectează wallet ca să scrii.'}
                  disabled={!token || sending}
                  className="flex-1 h-11 rounded-xl bg-black/40 border border-white/10 px-3 text-white placeholder:text-white/40 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!token || sending || !draft.trim()}
                  className="h-11 px-4 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Trimite
                </button>
              </div>
              <div className="mt-2 text-[11px] text-white/50">Mesajele cu termeni interziși sunt puse în coadă.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
