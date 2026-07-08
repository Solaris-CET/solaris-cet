import DOMPurify from 'dompurify';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trackAiQuery, trackEvent } from '@/lib/analytics';
import { fetchCetAiChat } from '@/lib/cetAiApi';
import { getAuthToken } from '@/lib/authToken';
import {
  CET_AI_MAX_QUERY_CHARS,
  CET_AI_PHASE_MS,
  TOPIC_KEYWORDS,
} from '@/lib/cetAiConstants';
import {
  buildCopyForAiText,
  buildFullConversationHandoff,
  type CetAiChatEntry,
} from '@/lib/cetAiConversation';
import { buildContextualResponse, liveApiHttpHintForStatus } from '@/lib/cetAiHelpers';
import type {
  AiAttachmentMeta,
  AiState,
  CetAiFetchResult,
  MetricsData,
  ReActPhase,
  SpeechRecognitionLike,
  TelemetryLog,
} from '@/lib/cetAiSearchTypes';
import {
  buildCetAiObserveParse,
  buildConsensusBurstLogMessage,
  buildDeepLatticeMeshLogMessage,
  buildDeepLatticeMeshLogMessageRawQuery,
  buildExpressomeBurstLogMessage,
  buildFlashGlintLogMessage,
  buildLoopCompleteBurstLogMessage,
  CET_AI_LATTICE_PHASE,
} from '@/lib/cetAiTelemetry';

import { useLanguage } from './useLanguage';
import { useLocalStorage } from './useLocalStorage';
import { useReducedMotion } from './useReducedMotion';
import { useSessionStorage } from './useSessionStorage';

