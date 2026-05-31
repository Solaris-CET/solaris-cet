import { MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useJwtSession } from '@/hooks/useJwtSession';

type PostRow = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  lastActivityAt: string;
  author: { userId: string; walletAddress: string | null };
  score: number;
  comments: number;
  viewerVote: number;
};

function formatDt(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function ForumPage() {
  const { token } = useJwtSession();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canPost = Boolean(token) && title.trim().length >= 3 && body.trim().length >= 1 && !busy;

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const load = useCallback(async () => {
    const url = new URL(window.location.origin + '/api/forum/posts');
    url.searchParams.set('sort', 'activity');
    const res = await fetch(url.toString(), { cache: 'no-store', headers });
    const data = (await res.json().catch(() => null)) as { posts?: unknown } | null;
    const list = Array.isArray(data?.posts) ? (data.posts as PostRow[]) : [];
    setPosts(list);
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const vote = async (postId: string, nextValue: number) => {
    if (!token) return;
    setBusy(true);
    try {
      await fetch('/api/forum/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType: 'post', targetId: postId, value: nextValue }),
        cache: 'no-store',
      });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const delta = nextValue - (p.viewerVote ?? 0);
          return { ...p, viewerVote: nextValue, score: (p.score ?? 0) + delta };
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const createPost = async () => {
    if (!token) return;
    if (!canPost) return;
    setBusy(true);
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as { postId?: unknown } | null;
      const postId = typeof data?.postId === 'string' ? data.postId : null;
      if (postId) {
        window.location.href = `/forum/${encodeURIComponent(postId)}`;
        return;
      }
      await load();
      setTitle('');
      setBody('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-solaris-gold" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Forum</h1>
        </div>
        <p className="mt-2 text-white/70 text-sm">
          Postări + comentarii + voturi. Pentru a posta sau a vota, conectează wallet.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-white font-semibold">Postare nouă</div>
            <div className="mt-3 grid gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titlu"
                disabled={!token || busy}
                className="h-11 rounded-xl bg-black/40 border border-white/10 px-3 text-white placeholder:text-white/40 disabled:opacity-60"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Text"
                disabled={!token || busy}
                rows={6}
                className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-white/40 disabled:opacity-60 resize-y"
              />
              <button
                type="button"
                onClick={() => void createPost()}
                disabled={!canPost}
                className="h-11 px-4 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60"
              >
                Publică
              </button>
              {!token ? <div className="text-xs text-white/60">Conectează wallet ca să postezi.</div> : null}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60 px-3 py-2">Ultimele discuții</div>
            <div className="divide-y divide-white/10">
              {posts.length === 0 ? (
                <div className="px-3 py-4 text-sm text-white/60">Nu există postări încă.</div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="px-3 py-4 hover:bg-white/5">
                    <a href={`/forum/${encodeURIComponent(p.id)}`} className="block">
                      <div className="text-white font-medium">{p.title}</div>
                      <div className="mt-1 text-sm text-white/70 line-clamp-2 whitespace-pre-wrap">{p.body}</div>
                    </a>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-white/50">
                        {formatDt(p.lastActivityAt)} · score {p.score} · {p.comments} comentarii
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void vote(p.id, p.viewerVote === 1 ? 0 : 1)}
                          disabled={!token || busy}
                          className={
                            'h-9 px-3 rounded-xl border text-sm flex items-center gap-2 disabled:opacity-60 ' +
                            (p.viewerVote === 1
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                          }
                        >
                          <ThumbsUp className="w-4 h-4" /> Like
                        </button>
                        <button
                          type="button"
                          onClick={() => void vote(p.id, p.viewerVote === -1 ? 0 : -1)}
                          disabled={!token || busy}
                          className={
                            'h-9 px-3 rounded-xl border text-sm flex items-center gap-2 disabled:opacity-60 ' +
                            (p.viewerVote === -1
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                          }
                        >
                          <ThumbsDown className="w-4 h-4" /> Dislike
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
