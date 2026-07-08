import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { adminApi, adminApiErr } from '../adminClient';

type ConversationRow = {
  id: string;
  sessionId: string;
  firstMessage: string;
  messageCount: number;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
};

type DailyAnalytics = {
  date: string;
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConv: number;
};

type TopicItem = {
  topic: string;
  count: number;
};

export function ConversationsSection({ token }: { token: string }) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([]);
  const [topTopics, setTopTopics] = useState<TopicItem[]>([]);
  const [resolutionRate, setResolutionRate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);
  const [convMessages, setConvMessages] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);

  const load = useCallback(async () => {
    const res = await adminApi<{
      conversations: ConversationRow[];
      total: number;
      totalPages: number;
      dailyAnalytics: DailyAnalytics[];
      topTopics: TopicItem[];
      resolutionRate: number;
    }>(`/api/admin/chat-analytics?page=${page}&limit=20`, { token });
    if (!res.ok) {
      setError(adminApiErr(res) ?? 'Request failed');
      return;
    }
    setConversations(res.data.conversations);
    setTotalPages(res.data.totalPages);
    setDailyAnalytics(res.data.dailyAnalytics);
    setTopTopics(res.data.topTopics);
    setResolutionRate(res.data.resolutionRate);
    setError(null);
  }, [token, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadConversationMessages = useCallback(async (sessionId: string) => {
    const res = await adminApi<{ messages: Array<{ role: string; content: string; timestamp: string }> }>(
      `/api/admin/chat-analytics?session_id=${encodeURIComponent(sessionId)}`,
      { token }
    );
    if (!res.ok) {
      setError(adminApiErr(res) ?? 'Request failed');
      return;
    }
    setConvMessages(res.data.messages);
  }, [token]);

  const markResolved = useCallback(async (id: string) => {
    const res = await adminApi<{ success: boolean }>(`/api/admin/chat-analytics/${id}`, {
      token,
      method: 'PUT',
      body: JSON.stringify({ resolved: true }),
    });
    if (!res.ok) {
      setError(adminApiErr(res) ?? 'Request failed');
      return;
    }
    void load();
  }, [token, load]);

  const exportCsv = useCallback(() => {
    const headers = ['Data', 'Primul mesaj', 'Mesaje', 'Rezolvat'];
    const rows = conversations.map((c) => [
      new Date(c.createdAt).toLocaleDateString('ro-RO'),
      c.firstMessage,
      String(c.messageCount),
      c.resolved ? 'Da' : 'Nu',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [conversations]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Conversații Chat</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/60">Rata de rezolvare</div>
          <div className="text-2xl font-bold text-white">{resolutionRate}%</div>
        </Card>
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/60">Conversații azi</div>
          <div className="text-2xl font-bold text-white">{dailyAnalytics[0]?.totalConversations ?? 0}</div>
        </Card>
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-xs text-white/60">Mesaje azi</div>
          <div className="text-2xl font-bold text-white">{dailyAnalytics[0]?.totalMessages ?? 0}</div>
        </Card>
      </div>

      {/* Daily analytics bar chart */}
      {dailyAnalytics.length > 0 && (
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-sm font-semibold text-white mb-3">Conversații per zi (ultimele 30 zile)</div>
          <div className="h-32">
            <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
              {dailyAnalytics.map((d, i) => {
                const max = Math.max(1, ...dailyAnalytics.map((x) => x.totalConversations));
                const h = Math.max(2, (d.totalConversations / max) * 100);
                const x = i * (600 / dailyAnalytics.length) + 2;
                const w = Math.max(2, 600 / dailyAnalytics.length - 4);
                return (
                  <rect key={d.date} x={x} y={120 - h} width={w} height={h} rx={2} fill="rgba(245,158,11,0.65)">
                    <title>{d.date}: {d.totalConversations} conversații</title>
                  </rect>
                );
              })}
            </svg>
          </div>
        </Card>
      )}

      {/* Top topics */}
      {topTopics.length > 0 && (
        <Card className="border border-white/10 bg-black/30 p-4">
          <div className="text-sm font-semibold text-white mb-3">Top 10 subiecte întrebate</div>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((t) => (
              <span
                key={t.topic}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
              >
                {t.topic}
                <span className="text-amber-400 font-bold">{t.count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Conversations list */}
      <Card className="border border-white/10 bg-black/30 p-4 overflow-auto">
        <table className="w-full text-sm text-white/80">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-2">Data</th>
              <th className="text-left py-2">Primul mesaj</th>
              <th className="text-right py-2">Mesaje</th>
              <th className="text-center py-2">Rezolvat</th>
              <th className="text-right py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="py-2 text-xs">{new Date(c.createdAt).toLocaleDateString('ro-RO')}</td>
                <td className="py-2 text-xs max-w-[200px] truncate">{c.firstMessage}</td>
                <td className="py-2 text-right">{c.messageCount}</td>
                <td className="py-2 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.resolved ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'
                  }`}>
                    {c.resolved ? 'Da' : 'Nu'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConv(c);
                        loadConversationMessages(c.sessionId);
                      }}
                    >
                      Vezi
                    </Button>
                    {!c.resolved && (
                      <Button variant="outline" size="sm" onClick={() => markResolved(c.id)}>
                        Rezolvat
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/50">Pagina {page} din {totalPages}</div>
        <div className="flex gap-2">
          <Button disabled={page <= 1} variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ← Anterioară
          </Button>
          <Button disabled={page >= totalPages} variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Următoarea →
          </Button>
        </div>
      </div>

      {/* Conversation detail modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedConv(null)}>
          <div className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-white">Conversație</div>
              <button onClick={() => setSelectedConv(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {convMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-amber-400/20 text-amber-200' : 'bg-white/10 text-white/80'
                  }`}>
                    <div className="text-[10px] text-white/40 mb-1">{msg.role === 'user' ? 'User' : 'Asistent'}</div>
                    <div>{msg.content}</div>
                    <div className="text-[10px] text-white/40 mt-1">{new Date(msg.timestamp).toLocaleTimeString('ro-RO')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
