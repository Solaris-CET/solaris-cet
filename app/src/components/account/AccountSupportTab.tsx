import { Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Msg = { id: string; sender: 'visitor' | 'user' | 'agent' | 'system'; body: string; createdAt: string };

type Props = {
  token: string;
  email: string;
};

export default function AccountSupportTab(props: Props) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${props.token}` }), [props.token]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/support/messages', { headers: authHeaders });
    if (!res.ok) return;
    const json = (await res.json()) as { conversationId?: unknown; messages?: unknown };
    const cid = typeof json.conversationId === 'string' ? json.conversationId : null;
    const msgs = Array.isArray(json.messages) ? (json.messages as Msg[]) : [];
    setConversationId(cid);
    setMessages(msgs);
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setInfo(null);
    try {
      if (!conversationId) {
        const res = await fetch('/api/support/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ message: draft.trim(), email: props.email || null, pageUrl: '/app' }),
        });
        if (!res.ok) {
          setInfo('Nu am putut deschide conversația.');
          return;
        }
        const json = (await res.json()) as { conversationId?: unknown };
        const cid = typeof json.conversationId === 'string' ? json.conversationId : null;
        setConversationId(cid);
        setDraft('');
        await load();
        return;
      }
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ conversationId, message: draft.trim() }),
      });
      if (!res.ok) {
        setInfo('Nu am putut trimite mesajul.');
        return;
      }
      setDraft('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-semibold">Mesaje</div>
        <div className="mt-4 h-[320px] overflow-auto space-y-2 pr-2">
          {messages.length === 0 ? (
            <div className="text-sm text-white/60">Scrie primul mesaj ca să deschizi un ticket.</div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.sender === 'agent'
                    ? 'ml-10 rounded-2xl border border-white/10 bg-white/5 px-3 py-2'
                    : 'mr-10 rounded-2xl border border-white/10 bg-black/30 px-3 py-2'
                }
              >
                <div className="text-[11px] text-white/50">{m.sender}</div>
                <div className="text-sm text-white/85 whitespace-pre-wrap">{m.body}</div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Scrie un mesaj…" />
          <Button onClick={send} disabled={busy} className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {info ? <div className="mt-3 text-xs text-white/60">{info}</div> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-semibold">Live chat</div>
        <div className="mt-2 text-sm text-white/70 leading-relaxed">
          Dacă ai Crisp/Tawk configurat, widget-ul este disponibil în colțul paginii.
        </div>
        <div className="mt-5 text-xs text-white/55">Admin: `/admin` → conversatii + leads.</div>
      </div>
    </div>
  );
}
