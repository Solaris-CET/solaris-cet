import { getAuthToken } from '@/lib/authToken';
import type { CetAiChatEntry } from '@/lib/cetAiConversation';

import type { CetAiFetchResult } from './cetAiSearchTypes';

export function chatHistoryToConversation(history: CetAiChatEntry[]): { role: 'user' | 'assistant'; content: string }[] {
  return history
    .flatMap((e) => [
      { role: 'user' as const, content: e.question },
      { role: 'assistant' as const, content: e.answer },
    ])
    .slice(-24);
}

export async function fetchCetAiChat(
  query: string,
  signal: AbortSignal,
  priorHistory: CetAiChatEntry[],
  opts?: {
    model?: string;
    tone?: string;
    mode?: string;
    instructions?: string;
    conversationId?: string | null;
    revisionOfMessageId?: string | null;
    forceFresh?: boolean;
    attachmentIds?: string[];
  },
): Promise<CetAiFetchResult> {
  const conversation = chatHistoryToConversation(priorHistory);
  const maxAttempts = 2;
  let sawHttpOrEmptyError = false;
  let lastErrorDetail: string | null = null;
  let lastHttpStatus: number | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const endpoint = attempt === 0 ? '/api/ai/ask' : '/api/chat';
    if (attempt > 0) {
      await new Promise<void>(resolve => {
        const delay = 300 + Math.random() * 400;
        const onAbort = () => {
          clearTimeout(id);
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        if (signal.aborted) {
          resolve();
          return;
        }
        const onTimeout = () => {
          signal.removeEventListener('abort', onAbort);
          resolve();
        };
        const id = setTimeout(onTimeout, delay);
        signal.addEventListener('abort', onAbort);
      });
      if (signal.aborted)
        return {
          text: null,
          sourceHeader: null,
          sources: [],
          modelUsed: null,
          conversationId: null,
          assistantMessageId: null,
          queryLogId: null,
          usedCache: false,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
    }
    try {
      const token = getAuthToken();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query,
          conversation,
          model: opts?.model,
          tone: opts?.tone,
          mode: opts?.mode,
          instructions: opts?.instructions,
          conversationId: opts?.conversationId ?? null,
          revisionOfMessageId: opts?.revisionOfMessageId ?? null,
          forceFresh: Boolean(opts?.forceFresh),
          attachmentIds: Array.isArray(opts?.attachmentIds) ? opts?.attachmentIds : [],
        }),
        signal,
      });
      const sourceHeader = res.headers.get('X-Cet-Ai-Source');
      const usedCache = res.headers.get('X-Cet-Ai-Used-Cache') === '1';
      const raw = await res.text();
      let data: {
        response?: string;
        message?: string;
        error?: string;
        sources?: unknown;
        modelUsed?: unknown;
        conversationId?: unknown;
        assistantMessageId?: unknown;
        queryLogId?: unknown;
      } = {};
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        /* non-JSON error body */
      }
      const responseText = typeof data.response === 'string' ? data.response.trim() : '';
      const msg = typeof data.message === 'string' ? data.message.trim() : '';
      const err = typeof data.error === 'string' ? data.error.trim() : '';
      const modelUsed = typeof data.modelUsed === 'string' ? data.modelUsed.trim() : null;
      const conversationId = typeof data.conversationId === 'string' ? data.conversationId.trim() : null;
      const assistantMessageId = typeof data.assistantMessageId === 'string' ? data.assistantMessageId.trim() : null;
      const queryLogId = typeof data.queryLogId === 'string' ? data.queryLogId.trim() : null;
      const sources = Array.isArray(data.sources)
        ? data.sources
            .map((s): { id: string; title: string; url: string; snippet: string } | null => {
              if (!s || typeof s !== 'object') return null;
              const rec = s as Record<string, unknown>;
              const id = typeof rec.id === 'string' ? rec.id : '';
              const title = typeof rec.title === 'string' ? rec.title : '';
              const url = typeof rec.url === 'string' ? rec.url : '';
              const snippet = typeof rec.snippet === 'string' ? rec.snippet : '';
              if (!id || !title || !url) return null;
              return { id, title, url, snippet };
            })
            .filter((x): x is { id: string; title: string; url: string; snippet: string } => Boolean(x))
            .slice(0, 5)
        : [];
      const pickDetail = (): string | null => {
        const d = msg || err;
        if (!d) return null;
        return d.replace(/\s+/g, ' ').slice(0, 500);
      };
      if (res.ok && responseText) {
        return {
          text: responseText,
          sourceHeader,
          sources,
          modelUsed,
          conversationId,
          assistantMessageId,
          queryLogId,
          usedCache,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
      }
      const detail = pickDetail();
      if (detail) lastErrorDetail = detail;
      lastHttpStatus = res.status;
      if (!res.ok) {
        sawHttpOrEmptyError = true;
      } else if (res.ok && !responseText) {
        sawHttpOrEmptyError = true;
      }
    } catch {
      if (signal.aborted)
        return {
          text: null,
          sourceHeader: null,
          sources: [],
          modelUsed: null,
          conversationId: null,
          assistantMessageId: null,
          queryLogId: null,
          usedCache: false,
          liveEndpointError: false,
          errorDetail: null,
          httpStatus: null,
        };
    }
  }
  return {
    text: null,
    sourceHeader: null,
    sources: [],
    modelUsed: null,
    conversationId: null,
    assistantMessageId: null,
    queryLogId: null,
    usedCache: false,
    liveEndpointError: sawHttpOrEmptyError,
    errorDetail: lastErrorDetail,
    httpStatus: lastHttpStatus,
  };
}
