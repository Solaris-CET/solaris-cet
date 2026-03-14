import { useState, useRef, useCallback, useEffect, forwardRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Sparkles, X, ExternalLink, Loader2 } from 'lucide-react';

const DEDUST_URL =
  'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB/deposit';

/**
 * POST target for AI queries. Falls back gracefully when the endpoint is
 * unavailable (e.g. static GitHub Pages deployments without a backend).
 */
const API_CHAT_URL = '/api/chat';

const FALLBACK_RESPONSE =
  `Analyzing your query through the Solaris ReAct Protocol…\n\n` +
  `Solaris CET operates at the intersection of high-intelligence AI and DeFi on ` +
  `the TON blockchain. With a fixed supply of just 9,000 CET and a 90-year mining ` +
  `horizon, every position is mathematically scarce. The BRAID Framework delivers ` +
  `verifiable AI decision loops, making Solaris the foundational substrate for ` +
  `next-generation autonomous agents.`;

interface AiOracleSearchProps {
  className?: string;
}

const AiOracleSearch = forwardRef<HTMLDivElement, AiOracleSearchProps>(
  ({ className = '' }, ref) => {
    const [query, setQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [responseText, setResponseText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = useCallback(async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;

      setLoading(true);
      setResponseText('');
      setModalOpen(true);

      try {
        const res = await fetch(API_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        });

        if (!res.ok) throw new Error('non-ok');

        const data = (await res.json()) as { response?: string; message?: string };
        setResponseText(data.response ?? data.message ?? '');
      } catch {
        setResponseText(FALLBACK_RESPONSE);
      } finally {
        setLoading(false);
      }
    }, []);

    const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') void handleSubmit(query);
    };

    // Close modal on Escape
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setModalOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
      <>
        {/* Oracle Search Input */}
        <div
          ref={ref}
          className={`oracle-search-wrapper${isTyping ? ' oracle-search-active' : ''} ${className}`}
        >
          <Sparkles className="oracle-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onBlur={() => setIsTyping(query.length > 0)}
            onFocus={() => setIsTyping(query.length > 0)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Solaris AI…"
            aria-label="Ask Solaris AI"
            className="oracle-search-input"
            disabled={loading}
          />
          {loading && (
            <Loader2
              className="oracle-search-loader animate-spin"
              aria-label="Loading response"
            />
          )}
        </div>

        {/* Response Modal */}
        {modalOpen && (
          <div
            className="oracle-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Solaris AI Response"
            onClick={() => setModalOpen(false)}
          >
            <div className="oracle-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="oracle-modal-header">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-solaris-gold" aria-hidden="true" />
                  <span className="font-mono text-xs text-solaris-gold tracking-widest uppercase">
                    Solaris AI Oracle
                  </span>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="oracle-modal-close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Query echo */}
              <p className="oracle-modal-query">"{query}"</p>

              {/* Response body */}
              <div className="oracle-modal-response">
                {loading ? (
                  <div className="flex items-center gap-3 text-solaris-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-solaris-gold" aria-hidden="true" />
                    <span className="text-sm animate-pulse">
                      Processing query through Solaris AI…
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-solaris-text/90 leading-relaxed whitespace-pre-wrap">
                    {responseText}
                  </p>
                )}
              </div>

              {/* RTA CTA */}
              {!loading && (
                <div className="oracle-modal-rta">
                  <div className="oracle-modal-rta-bar" />
                  <p className="text-xs text-solaris-gold/80 font-mono mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Verified Solaris Architecture. Supply: 9,000 CET.
                  </p>
                  <a
                    href={DEDUST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="oracle-rta-btn"
                  >
                    Secure your position
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  },
);

AiOracleSearch.displayName = 'AiOracleSearch';

export default AiOracleSearch;
