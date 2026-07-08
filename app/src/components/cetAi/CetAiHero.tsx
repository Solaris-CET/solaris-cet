import { Sparkles } from 'lucide-react';
import React from 'react';

import { CetAiQueryCharCountLine } from '@/components/cetAi/CetAiQueryCharCountLine';
import { CET_AI_MAX_QUERY_CHARS } from '@/lib/cetAiConstants';
import { handleComposerEnterKeyDown } from '@/lib/cetAiHelpers';
import type { UseCetAiSearchReturn } from '@/hooks/useCetAiSearch';

export function CetAiHero({ controller }: { controller: UseCetAiSearchReturn }) {
  const {
    t,
    query,
    setQuery,
    isModalOpen,
    setIsModalOpen,
    actions: { handleHeroSubmit, processQuestion },
    derived: { isProcessing },
  } = controller;

  return (
    <div
      data-testid="cet-ai-hero"
      className="w-full max-w-5xl mx-auto scroll-mt-24 bg-black border border-gray-800 rounded-3xl p-4 md:p-8 shadow-2xl font-sans relative overflow-hidden z-20"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-widest">
          {t.cetAi.title}
        </h2>
        <p className="text-gray-400 text-xs md:text-sm mt-1 tracking-widest uppercase">
          {t.cetAi.subtitle}
        </p>
        <p
          role="note"
          className="text-gray-500 text-[10px] sm:text-xs mt-3 max-w-2xl mx-auto text-center leading-relaxed px-1"
        >
          {t.cetAi.heroCapabilityNote}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-blue-400">Gemini REASON</span>
          <span className="text-gray-600 text-xs">×</span>
          <span className="text-xs font-mono bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-purple-400">Grok ACT</span>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleHeroSubmit}
        className="relative z-10 flex flex-col md:flex-row w-full gap-3 md:gap-4"
      >
        <div className="flex-grow relative">
          <label htmlFor="cet-ai-hero-query" className="sr-only">
            {t.cetAi.placeholder}
          </label>
          <input
            id="cet-ai-hero-query"
            type="text"
            data-testid="cet-ai-hero-query"
            value={query}
            maxLength={CET_AI_MAX_QUERY_CHARS}
            onChange={e => setQuery(e.target.value.slice(0, CET_AI_MAX_QUERY_CHARS))}
            onKeyDown={e =>
              handleComposerEnterKeyDown(e, {
                isProcessing,
                hasText: Boolean(query.trim()),
              })
            }
            disabled={isModalOpen}
            placeholder={t.cetAi.placeholder}
            aria-label={t.cetAi.placeholder}
            aria-describedby={
              query.length > 0 && !isModalOpen ? 'cet-ai-hero-char-count' : undefined
            }
            className="w-full min-h-11 px-4 md:px-6 py-3 md:py-4 bg-gray-950 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-base md:text-base disabled:opacity-40"
          />
          {!isModalOpen ? (
            <CetAiQueryCharCountLine
              id="cet-ai-hero-char-count"
              length={query.length}
              max={CET_AI_MAX_QUERY_CHARS}
              ariaTemplate={t.cetAi.queryCharCountAria}
            />
          ) : null}
        </div>
        <button
          type="submit"
          className="min-h-11 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.2)] whitespace-nowrap text-sm md:text-base touch-manipulation"
        >
          {t.cetAi.sendButton}
        </button>
      </form>

      {/* Suggested questions chips */}
      <div className="mt-4 flex flex-wrap gap-2 scroll-mt-28">
        {t.cetAi.suggestedQuestions.slice(0, 4).map(q => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setQuery(q);
              setIsModalOpen(true);
              setTimeout(() => processQuestion(q, []), 50);
              setQuery('');
            }}
            className="inline-flex items-center gap-1.5 min-h-11 min-w-[44px] px-3 py-2 rounded-full bg-gray-900 border border-gray-700 text-gray-400 text-xs hover:border-yellow-500/50 hover:text-yellow-400 transition-all active:scale-95 touch-manipulation"
          >
            <Sparkles className="w-3 h-3" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
