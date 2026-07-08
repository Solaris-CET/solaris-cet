import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader2, Square } from 'lucide-react';

import { useLanguage } from '@/hooks/useLanguage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

async function streamAssistantReply(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (content: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let content = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      const remaining = decoder.decode();
      if (remaining) {
        content += remaining;
        onUpdate(content);
      }
      return;
    }
    content += decoder.decode(value, { stream: true });
    onUpdate(content);
  }
}

const QUICK_BUTTONS = [
  { label: '💰 Preturi', message: 'Care sunt preturile pentru panouri fotovoltaice?' },
  { label: '🏠 Finantari', message: 'Ce optiuni de finantare aveti?' },
  { label: '📞 Contact', message: 'Care sunt datele de contact?' },
  { label: '📋 Oferta', message: 'As dori o oferta personalizata.' },
];

export default function ChatWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bună! Sunt asistentul virtual Solaris CET. Cu ce te pot ajuta? Întreabă-mă despre panouri fotovoltaice, finanțări sau serviciile noastre.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function stopGeneration() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handleQuickButtonClick(quickMessage: string) {
    if (isLoading) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: quickMessage,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Eroare la comunicarea cu serverul. Încearcă din nou.');
        return;
      }

      const reader = response.body.getReader();
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      await streamAssistantReply(reader, (content) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content } : m)),
        );
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('A apărut o eroare neașteptată. Încearcă din nou.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Eroare la comunicarea cu serverul. Încearcă din nou.');
        return;
      }

      const reader = response.body.getReader();
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      await streamAssistantReply(reader, (content) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content } : m)),
        );
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('A apărut o eroare neașteptată. Încearcă din nou.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg flex items-center justify-center transition-all hover:scale-110"
          aria-label="Deschide chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                <MessageCircle size={18} className="text-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Asistent Solaris CET</h3>
                <p className="text-xs text-slate-400">AI • Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
                  aria-label="Oprește generarea"
                >
                  <Square className="w-3 h-3 fill-current" />
                  Stop
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Închide chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isLoading ? t.cetAi.processing : error ? `${t.cetAi.liveApiErrorDetailLabel} ${error}` : ''}
          </div>

          {/* Quick buttons */}
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-700 bg-slate-800">
            {QUICK_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleQuickButtonClick(btn.message)}
                disabled={isLoading}
                className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-900 rounded-br-md'
                      : 'bg-slate-700 text-slate-200 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 bg-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="flex-1 bg-slate-700 text-white text-sm px-4 py-2 rounded-xl border border-slate-600 focus:border-amber-500 focus:outline-none placeholder:text-slate-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 px-3 py-2 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
