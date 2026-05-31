import { AlertTriangle, ArrowLeft, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useJwtSession } from '@/hooks/useJwtSession';

type Post = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  lastActivityAt: string;
  author: { userId: string; walletAddress: string | null };
  score: number;
  comments: number;
  viewerVote: number;
  canModerate: boolean;
};

type Comment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  createdAt: string;
  author: { userId: string; walletAddress: string | null };
  score: number;
  viewerVote: number;
};

function formatDt(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function ForumPostPage({ postId }: { postId: string }) {
  const { token } = useJwtSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const load = useCallback(async () => {
    const postUrl = new URL(window.location.origin + '/api/forum/post');
    postUrl.searchParams.set('id', postId);
    const postRes = await fetch(postUrl.toString(), { cache: 'no-store', headers });
    const postData = (await postRes.json().catch(() => null)) as { post?: unknown } | null;
    setPost((postData?.post as Post) ?? null);

    const cUrl = new URL(window.location.origin + '/api/forum/comments');
    cUrl.searchParams.set('postId', postId);
    const cRes = await fetch(cUrl.toString(), { cache: 'no-store', headers });
    const cData = (await cRes.json().catch(() => null)) as { comments?: unknown } | null;
    const list = Array.isArray(cData?.comments) ? (cData?.comments as Comment[]) : [];
    setComments(list);
  }, [headers, postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const vote = async (targetType: 'post' | 'comment', targetId: string, nextValue: number) => {
    if (!token) return;
    setBusy(true);
    try {
      await fetch('/api/forum/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetType, targetId, value: nextValue }),
        cache: 'no-store',
      });
      if (targetType === 'post') {
        setPost((prev) => {
          if (!prev) return prev;
          const delta = nextValue - (prev.viewerVote ?? 0);
          return { ...prev, viewerVote: nextValue, score: (prev.score ?? 0) + delta };
        });
      } else {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== targetId) return c;
            const delta = nextValue - (c.viewerVote ?? 0);
            return { ...c, viewerVote: nextValue, score: (c.score ?? 0) + delta };
          }),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const addComment = async () => {
    const text = draft.trim();
    if (!token || !text) return;
    setBusy(true);
    setDraft('');
    try {
      await fetch(`/api/forum/comments?postId=${encodeURIComponent(postId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: text }),
        cache: 'no-store',
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const report = async (targetType: 'post' | 'comment', targetId: string) => {
    if (!token) return;
    const reason = 'abuz';
    await fetch('/api/forum/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetType, targetId, reason }),
      cache: 'no-store',
    });
  };

  return (
    <main id="main-content" tabIndex={-1} className="relative min-h-[70vh] w-full pb-[var(--mobile-conversion-dock-reserve)] xl:pb-0">
      <div className="section-padding-x max-w-6xl mx-auto w-full pt-24 pb-16">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-solaris-gold" />
          <h1 className="text-white text-2xl font-semibold tracking-tight">Forum</h1>
        </div>
        <div className="mt-3">
          <a href="/forum" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Înapoi la listă
          </a>
        </div>

        {!post ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 text-white/70">
            Postare indisponibilă.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white text-xl font-semibold">{post.title}</div>
              <div className="mt-2 text-[11px] text-white/50">
                {formatDt(post.createdAt)} · score {post.score} · {post.comments} comentarii
              </div>
              <div className="mt-4 text-white/85 text-sm whitespace-pre-wrap break-words">{post.body}</div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void vote('post', post.id, post.viewerVote === 1 ? 0 : 1)}
                  disabled={!token || busy}
                  className={
                    'h-9 px-3 rounded-xl border text-sm flex items-center gap-2 disabled:opacity-60 ' +
                    (post.viewerVote === 1
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                  }
                >
                  <ThumbsUp className="w-4 h-4" /> Like
                </button>
                <button
                  type="button"
                  onClick={() => void vote('post', post.id, post.viewerVote === -1 ? 0 : -1)}
                  disabled={!token || busy}
                  className={
                    'h-9 px-3 rounded-xl border text-sm flex items-center gap-2 disabled:opacity-60 ' +
                    (post.viewerVote === -1
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                  }
                >
                  <ThumbsDown className="w-4 h-4" /> Dislike
                </button>
                {token ? (
                  <button
                    type="button"
                    onClick={() => void report('post', post.id)}
                    className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Raportează
                  </button>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-white font-semibold">Comentariu</div>
              <div className="mt-3 grid gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={token ? 'Scrie un comentariu…' : 'Conectează wallet ca să comentezi.'}
                  disabled={!token || busy}
                  rows={6}
                  className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-white placeholder:text-white/40 disabled:opacity-60 resize-y"
                />
                <button
                  type="button"
                  onClick={() => void addComment()}
                  disabled={!token || busy || !draft.trim()}
                  className="h-11 px-4 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60"
                >
                  Trimite
                </button>
                {!token ? <div className="text-xs text-white/60">Conectează wallet ca să comentezi.</div> : null}
              </div>
            </div>

            <div className="lg:col-span-12 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-white/60 px-3 py-2">Comentarii</div>
              <div className="divide-y divide-white/10">
                {comments.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-white/60">Niciun comentariu încă.</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="px-3 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] text-white/50">
                          {formatDt(c.createdAt)} · score {c.score}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void vote('comment', c.id, c.viewerVote === 1 ? 0 : 1)}
                            disabled={!token || busy}
                            className={
                              'h-8 px-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-60 ' +
                              (c.viewerVote === 1
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                            }
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void vote('comment', c.id, c.viewerVote === -1 ? 0 : -1)}
                            disabled={!token || busy}
                            className={
                              'h-8 px-2 rounded-lg border text-xs flex items-center gap-1 disabled:opacity-60 ' +
                              (c.viewerVote === -1
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10')
                            }
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          {token ? (
                            <button
                              type="button"
                              onClick={() => void report('comment', c.id)}
                              className="h-8 px-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Rap.
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 text-white/85 text-sm whitespace-pre-wrap break-words">{c.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