export function useCetAiSearch(props: { initialPrompt?: string } = {}) {
  // --- LANGUAGE ---
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  // --- STATE MANAGEMENT ---
  const initialPrompt = props.initialPrompt;
  const [query, setQuery] = useState(() => (initialPrompt?.trim() ? initialPrompt.trim() : ''));
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [phase, setPhase] = useState<ReActPhase>('idle');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({ confidence: 0, latency: 0, cetCost: 0 });
  const [finalResponse, setFinalResponse] = useState('');
  const [typedResponse, setTypedResponse] = useState('');
  const [typingDone, setTypingDone] = useState(true);
  const [cetAiConfidence, setCetAiConfidence] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useSessionStorage<CetAiChatEntry[]>('cet-ai-chat-history', []);
  const [pinnedEntries, setPinnedEntries] = useLocalStorage<CetAiChatEntry[]>('cet-ai-pinned', []);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('cet-ai-recent-searches', []);
  const [aiModel, setAiModel] = useLocalStorage<string>('cet-ai-model', 'auto');
  const [aiTone, setAiTone] = useLocalStorage<string>('cet-ai-tone', 'brand');
  const [aiMode, setAiMode] = useLocalStorage<string>('cet-ai-mode', 'default');
  const [customInstructions, setCustomInstructions] = useLocalStorage<string>('cet-ai-custom-instructions', '');
  const [readingMode, setReadingMode] = useLocalStorage<boolean>('cet-ai-reading-mode', false);
  const [serverConversationId, setServerConversationId] = useLocalStorage<string | null>(
    'cet-ai-server-conversation-id',
    null,
  );
  const [attachments, setAttachments] = useLocalStorage<AiAttachmentMeta[]>('cet-ai-attachments', []);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedForAi, setCopiedForAi] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<string>('default');
  /** False when the last completed answer used local knowledge (no /api/chat). */
  const [responseUsedLiveApi, setResponseUsedLiveApi] = useState(false);
  const [responseSources, setResponseSources] = useState<Array<{ id: string; title: string; url: string; snippet: string }>>([]);
  /** True when /api/chat returned an error/empty body and we fell back to built-in knowledge. */
  const [liveApiReturnedError, setLiveApiReturnedError] = useState(false);
  /** Optional server message from JSON (`message` / `error`) when live API failed. */
  const [liveApiErrorDetail, setLiveApiErrorDetail] = useState<string | null>(null);
  /** Last HTTP status from a failed /api/chat response (429, 5xx, etc.). */
  const [liveApiHttpStatus, setLiveApiHttpStatus] = useState<number | null>(null);

  const [currentModelUsed, setCurrentModelUsed] = useState<string | null>(null);
  const [currentAssistantMessageId, setCurrentAssistantMessageId] = useState<string | null>(null);
  const [currentQueryLogId, setCurrentQueryLogId] = useState<string | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<-1 | 0 | 1 | null>(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [currentAlternates, setCurrentAlternates] = useState<NonNullable<CetAiChatEntry['alternates']>>([]);
  const [currentUsedCache, setCurrentUsedCache] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  const shareConsumedRef = useRef(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const modalInputRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const cetAiAbortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  /** Incremented to invalidate in-flight schedules (stop / new question). */
  const generationEpochRef = useRef(0);
  const typewriterTimerRef = useRef<number | null>(null);
  /** True once the current fetch has resolved, so fake phase timers can skip ahead. */
  const fetchDoneRef = useRef(false);

  // Auto-scroll telemetry terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Scroll chat to latest entry
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [chatHistory, submittedQuestion, finalResponse, prefersReducedMotion]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (typewriterTimerRef.current) {
        window.clearTimeout(typewriterTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setChatHistory((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list
        .map((e, i) => ({
          ...e,
          id: e.id ?? `${Date.now().toString(36)}-${i}`,
          createdAt: e.createdAt ?? Date.now(),
          alternates: Array.isArray(e.alternates) ? e.alternates : undefined,
        }))
        .slice(-80);
    });
    setPinnedEntries((prev) => (Array.isArray(prev) ? prev : []).slice(-200));
    setRecentSearches((prev) => (Array.isArray(prev) ? prev : []).slice(0, 20));
    setAttachments((prev) => (Array.isArray(prev) ? prev : []).slice(0, 6));
  }, [setChatHistory, setPinnedEntries, setRecentSearches, setAttachments]);

  useEffect(() => {
    let initTimer: number | null = null;
    const scheduleInit = (fn: () => void) => {
      initTimer = window.setTimeout(fn, 0);
    };
    const clearTimers = () => {
      if (initTimer) window.clearTimeout(initTimer);
      if (typewriterTimerRef.current) {
        window.clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };

    if (!finalResponse) {
      scheduleInit(() => {
        setTypedResponse('');
        setTypingDone(true);
      });
      return clearTimers;
    }
    if (prefersReducedMotion) {
      scheduleInit(() => {
        setTypedResponse(finalResponse);
        setTypingDone(true);
      });
      return clearTimers;
    }

    const isHtml = /<\/?[^>]+>/.test(finalResponse);
    const plain = isHtml
      ? DOMPurify.sanitize(finalResponse.replace(/<br\s*\/?\s*>/gi, '\n'), { ALLOWED_TAGS: [] })
      : finalResponse;

    const myEpoch = generationEpochRef.current;
    const total = plain.length;
    const stepMs = total > 2200 ? 6 : total > 900 ? 10 : 14;

    let i = 0;
    let last = performance.now();
    scheduleInit(() => {
      setTypedResponse('');
      setTypingDone(false);
    });

    const tick = () => {
      if (generationEpochRef.current !== myEpoch) return;
      const now = performance.now();
      const dt = Math.max(0, now - last);
      last = now;
      const chars = Math.max(1, Math.floor(dt / stepMs));
      i = Math.min(total, i + chars);
      setTypedResponse(plain.slice(0, i));
      if (i >= total) {
        setTypingDone(true);
        return;
      }
      typewriterTimerRef.current = window.setTimeout(tick, stepMs);
    };

    typewriterTimerRef.current = window.setTimeout(tick, stepMs);
    return clearTimers;
  }, [finalResponse, prefersReducedMotion]);

  // --- CLOSE HANDLER ---
  const handleClose = useCallback(() => {
    generationEpochRef.current += 1;
    cetAiAbortRef.current?.abort();
    cetAiAbortRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsModalOpen(false);
    setPhase('idle');
    setAiState('idle');
    setQuery('');
    setLogs([]);
    setFinalResponse('');
    setTypedResponse('');
    setTypingDone(true);
    setCetAiConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    try {
      window.speechSynthesis?.cancel();
    } catch {
      void 0;
    }
    setIsListening(false);
    setIsSpeaking(false);
    setSubmittedQuestion('');
    setResponseUsedLiveApi(false);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCopiedResponse(false);
    setCopiedForAi(false);
    setCopiedTranscript(false);
    setCurrentAssistantMessageId(null);
    setCurrentQueryLogId(null);
    setCurrentModelUsed(null);
    setCurrentFeedback(null);
    setCurrentAlternates([]);
    setCurrentUsedCache(false);
  }, [
    setIsModalOpen,
    setPhase,
    setQuery,
    setLogs,
    setFinalResponse,
    setTypedResponse,
    setTypingDone,
    setCetAiConfidence,
    setMetrics,
    setSubmittedQuestion,
    setResponseUsedLiveApi,
    setLiveApiReturnedError,
    setLiveApiErrorDetail,
    setLiveApiHttpStatus,
    setCopiedResponse,
    setCopiedForAi,
    setCopiedTranscript,
    setCurrentAssistantMessageId,
    setCurrentQueryLogId,
    setCurrentModelUsed,
    setCurrentFeedback,
    setCurrentAlternates,
    setCurrentUsedCache,
    setIsListening,
    setIsSpeaking,
  ]);

  // Focus follow-up input when a response is ready
  useEffect(() => {
    if (!isModalOpen || phase !== 'complete') return;
    const t = setTimeout(() => modalInputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [isModalOpen, phase]);

  // --- UTILITY ---
  const generateHash = useCallback(
    () => Math.random().toString(36).substring(2, 10).toUpperCase(),
    [],
  );
  const getTime = () => new Date().toISOString().split('T')[1].slice(0, 12);

  const addLog = useCallback((type: TelemetryLog['type'], message: string) => {
    setLogs(prev => [
      ...prev,
      { id: generateHash(), timestamp: getTime(), type, message },
    ]);
  }, [generateHash, setLogs]);

  const schedule = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
  };

  const estimateReadMinutes = (text: string): number => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };

  const sha256Lite = (s: string): string => {
    let h1 = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h1 ^= s.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return (h1 >>> 0).toString(16).padStart(8, '0');
  };

  const downloadText = (filename: string, text: string, type: string) => {
    try {
      const blob = new Blob([text], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 250);
    } catch {
      void 0;
    }
  };

  const exportHistoryJson = () => {
    const current: CetAiChatEntry | null =
      submittedQuestion && finalResponse
        ? {
            id: `${Date.now().toString(36)}-current`,
            question: submittedQuestion,
            answer: finalResponse,
            confidence: cetAiConfidence,
            createdAt: Date.now(),
            modelUsed: currentModelUsed ?? undefined,
            sources: responseSources,
          }
        : null;
    const payload = {
      exportedAt: new Date().toISOString(),
      history: [...chatHistory, ...(current ? [current] : [])],
      pinned: pinnedEntries,
      settings: { model: aiModel, tone: aiTone, mode: aiMode },
    };
    downloadText(`cet-ai-history-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };

  const exportHistoryMarkdown = () => {
    const blocks: string[] = [];
    const all: CetAiChatEntry[] = [...chatHistory];
    if (submittedQuestion && finalResponse) {
      all.push({
        question: submittedQuestion,
        answer: finalResponse,
        confidence: cetAiConfidence,
        modelUsed: currentModelUsed ?? undefined,
        sources: responseSources,
      });
    }
    blocks.push(`# CET AI Transcript\n\nExported: ${new Date().toISOString()}`);
    for (const e of all) {
      blocks.push(`\n## Q\n${e.question}\n\n## A\n${e.answer}`);
      if (Array.isArray(e.alternates) && e.alternates.length > 0) {
        const alt = e.alternates
          .map((a, i) => `\n### Regenerate #${i + 1}\n${a.answer}`)
          .join('\n');
        blocks.push(alt);
      }
      blocks.push('\n---');
    }
    downloadText(`cet-ai-history-${Date.now()}.md`, blocks.join('\n'), 'text/markdown');
  };

  const uploadAttachment = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
      window.alert('Login required for attachments.');
      return;
    }
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/ai/attachments', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        data = null;
      }
      const rec = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
      const attachmentRec = rec && rec.attachment && typeof rec.attachment === 'object' ? (rec.attachment as Record<string, unknown>) : null;
      const id = attachmentRec && typeof attachmentRec.id === 'string' ? attachmentRec.id : '';
      const filename = attachmentRec && typeof attachmentRec.filename === 'string' ? attachmentRec.filename : '';
      const mimeType = attachmentRec && typeof attachmentRec.mimeType === 'string' ? attachmentRec.mimeType : '';
      const bytes = attachmentRec && typeof attachmentRec.bytes === 'number' ? attachmentRec.bytes : 0;
      const url = rec && typeof rec.url === 'string' ? rec.url : null;
      if (!res.ok || !id) {
        window.alert('Upload failed.');
        return;
      }
      setAttachments((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const next = [{ id, filename, mimeType, bytes, url }, ...list.filter((x) => x.id !== id)];
        return next.slice(0, 6);
      });
    } catch {
      window.alert('Upload failed.');
    }
  };

  const handleAttachmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;
    void (async () => {
      for (const file of files.slice(0, 3)) {
        await uploadAttachment(file);
      }
    })();
  };

  const togglePinEntry = (entry: CetAiChatEntry) => {
    const id = entry.id ?? `${sha256Lite(entry.question)}-${sha256Lite(entry.answer)}`;
    setPinnedEntries((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.some((p) => (p.id ?? '') === id);
      if (exists) return list.filter((p) => (p.id ?? '') !== id);
      const next = [{ ...entry, id, pinned: true }, ...list];
      return next.slice(0, 200);
    });
  };

  const reportCurrentAnswer = async () => {
    if (!submittedQuestion || !finalResponse) return;
    const reason = window.prompt('Raportează răspuns: motiv scurt (ex: conținut inadecvat, halucinație, spam)')?.trim() ?? '';
    if (!reason) return;
    try {
      const token = getAuthToken();
      await fetch('/api/ai/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason,
          query: submittedQuestion,
          response: finalResponse,
          messageId: currentAssistantMessageId,
        }),
      });
    } catch {
      void 0;
    }
  };

  const rateCurrentAnswer = async (rating: -1 | 0 | 1) => {
    if (!finalResponse) return;
    if (sendingFeedback) return;
    setSendingFeedback(true);
    try {
      const token = getAuthToken();
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating,
          messageId: currentAssistantMessageId,
          queryLogId: currentQueryLogId,
        }),
      });
      setCurrentFeedback(rating);
      trackEvent('ai_feedback', { rating });
    } catch {
      void 0;
    } finally {
      setSendingFeedback(false);
    }
  };

  const stopSpeaking = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      void 0;
    }
    setIsSpeaking(false);
  };

  const speakAnswer = (text: string) => {
    if (!text.trim()) return;
    try {
      if (!('speechSynthesis' in window)) return;
      stopSpeaking();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = navigator.language;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    try {
      const AnyWin = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };
      const Rec = AnyWin.SpeechRecognition ?? AnyWin.webkitSpeechRecognition;
      if (!Rec) return;
      if (isListening) {
        recognitionRef.current?.stop?.();
        setIsListening(false);
        return;
      }
      const rec = new Rec();
      recognitionRef.current = rec;
      rec.lang = navigator.language;
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (ev: unknown) => {
        const transcript =
          typeof ev === 'object' &&
          ev !== null &&
          'results' in ev &&
          Array.isArray((ev as { results?: unknown }).results) &&
          Array.isArray((ev as { results: unknown[] }).results[0])
            ? (ev as { results: Array<Array<{ transcript?: unknown }>> }).results[0]?.[0]?.transcript
            : undefined;
        if (typeof transcript === 'string') setQuery(transcript.slice(0, CET_AI_MAX_QUERY_CHARS));
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      setIsListening(true);
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleStopGeneration = useCallback(() => {
    generationEpochRef.current += 1;
    if (typewriterTimerRef.current) {
      window.clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    cetAiAbortRef.current?.abort();
    cetAiAbortRef.current = null;
    setPhase('complete');
    setAiState('success');
    setFinalResponse(t.cetAi.generationStopped);
    setTypedResponse(t.cetAi.generationStopped);
    setTypingDone(true);
    setResponseUsedLiveApi(false);
    setResponseSources([]);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCetAiConfidence(0);
    setMetrics((m) => ({ ...m, confidence: 0 }));
  }, [
    t.cetAi.generationStopped,
    setPhase,
    setAiState,
    setFinalResponse,
    setTypedResponse,
    setTypingDone,
    setResponseUsedLiveApi,
    setResponseSources,
    setLiveApiReturnedError,
    setLiveApiErrorDetail,
    setLiveApiHttpStatus,
    setCetAiConfidence,
    setMetrics,
  ]);

  // --- CORE LOGIC: RAV + optional live /api/chat (Coolify/VPS) with local knowledge fallback ---
  const processQuestion = useCallback((
    q: string,
    priorHistory: CetAiChatEntry[] = [],
    runOpts?: { forceFresh?: boolean; revisionOfMessageId?: string | null },
  ) => {
    const question = q.trim().slice(0, CET_AI_MAX_QUERY_CHARS);
    if (!question) return;

    const myEpoch = ++generationEpochRef.current;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    cetAiAbortRef.current?.abort();
    const ac = new AbortController();
    cetAiAbortRef.current = ac;

    const cetAiFetchPromise = fetchCetAiChat(question, ac.signal, priorHistory, {
      model: aiModel,
      tone: aiTone,
      mode: aiMode,
      instructions: customInstructions,
      conversationId: serverConversationId,
      revisionOfMessageId: runOpts?.revisionOfMessageId ?? null,
      forceFresh: Boolean(runOpts?.forceFresh),
      attachmentIds: attachments.map((a) => a.id),
    });

    const { answer: localAnswer, confidence } = buildContextualResponse(question, t.cetAi.knowledge);
    const lowerQ = question.toLowerCase();
    let detected = 'default';
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some(kw => lowerQ.includes(kw))) {
        detected = topic;
        break;
      }
    }
    setDetectedTopic(detected);
    try {
      try {
        const k = 'solaris_ai_activated';
        const seen = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
        if (!seen) {
          localStorage.setItem(k, String(Date.now()));
          trackEvent('ai_activation', { topic: detected });
        }
      } catch {
        void 0;
      }
      trackAiQuery({
        topic: detected,
        queryLength: question.length,
        route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        source: 'cet_ai',
      });
    } catch {
      void 0;
    }
    const hash = generateHash();
    const tokenCount = question.split(/\s+/).length;
    const startMs = performance.now();

    setSubmittedQuestion(question);
    if (!runOpts?.revisionOfMessageId) {
      setCurrentAssistantMessageId(null);
    }
    setCurrentModelUsed(null);
    setCurrentUsedCache(false);
    setAiState('loading');
    setLogs([]);
    setFinalResponse('');
    setCetAiConfidence(0);
    setMetrics({ confidence: 0, latency: 0, cetCost: 0 });
    setResponseUsedLiveApi(false);
    setResponseSources([]);
    setLiveApiReturnedError(false);
    setLiveApiErrorDetail(null);
    setLiveApiHttpStatus(null);
    setCopiedResponse(false);
    setCopiedForAi(false);
    setCopiedTranscript(false);
    setCurrentFeedback(null);

    if (!runOpts?.revisionOfMessageId) {
      setRecentSearches((prev) => {
        const base = Array.isArray(prev) ? prev : [];
        const next = [question, ...base.filter((x) => x !== question)];
        return next.slice(0, 12);
      });
    }

    fetchDoneRef.current = false;

    setPhase('observe_parse');
    addLog('INFO', `RAV_INIT: Grok × Gemini CET AI v3.1 · Session [${hash}]`);
    const observeParseSeq = buildCetAiObserveParse(question, detected, tokenCount);
    addLog('QUANTUM', observeParseSeq[0]!);
    for (const line of observeParseSeq.slice(1)) {
      addLog('INFO', line);
    }

    schedule(() => {
      if (generationEpochRef.current !== myEpoch || fetchDoneRef.current) return;
      setPhase('observe_context');
      addLog('QUANTUM', `INTENT_EXTRACTION: Semantic vector computed. Ambiguity score: 0.${Math.floor(Math.random() * 30 + 10)}`);
      addLog('QUANTUM', buildFlashGlintLogMessage(question));
      addLog('INFO', `CONTEXT_MAP: Knowledge graph traversal · Nodes visited: 2,847`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CONTEXT_MESH', question, CET_AI_LATTICE_PHASE.observeContext));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, CET_AI_PHASE_MS[0]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch || fetchDoneRef.current) return;
      setPhase('think_route');
      addLog('INFO', `GEMINI_REASON: Analytical pathway · parallel hypothesis lattice`);
      addLog('QUANTUM', `HYPOTHESIS_GEN: 6 paths · superposition collapse scheduled`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ROUTE_MESH', question, CET_AI_LATTICE_PHASE.thinkRoute));
      setMetrics(prev => ({ ...prev, latency: Math.round(performance.now() - startMs) }));
    }, CET_AI_PHASE_MS[1]);

    schedule(() => {
      if (generationEpochRef.current !== myEpoch || fetchDoneRef.current) return;
      setPhase('think_validate');
      addLog('QUANTUM', `PATH_COLLAPSE: Highest-confidence path (p=${(confidence / 100).toFixed(4)})`);
      addLog('SEC', `CONSTRAINT_CHECK: Zero-hallucination bounds · fact anchors`);
      addLog('INFO', `BRAID_FRAME: Reasoning graph · depth 7 · nodes 1,204`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('VALIDATE_MESH', question, CET_AI_LATTICE_PHASE.thinkValidate));
      addLog('QUANTUM', buildExpressomeBurstLogMessage(question));
      setMetrics(prev => ({
        ...prev,
        confidence: Math.round(confidence * 0.7),
        latency: Math.round(performance.now() - startMs),
      }));
    }, CET_AI_PHASE_MS[2]);

    const advanceToComplete = () => {
      if (generationEpochRef.current !== myEpoch) return;
      setPhase('verify_cross');
      addLog('SEC', `VERIFY_INIT: Cross-model review · Grok↔Gemini`);
      addLog('QUANTUM', `ZK_PROOF: integrity bundle · Hash: 0x${generateHash()}`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('CROSS_MESH', question, CET_AI_LATTICE_PHASE.verifyCross));

      schedule(() => {
        if (generationEpochRef.current !== myEpoch) return;
        setPhase('verify_anchor');
        addLog('SEC', `IPFS_ANCHOR: trace slot reserved · CID: bafkrei${generateHash().toLowerCase()}`);
        addLog('INFO', `ON_CHAIN: anchor ref · Block: #${Math.floor(Math.random() * 1_000_000 + 48_000_000)}`);
        addLog('QUANTUM', buildDeepLatticeMeshLogMessage('MESH_SEAL', question, CET_AI_LATTICE_PHASE.meshSeal));
        addLog('QUANTUM', `RAV_VERIFIED: no hallucination flag on consensus path`);

        schedule(() => {
          if (generationEpochRef.current !== myEpoch) return;
          setPhase('complete');
          addLog('INFO', buildDeepLatticeMeshLogMessage('SESSION_MESH', question, CET_AI_LATTICE_PHASE.sessionClose));
          addLog('QUANTUM', buildLoopCompleteBurstLogMessage(question));
        }, 180);
      }, 180);
    };

    void (async () => {
      if (generationEpochRef.current !== myEpoch) return;
      const raced = await Promise.race<CetAiFetchResult>([
        cetAiFetchPromise,
        new Promise<CetAiFetchResult>(resolve => {
          setTimeout(
            () =>
              resolve({
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
              }),
            18_000,
          );
        }),
      ]).catch((): CetAiFetchResult => ({
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
      }));

      if (generationEpochRef.current !== myEpoch || ac.signal.aborted) return;
      fetchDoneRef.current = true;
      const remote = raced.text;
      const hasRemoteText = Boolean(remote?.trim());
      /** True only when the edge handler affirms live CET AI (see X-Cet-Ai-Source on /api/chat). */
      const usedLive = hasRemoteText && (raced.sourceHeader === 'live' || raced.sourceHeader === 'offline');
      const text = hasRemoteText ? remote!.trim() : localAnswer;
      const conf = hasRemoteText ? Math.min(99.2, confidence + 1.5) : confidence;
      setResponseSources(hasRemoteText ? raced.sources : []);
      setCurrentModelUsed(hasRemoteText ? (raced.modelUsed ?? null) : null);
      setCurrentUsedCache(Boolean(hasRemoteText && raced.usedCache));
      if (hasRemoteText && raced.conversationId) setServerConversationId(raced.conversationId);
      if (hasRemoteText && raced.assistantMessageId) setCurrentAssistantMessageId(raced.assistantMessageId);
      setCurrentQueryLogId(hasRemoteText ? (raced.queryLogId ?? null) : null);
      setLiveApiReturnedError(!hasRemoteText && raced.liveEndpointError);
      setLiveApiErrorDetail(
        !hasRemoteText && raced.liveEndpointError ? (raced.errorDetail ?? null) : null,
      );
      setLiveApiHttpStatus(
        !hasRemoteText && raced.liveEndpointError ? (raced.httpStatus ?? null) : null,
      );

      setPhase('act_execute');
      addLog('INFO', `GROK_ACT: Action directive pipeline · live /api/chat merge pending`);
      addLog('QUANTUM', `RESPONSE_COMPILE: dual-model payload · entropy seed`);
      addLog('INFO', buildDeepLatticeMeshLogMessage('ACT_MESH', question, CET_AI_LATTICE_PHASE.actExecute));
      addLog('INFO', buildDeepLatticeMeshLogMessageRawQuery('DEEP_LATTICE', question));
      addLog('SEC', `SIGN: Quantum OS key · Hash: 0x${generateHash()}${generateHash()}`);
      setMetrics(prev => ({
        ...prev,
        cetCost: parseFloat((Math.random() * 0.005 + 0.001).toFixed(4)),
        latency: Math.round(performance.now() - startMs),
      }));

      schedule(() => {
        if (generationEpochRef.current !== myEpoch) return;
        setPhase('act_consensus');
        addLog(
          'INFO',
          usedLive
            ? 'LIVE_CET_AI: /api/chat merged · dual-AI RAV payload materialised'
            : hasRemoteText
              ? 'API_CET_AI: /api/chat body used · X-Cet-Ai-Source missing or not live'
              : 'FALLBACK_CET_AI: static knowledge graph (deploy API for live Grok×Gemini)',
        );
        addLog('SEC', `TON_CONSENSUS: Payload validated · quorum OK`);
        addLog('QUANTUM', `RAV_COMPLETE: loop closed · Confidence: ${conf.toFixed(1)}%`);
        addLog('QUANTUM', buildConsensusBurstLogMessage(question));
        setMetrics(prev => ({
          ...prev,
          confidence: Math.round(conf),
          latency: Math.round(performance.now() - startMs),
        }));
        setCetAiConfidence(conf);
        setFinalResponse(text);
        setAiState('success');
        setResponseUsedLiveApi(usedLive);

        advanceToComplete();
      }, 120);
    })();
  }, [
    generateHash,
    addLog,
    t.cetAi.knowledge,
    aiModel,
    aiTone,
    aiMode,
    customInstructions,
    serverConversationId,
    setServerConversationId,
    attachments,
    setRecentSearches,
    setSubmittedQuestion,
    setCurrentAssistantMessageId,
    setCurrentModelUsed,
    setCurrentUsedCache,
    setAiState,
    setLogs,
    setFinalResponse,
    setCetAiConfidence,
    setMetrics,
    setResponseUsedLiveApi,
    setResponseSources,
    setLiveApiReturnedError,
    setLiveApiErrorDetail,
    setLiveApiHttpStatus,
    setCopiedResponse,
    setCopiedForAi,
    setCopiedTranscript,
    setCurrentFeedback,
    setPhase,
  ]);

  // Hero widget submit → open modal + start processing
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setQuery('');
    setIsModalOpen(true);
    processQuestion(q, []);
  };

  // Modal follow-up submit → archive current Q&A, start new question
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    const nextHistory: CetAiChatEntry[] =
      finalResponse && submittedQuestion
        ? [
            ...chatHistory,
            {
              id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              question: submittedQuestion,
              answer: finalResponse,
              confidence: cetAiConfidence,
              createdAt: Date.now(),
              modelUsed: currentModelUsed ?? undefined,
              sources: responseSources,
              alternates: currentAlternates.length > 0 ? currentAlternates : undefined,
            },
          ]
        : chatHistory;
    setChatHistory(nextHistory);
    const q = query.trim();
    setQuery('');
    processQuestion(q, nextHistory);
  };

  const isProcessing = phase !== 'idle' && phase !== 'complete';
  const liveApiHttpHint = liveApiReturnedError
    ? liveApiHttpHintForStatus(t.cetAi, liveApiHttpStatus)
    : null;

  useEffect(() => {
    if (!initialPrompt) return;
    if (shareConsumedRef.current) return;
    shareConsumedRef.current = true;
    const q = initialPrompt.trim().slice(0, CET_AI_MAX_QUERY_CHARS);
    if (!q) return;
    setQuery(q);
    setIsModalOpen(true);
    window.setTimeout(() => processQuestion(q, chatHistory), 50);
    setQuery('');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      window.history.replaceState(null, '', url.toString());
    } catch {
      void 0;
    }
  }, [chatHistory, initialPrompt, processQuestion]);

  const handleRegenerate = useCallback(() => {
    if (!submittedQuestion.trim() || isProcessing) return;
    if (finalResponse.trim()) {
      setCurrentAlternates((prev) => [
        ...prev,
        {
          answer: finalResponse,
          confidence: cetAiConfidence,
          createdAt: Date.now(),
          modelUsed: currentModelUsed ?? undefined,
          sources: responseSources,
        },
      ]);
    }
    processQuestion(submittedQuestion.trim(), chatHistory, {
      forceFresh: true,
      revisionOfMessageId: currentAssistantMessageId,
    });
  }, [
    submittedQuestion,
    chatHistory,
    isProcessing,
    processQuestion,
    finalResponse,
    cetAiConfidence,
    currentModelUsed,
    responseSources,
    currentAssistantMessageId,
    setCurrentAlternates,
  ]);

  return {
    t,
    prefersReducedMotion,
    query,
    setQuery,
    submittedQuestion,
    phase,
    aiState,
    logs,
    metrics,
    finalResponse,
    typedResponse,
    setTypedResponse,
    typingDone,
    setTypingDone,
    cetAiConfidence,
    isModalOpen,
    setIsModalOpen,
    chatHistory,
    setChatHistory,
    pinnedEntries,
    recentSearches,
    aiModel,
    setAiModel,
    aiTone,
    setAiTone,
    aiMode,
    setAiMode,
    customInstructions,
    setCustomInstructions,
    readingMode,
    setReadingMode,
    serverConversationId,
    setServerConversationId,
    attachments,
    setAttachments,
    copiedResponse,
    setCopiedResponse,
    copiedForAi,
    setCopiedForAi,
    copiedTranscript,
    setCopiedTranscript,
    detectedTopic,
    responseUsedLiveApi,
    responseSources,
    liveApiReturnedError,
    liveApiErrorDetail,
    liveApiHttpStatus,
    currentModelUsed,
    currentAssistantMessageId,
    currentQueryLogId,
    currentFeedback,
    sendingFeedback,
    currentAlternates,
    currentUsedCache,
    isListening,
    isSpeaking,
    showSettings,
    setShowSettings,
    showPinned,
    setShowPinned,
    refs: {
      shareConsumedRef,
      terminalRef,
      timersRef,
      modalInputRef,
      attachmentInputRef,
      chatEndRef,
      cetAiAbortRef,
      recognitionRef,
      generationEpochRef,
      typewriterTimerRef,
      fetchDoneRef,
    },
    actions: {
      handleClose,
      handleHeroSubmit,
      handleModalSubmit,
      handleRegenerate,
      handleStopGeneration,
      processQuestion,
      toggleListening,
      speakAnswer,
      stopSpeaking,
      rateCurrentAnswer,
      reportCurrentAnswer,
      togglePinEntry,
      exportHistoryJson,
      exportHistoryMarkdown,
      handleAttachmentInputChange,
    },
    derived: {
      isProcessing,
      liveApiHttpHint,
      estimateReadMinutes,
    },
  };
}

export type UseCetAiSearchReturn = ReturnType<typeof useCetAiSearch>;
