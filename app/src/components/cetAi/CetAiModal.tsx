import {
  Bot,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Flag,
  Mic,
  Paperclip,
  Pin,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  StopCircle,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React from 'react';
import DOMPurify from 'dompurify';

import { Dialog, DialogTitle, FullscreenDialogContent } from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';
import { CET_AI_MAX_QUERY_CHARS, CET_AI_SAFE_HTML_CONFIG, FOLLOW_UP_BY_TOPIC } from '@/lib/cetAiConstants';
import {
  buildCopyForAiText,
  buildFullConversationHandoff,
} from '@/lib/cetAiConversation';
import { handleComposerEnterKeyDown } from '@/lib/cetAiHelpers';
import { TONSCAN_CET_CONTRACT_URL } from '@/lib/cetContract';
import type { UseCetAiSearchReturn } from '@/hooks/useCetAiSearch';

import { AiResultSkeleton } from './AiResultSkeleton';
import { CetAiQueryCharCountLine } from './CetAiQueryCharCountLine';
import { CetAiTypingIndicator } from './CetAiTypingIndicator';
import { MarkdownText } from './CetAiMarkdown';
import { ReActPanels } from './ReActPanels';
import { SafeHtml } from '../SafeHtml';

export function CetAiModal({ controller }: { controller: UseCetAiSearchReturn }) {
  const {
    t,
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
    currentModelUsed,
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
    refs: { terminalRef, modalInputRef, attachmentInputRef, chatEndRef },
    actions: {
      handleClose,
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
    derived: { isProcessing, liveApiHttpHint, estimateReadMinutes },
  } = controller;

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
    >
        <FullscreenDialogContent
          data-testid="cet-ai-modal-dialog"
          aria-describedby="cet-ai-dialog-desc"
          aria-busy={isProcessing}
          onOpenAutoFocus={(e: Event) => {
            e.preventDefault();
            requestAnimationFrame(() => modalInputRef.current?.focus());
          }}
          onCloseAutoFocus={(e: Event) => e.preventDefault()}
          showCloseButton={false}
          overlayClassName="bg-black/95 backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          className="fixed inset-0 z-[9999] flex flex-col font-sans pt-[env(safe-area-inset-top,0px)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
        <div className="sr-only">
          <DialogTitle>{t.cetAi.title}</DialogTitle>
        </div>
        <p id="cet-ai-dialog-desc" className="sr-only">
          {t.cetAi.modalDescription}
        </p>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {phase === 'complete' && finalResponse ? t.cetAi.announceCetAiReady : ''}
        </div>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isProcessing ? `${t.cetAi.processing} · ${phase}` : ''}
        </div>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {copiedTranscript ? t.cetAi.copyTranscriptAnnounce : ''}
        </div>
        {/* Modal header */}
        <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 bg-black/60 backdrop-blur-md">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
              {t.cetAi.title}
            </h2>
            <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">
              {t.cetAi.subtitle}
            </p>
            {phase === 'complete' && finalResponse && (
              <span
                role="status"
                className={`inline-block mt-2 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${
                  responseUsedLiveApi
                    ? 'border-green-500/40 text-green-400 bg-green-500/10'
                    : 'border-amber-500/40 text-amber-200/90 bg-amber-500/10'
                }`}
              >
                {responseUsedLiveApi ? t.cetAi.sourceBadgeLive : t.cetAi.sourceBadgeLocal}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
            <span className="hidden sm:inline text-gray-600 text-xs">×</span>
            <span className="hidden sm:inline text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
            {isProcessing && (
              <button
                type="button"
                onClick={handleStopGeneration}
                aria-label={t.cetAi.stopGenerating}
                className="inline-flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg border border-red-500/45 text-red-300 hover:bg-red-500/10 transition-colors touch-manipulation"
              >
                <StopCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">{t.cetAi.stopGenerating}</span>
              </button>
            )}
            {chatHistory.length > 0 && (
              <button
                onClick={() => setChatHistory([])}
                aria-label={t.cetAi.clearChatAria}
                title={t.cetAi.clearChatTitle}
                className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPinned((v) => !v)}
              aria-label="Pins"
              title="Pins"
              className="p-2 rounded-lg text-gray-600 hover:text-yellow-300 hover:bg-gray-800 transition-all duration-200"
            >
              <Pin className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
              title="Settings"
              className="p-2 rounded-lg text-gray-600 hover:text-cyan-300 hover:bg-gray-800 transition-all duration-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              aria-label="Attach"
              title="Attach"
              className="p-2 rounded-lg text-gray-600 hover:text-blue-300 hover:bg-gray-800 transition-all duration-200"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={exportHistoryJson}
              aria-label="Export"
              title="Export"
              className="p-2 rounded-lg text-gray-600 hover:text-green-300 hover:bg-gray-800 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
            </button>
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              onChange={handleAttachmentInputChange}
              className="hidden"
            />
            <button
              onClick={handleClose}
              aria-label={t.cetAi.closeCetAiAria}
              className="ml-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable conversation area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="max-w-5xl mx-auto space-y-10">

            {showSettings && (
              <div className="rounded-2xl border border-gray-800/90 bg-black/30 px-4 py-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    Model
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="auto">Auto</option>
                      <option value="grok">Grok</option>
                      <option value="gemini">Gemini</option>
                      <option value="claude">Claude</option>
                    </select>
                  </label>
                  <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    Tone
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="brand">Brand</option>
                      <option value="neutral">Neutral</option>
                      <option value="fun">Fun</option>
                    </select>
                  </label>
                  <label className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    Mode
                    <select
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value)}
                      className="mt-1 block bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    >
                      <option value="default">Default</option>
                      <option value="read">Read</option>
                      <option value="eli5">ELI5</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setReadingMode((v) => !v)}
                    className={`min-h-9 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      readingMode
                        ? 'border-yellow-500/40 text-yellow-200 bg-yellow-500/10'
                        : 'border-gray-700 text-gray-300 bg-gray-950'
                    }`}
                  >
                    Reading mode
                  </button>
                  <button
                    type="button"
                    onClick={exportHistoryMarkdown}
                    className="min-h-9 px-3 rounded-lg border border-gray-700 bg-gray-950 text-gray-300 text-xs font-semibold hover:border-green-500/40 hover:text-green-300 transition-colors"
                  >
                    Export MD
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                    Custom instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value.slice(0, 1200))}
                    rows={3}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-500"
                    placeholder="Ex: răspunde scurt, cu pași numerotați; evită marketingul."
                  />
                </div>
                <div>
                  <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-2">Attachments</p>
                  {attachments.length === 0 ? (
                    <p className="text-xs text-gray-500">No attachments.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((a) => (
                        <div
                          key={a.id}
                          className="inline-flex items-center gap-2 min-h-9 px-3 rounded-full bg-gray-950 border border-gray-700 text-gray-300 text-xs"
                        >
                          {a.url ? (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-yellow-300"
                              title={`${a.filename} (${a.mimeType})`}
                            >
                              {a.filename}
                            </a>
                          ) : (
                            <span title={`${a.filename} (${a.mimeType})`}>{a.filename}</span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                (Array.isArray(prev) ? prev : []).filter((x) => x.id !== a.id),
                              )
                            }
                            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-200"
                            aria-label="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {recentSearches.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-2">Recent</p>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 8).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            setQuery(q);
                            setShowSettings(false);
                            setTimeout(() => processQuestion(q, chatHistory), 50);
                          }}
                          className="inline-flex items-center gap-1 min-h-9 px-3 rounded-full bg-gray-950 border border-gray-700 text-gray-300 text-xs hover:border-yellow-500/50 hover:text-yellow-300 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {showPinned && (
              <div className="rounded-2xl border border-gray-800/90 bg-black/30 px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Pins</p>
                  <button
                    type="button"
                    onClick={() => setShowPinned(false)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Close
                  </button>
                </div>
                {pinnedEntries.length === 0 ? (
                  <p className="text-sm text-gray-500">No pinned answers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {pinnedEntries.slice(0, 50).map((p) => (
                      <div key={p.id ?? p.question} className="rounded-xl border border-gray-800 bg-black/20 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">{p.question}</p>
                            <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{p.answer.slice(0, 260)}{p.answer.length > 260 ? '…' : ''}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePinEntry(p)}
                            className="p-2 rounded-lg text-gray-500 hover:text-yellow-300 hover:bg-gray-800"
                            aria-label="Unpin"
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Chat history (previous Q&As) ── */}
            {chatHistory.map((entry, i) => (
              <div key={entry.id ?? i} className="space-y-4 opacity-50">
                {/* User bubble */}
                <div className="flex justify-end">
                  <div className="bg-gray-900 border border-gray-700 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                    <p className="text-gray-300 text-sm">{entry.question}</p>
                  </div>
                </div>
                {/* CET AI bubble */}
                <div className="flex justify-start">
                  <div className="bg-green-950/40 border border-green-500/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-2xl w-full">
                    <p className="text-green-400 text-xs font-mono mb-2 uppercase tracking-widest">
                      {t.cetAi.cetAiResponse} · {entry.confidence.toFixed(1)}% {t.cetAi.confidence}
                    </p>
                    <div className="text-white">
                      <MarkdownText
                        text={entry.answer}
                        copyCodeLabel={t.cetAi.copyCodeAria}
                        codeCopiedAnnounce={t.cetAi.codeCopiedAnnounce}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ── Current session ── */}
            {submittedQuestion && (
              <div className="space-y-6">
                {/* Current user question bubble */}
                <div className="flex justify-end">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl">
                    <p className="text-yellow-200 text-sm whitespace-pre-wrap">{submittedQuestion}</p>
                  </div>
                </div>

                {aiState === 'loading' ? (
                  <div className="space-y-3">
                    <AiResultSkeleton label={t.cetAi.processing} />
                    <CetAiTypingIndicator label={t.cetAi.processing} />
                  </div>
                ) : null}

                {/* Answer-first (Claude-style): show response as soon as it is ready */}
                {finalResponse && (
                  <div className="flex justify-start motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:slide-in-from-bottom-2">
                    <div className="bg-gradient-to-br from-green-950/80 to-black border border-green-500/30 rounded-2xl rounded-tl-sm p-5 md:p-6 w-full">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-yellow-400" aria-hidden />
                          </div>
                          <p className="text-green-400 text-xs font-mono font-bold uppercase tracking-widest">
                            {t.cetAi.cetAiResponse} · {t.cetAi.confidence} {cetAiConfidence.toFixed(1)}%
                            {currentModelUsed ? ` · ${currentModelUsed}` : ''}
                            {currentUsedCache ? ' · cache' : ''}
                            {finalResponse ? ` · ~${estimateReadMinutes(finalResponse)} min` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <div className="h-1.5 w-28 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-1000"
                              style={{ width: `${cetAiConfidence}%` }}
                            />
                          </div>
                          <button
                            type="button"
                            aria-label={t.cetAi.copyResponseAria}
                            onClick={() => {
                              navigator.clipboard.writeText(finalResponse).then(() => {
                                setCopiedResponse(true);
                                setTimeout(() => setCopiedResponse(false), 2000);
                                trackEvent('ai_copy', { kind: 'response' });
                              }).catch(() => {});
                            }}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/40 transition-all"
                          >
                            {copiedResponse ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            title={t.cetAi.copyForAiTooltip}
                            aria-label={t.cetAi.copyForAiAriaLabel}
                            onClick={() => {
                              const payload = buildCopyForAiText(submittedQuestion, finalResponse, t.cetAi);
                              navigator.clipboard.writeText(payload).then(() => {
                                setCopiedForAi(true);
                                setTimeout(() => setCopiedForAi(false), 2000);
                                trackEvent('ai_copy', { kind: 'for_ai' });
                              }).catch(() => {});
                            }}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                          >
                            {copiedForAi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Bot className="w-3.5 h-3.5" />}
                          </button>
                          {chatHistory.length > 0 ? (
                            <button
                              type="button"
                              data-testid="cet-ai-copy-transcript"
                              title={t.cetAi.copyTranscriptTitle}
                              aria-label={t.cetAi.copyTranscriptAria}
                              onClick={() => {
                                const payload = buildFullConversationHandoff(
                                  chatHistory,
                                  submittedQuestion,
                                  finalResponse,
                                  t.cetAi,
                                );
                                navigator.clipboard
                                  .writeText(payload)
                                  .then(() => {
                                    setCopiedTranscript(true);
                                    setTimeout(() => setCopiedTranscript(false), 2000);
                                    trackEvent('ai_copy', { kind: 'transcript' });
                                  })
                                  .catch(() => {});
                              }}
                              className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-violet-300 hover:border-violet-500/40 transition-all"
                            >
                              {copiedTranscript ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <ClipboardList className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            title={t.cetAi.regenerateTitle}
                            aria-label={t.cetAi.regenerateAria}
                            onClick={handleRegenerate}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-amber-300 hover:border-amber-500/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Pin"
                            title="Pin"
                            onClick={() => {
                              if (!submittedQuestion || !finalResponse) return;
                              togglePinEntry({
                                id: `${Date.now().toString(36)}-pin`,
                                question: submittedQuestion,
                                answer: finalResponse,
                                confidence: cetAiConfidence,
                                createdAt: Date.now(),
                                modelUsed: currentModelUsed ?? undefined,
                                sources: responseSources,
                                alternates: currentAlternates.length > 0 ? currentAlternates : undefined,
                                pinned: true,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-yellow-300 hover:border-yellow-500/40 transition-all"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Text to speech"
                            title="Text to speech"
                            onClick={() => (isSpeaking ? stopSpeaking() : speakAnswer(finalResponse))}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all"
                          >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            aria-label="Thumbs up"
                            title="Thumbs up"
                            onClick={() => void rateCurrentAnswer(1)}
                            disabled={sendingFeedback || currentFeedback === 1}
                            className={`p-1.5 rounded-lg bg-gray-900 border text-gray-400 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                              currentFeedback === 1 ? 'border-green-500/40 text-green-300' : 'border-gray-700 hover:text-green-300 hover:border-green-500/40'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Thumbs down"
                            title="Thumbs down"
                            onClick={() => void rateCurrentAnswer(-1)}
                            disabled={sendingFeedback || currentFeedback === -1}
                            className={`p-1.5 rounded-lg bg-gray-900 border text-gray-400 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                              currentFeedback === -1 ? 'border-red-500/40 text-red-300' : 'border-gray-700 hover:text-red-300 hover:border-red-500/40'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Report"
                            title="Report"
                            onClick={reportCurrentAnswer}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-red-300 hover:border-red-500/40 transition-all"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={TONSCAN_CET_CONTRACT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t.cetAi.verifyOnTonscanTitle}
                            className="p-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      {!responseUsedLiveApi && (
                        <div
                          role="status"
                          className="text-amber-200/90 text-xs border border-amber-500/25 bg-amber-500/10 rounded-lg px-3 py-2 mb-4 space-y-2"
                        >
                          <p className="font-mono leading-relaxed">
                            {liveApiReturnedError ? t.cetAi.liveApiErrorFallback : t.cetAi.offlineModeHint}
                          </p>
                          {liveApiReturnedError && liveApiHttpHint ? (
                            <p className="font-mono text-[11px] text-amber-100/85 leading-relaxed">
                              {liveApiHttpHint}
                            </p>
                          ) : null}
                          {liveApiReturnedError && liveApiErrorDetail ? (
                            <p className="font-mono text-[11px] text-amber-100/80 leading-relaxed break-words">
                              <span className="text-amber-200/70">{t.cetAi.liveApiErrorDetailLabel}</span>{' '}
                              {liveApiErrorDetail}
                            </p>
                          ) : null}
                        </div>
                      )}
                      <div
                        className={
                          readingMode
                            ? 'text-white text-[15px] leading-7 tracking-[0.01em]'
                            : 'text-white'
                        }
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        onClick={() => {
                          if (typingDone) return;
                          const isHtml = /<\/?[^>]+>/.test(finalResponse);
                          const plain = isHtml
                            ? DOMPurify.sanitize(finalResponse.replace(/<br\s*\/?\s*>/gi, '\n'), { ALLOWED_TAGS: [] })
                            : finalResponse;
                          setTypedResponse(plain);
                          setTypingDone(true);
                        }}
                      >
                        {!typingDone ? (
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                            {typedResponse}
                            <span className="ml-0.5 inline-block w-[0.6ch] text-yellow-300 motion-safe:animate-pulse">▍</span>
                          </pre>
                        ) : /<\/?[^>]+>/.test(finalResponse) ? (
                          <SafeHtml
                            html={finalResponse.replace(/\n/g, '<br/>')}
                            config={CET_AI_SAFE_HTML_CONFIG}
                          />
                        ) : (
                          <MarkdownText
                            text={finalResponse}
                            copyCodeLabel={t.cetAi.copyCodeAria}
                            codeCopiedAnnounce={t.cetAi.codeCopiedAnnounce}
                          />
                        )}
                      </div>
                      {responseSources.length > 0 ? (
                        <div
                          data-testid="cet-ai-sources"
                          className="mt-5 rounded-xl border border-gray-800/90 bg-black/25 px-4 py-3"
                        >
                          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-2">
                            {t.cetAi.sourcesLabel}
                          </p>
                          <ul className="space-y-1">
                            {responseSources.map((s) => (
                              <li key={s.id} className="flex items-start gap-2">
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid="cet-ai-source-link"
                                  className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-cyan-300 transition-colors break-all"
                                  title={s.title}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                                  <span className="font-mono">{s.title}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div className="mt-5 pt-4 border-t border-green-500/10">
                        <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest mb-2">{t.cetAi.askNextLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {(FOLLOW_UP_BY_TOPIC[detectedTopic] ?? FOLLOW_UP_BY_TOPIC.default).map(suggestion => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                const nextHistory = [
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
                                ];
                                setChatHistory(nextHistory);
                                processQuestion(suggestion, nextHistory);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-xs hover:border-yellow-500/50 hover:text-yellow-400 transition-all active:scale-95"
                            >
                              <ChevronRight className="w-3 h-3" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <details
                  data-testid="cet-ai-trace"
                  className="group rounded-2xl border border-gray-800/90 bg-black/30 open:bg-black/40"
                  open={isProcessing}
                >
                  <summary className="cursor-pointer px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider hover:text-gray-400 list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    <span>{t.cetAi.ravTraceToggle}</span>
                    <span className="text-[10px] text-gray-600 group-open:rotate-0 transition-transform">▼</span>
                  </summary>
                  <div className="border-t border-gray-800/80 px-3 pb-4 pt-2 space-y-4">
                <ReActPanels phase={phase} />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Telemetry terminal */}
                  <div className="lg:col-span-3 bg-gray-950 border border-gray-800 rounded-xl p-3 md:p-4 font-mono text-xs overflow-hidden flex flex-col h-40 md:h-56 shadow-inner">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800 text-gray-500">
                      <span>&gt;_ RAV_TERMINAL · Grok × Gemini v3.0</span>
                      <span className={isProcessing ? 'text-yellow-500 motion-safe:animate-pulse' : 'text-green-500'}>
                        {isProcessing ? t.cetAi.processing : `● ${t.cetAi.done}`}
                      </span>
                    </div>
                    <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 pr-1">
                      {logs.map(log => {
                        const isSkillLine =
                          log.message.startsWith('RAV_BURST:') ||
                          log.message.startsWith('INPUT_MESH:') ||
                          log.message.startsWith('CONTEXT_MESH:') ||
                          log.message.startsWith('TASK_MESH:') ||
                          log.message.startsWith('AGENT_POOL_MESH:') ||
                          log.message.startsWith('TEAM_AGENT_MESH:') ||
                          log.message.startsWith('SKILL_LOCUS:') ||
                          log.message.startsWith('EXPRESSOME_BURST:') ||
                          log.message.startsWith('DEEP_LATTICE:') ||
                          log.message.startsWith('MESH_SEAL:') ||
                          log.message.startsWith('FLASH_GLINT:') ||
                          log.message.startsWith('ROUTE_MESH:') ||
                          log.message.startsWith('CROSS_MESH:') ||
                          log.message.startsWith('CONSENSUS_BURST:') ||
                          log.message.startsWith('VALIDATE_MESH:') ||
                          log.message.startsWith('ACT_MESH:') ||
                          log.message.startsWith('PARSE_MESH:') ||
                          log.message.startsWith('SESSION_MESH:') ||
                          log.message.startsWith('LOOP_COMPLETE_BURST:');
                        return (
                          <div
                            key={log.id}
                            className={`flex gap-3 p-0.5 rounded ${
                              isSkillLine
                                ? 'bg-fuchsia-950/25 hover:bg-fuchsia-950/35 border border-fuchsia-500/15'
                                : 'hover:bg-gray-900/50'
                            }`}
                          >
                            <span className="text-gray-600 min-w-[88px] shrink-0">[{log.timestamp}]</span>
                            <span
                              className={`min-w-[68px] font-bold shrink-0 ${
                                isSkillLine
                                  ? 'text-fuchsia-400'
                                  : log.type === 'INFO'
                                    ? 'text-blue-400'
                                    : log.type === 'WARN'
                                      ? 'text-yellow-400'
                                      : log.type === 'SEC'
                                        ? 'text-green-400'
                                        : 'text-purple-400'
                              }`}
                            >
                              [{isSkillLine ? 'SKILL' : log.type}]
                            </span>
                            <span
                              className={`break-all ${
                                isSkillLine
                                  ? 'text-fuchsia-200/90 drop-shadow-[0_0_8px_rgba(217,70,239,0.12)]'
                                  : 'text-gray-300'
                              }`}
                            >
                              {log.message}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live metrics */}
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col justify-between h-40 md:h-56">
                    <h4 className="text-gray-500 font-mono text-xs mb-3 border-b border-gray-800 pb-2">
                      SYS_METRICS
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Logic Confidence</div>
                        <div className="flex items-end gap-1">
                          <span className={`text-2xl font-bold tabular-nums ${metrics.confidence > 90 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {metrics.confidence.toFixed(1)}
                          </span>
                          <span className="text-gray-500 mb-0.5 text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Network Latency</div>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold text-blue-400 tabular-nums">{metrics.latency}</span>
                          <span className="text-gray-500 mb-0.5 text-sm">ms</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Est. Action Cost</div>
                        <div className="flex items-end gap-1">
                          <span className="text-xl font-bold text-yellow-500 tabular-nums">{metrics.cetCost.toFixed(4)}</span>
                          <span className="text-gray-500 mb-0.5 text-xs">CET</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </details>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ── Follow-up input (sticky bottom) ── */}
        <div className="shrink-0 border-t border-gray-800 bg-black/80 backdrop-blur-md px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-8 md:pb-4">
          <form
            onSubmit={handleModalSubmit}
            className="flex gap-3 max-w-5xl mx-auto"
          >
            <div className="flex-grow relative">
              <label htmlFor="cet-ai-modal-query" className="sr-only">
                {t.cetAi.placeholder}
              </label>
              <textarea
                ref={modalInputRef}
                id="cet-ai-modal-query"
                data-testid="cet-ai-modal-query"
                value={query}
                maxLength={CET_AI_MAX_QUERY_CHARS}
                onChange={e => setQuery(e.target.value.slice(0, CET_AI_MAX_QUERY_CHARS))}
                onKeyDown={e =>
                  handleComposerEnterKeyDown(e, {
                    isProcessing,
                    hasText: Boolean(query.trim()),
                  })
                }
                disabled={isProcessing}
                rows={2}
                placeholder={phase === 'complete' ? t.cetAi.followUpPlaceholder : t.cetAi.placeholder}
                aria-label={t.cetAi.placeholder}
                aria-describedby={query.length > 0 ? 'cet-ai-modal-char-count' : undefined}
                className="w-full min-h-[3rem] max-h-40 resize-y px-5 py-3 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all disabled:opacity-40 text-base leading-relaxed"
              />
              <CetAiQueryCharCountLine
                id="cet-ai-modal-char-count"
                length={query.length}
                max={CET_AI_MAX_QUERY_CHARS}
                ariaTemplate={t.cetAi.queryCharCountAria}
              />
              {isProcessing && (
                <div className="absolute right-4 top-4">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full motion-safe:animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              aria-label={t.cetAi.sendQuestionAria}
              className="min-h-11 min-w-11 px-5 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t.cetAi.sendCompact}</span>
            </button>
            <button
              type="button"
              onClick={toggleListening}
              disabled={isProcessing}
              aria-label="Voice input"
              className={`min-h-11 min-w-11 px-4 py-3 rounded-xl border transition-all flex items-center justify-center touch-manipulation ${
                isListening
                  ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10 motion-safe:animate-pulse'
                  : 'border-gray-700 text-gray-400 bg-gray-950 hover:border-cyan-500/40 hover:text-cyan-300'
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-gray-600 text-[11px] mt-2 font-mono max-w-lg mx-auto leading-snug">
            {t.cetAi.sendHintModEnter}
          </p>
          <p className="text-center text-gray-700 text-xs mt-1 font-mono">
            {t.cetAi.escToClose}
          </p>
        </div>
        </FullscreenDialogContent>
    </Dialog>
  );
}
