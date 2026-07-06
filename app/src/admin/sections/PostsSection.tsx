import { marked } from 'marked';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SafeHtml } from '@/components/SafeHtml';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { adminApi } from '../adminClient';

type PostListRow = { id: string; slug: string; title: string; status: string; excerpt: string | null };
type PostDoc = { id: string; slug: string; title: string; excerpt: string; markdown: string; status: string };

export function PostsSection({ token }: { token: string }) {
  const [posts, setPosts] = useState<PostListRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doc, setDoc] = useState<PostDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(async () => {
    const res = await adminApi<{ posts: PostListRow[] }>('/api/admin/cms/posts?locale=ro', { token });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPosts(res.data.posts);
    setError(null);
  }, [token]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await adminApi<{ post: PostDoc }>(`/api/admin/cms/post?id=${encodeURIComponent(selectedId)}`, { token });
      if (!res.ok) {
        if (!cancelled) setError(res.error);
        return;
      }
      if (!cancelled) {
        setDoc({
          id: res.data.post.id,
          slug: res.data.post.slug,
          title: res.data.post.title,
          excerpt: res.data.post.excerpt ?? '',
          markdown: res.data.post.markdown ?? '',
          status: res.data.post.status,
        });
        setError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  const create = async () => {
    const slug = prompt('Slug (ex: prima-postare)');
    if (!slug) return;
    const title = prompt('Titlu');
    if (!title) return;
    const res = await adminApi<{ post: { id: string } }>('/api/admin/cms/posts', {
      token,
      method: 'POST',
      body: { slug, title, locale: 'ro' },
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSelectedId(res.data.post.id);
    void loadList();
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminApi<{ post: PostDoc }>('/api/admin/cms/posts', {
        token,
        method: 'PUT',
        body: { id: doc.id, title: doc.title, excerpt: doc.excerpt, markdown: doc.markdown, status: doc.status },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDoc({
        id: res.data.post.id,
        slug: res.data.post.slug,
        title: res.data.post.title,
        excerpt: res.data.post.excerpt ?? '',
        markdown: res.data.post.markdown ?? '',
        status: res.data.post.status,
      });
      void loadList();
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => {
    const md = doc?.markdown ?? '';
    return marked.parse(md, { async: false }) as string;
  }, [doc?.markdown]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Blog (Markdown)</div>
        <Button onClick={create}>Post nou</Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="border border-white/10 bg-black/30 p-4 lg:col-span-1 overflow-auto max-h-[560px]">
          <div className="text-xs text-white/60 mb-2">Postări</div>
          <div className="space-y-1">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left rounded px-2 py-2 border ${selectedId === p.id ? 'border-amber-200/30 bg-white/5' : 'border-white/10 hover:bg-white/5'}`}
              >
                <div className="text-white text-sm font-medium">{p.title}</div>
                <div className="text-white/60 text-xs font-mono">{p.slug} · {p.status}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="border border-white/10 bg-black/30 p-4 lg:col-span-2">
          {doc ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-white/90 text-sm font-medium">Editare</div>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-black/40 border border-white/10 text-white/80 text-xs rounded px-2 py-1"
                    value={doc.status}
                    onChange={(e) => setDoc((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                  <Button onClick={save} disabled={saving}>{saving ? 'Salvez…' : 'Salvează'}</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Input value={doc.title} onChange={(e) => setDoc((prev) => (prev ? { ...prev, title: e.target.value } : prev))} placeholder="Titlu" />
                  <Textarea value={doc.excerpt} onChange={(e) => setDoc((prev) => (prev ? { ...prev, excerpt: e.target.value } : prev))} placeholder="Excerpt" className="min-h-[80px]" />
                  <Textarea value={doc.markdown} onChange={(e) => setDoc((prev) => (prev ? { ...prev, markdown: e.target.value } : prev))} placeholder="Markdown" className="min-h-[320px]" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-white/60">Preview</div>
                  <div className="rounded border border-white/10 bg-black/20 p-3 max-h-[520px] overflow-auto">
                    <SafeHtml
                      html={preview}
                      config={{
                        kind: 'limited',
                        allowedTags: ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'img', 'hr', 'br'],
                        allowedAttributes: ['href', 'target', 'rel', 'src', 'alt'],
                      }}
                      className="prose prose-invert max-w-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white/70 text-sm">Selectează o postare.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
