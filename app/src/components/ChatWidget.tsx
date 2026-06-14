import React, { useState, useRef, useEffect, useCallback } from 'react';

type Message = {
  role: 'user' | 'assistant' | 'error';
  content: string;
};

const QUICK_BUTTONS = [
  { label: '💰 Prețuri', message: 'Care sunt prețurile pentru panouri fotovoltaice?' },
  { label: '🏠 Finanțări', message: 'Ce opțiuni de finanțare aveți?' },
  { label: '📞 Contact', message: 'Care sunt datele de contact?' },
  { label: '📋 Ofertă', message: 'Aș dori o ofertă personalizată.' },
];

function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role === 'error' ? 'assistant' : m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.content || 'Momentan asistentul AI nu este disponibil. Pentru ofertă rapidă, sună la +40 769 889 721 sau scrie pe solaris-cet@protonmail.com';
        setMessages((prev) => [...prev, { role: 'error', content: errMsg }]);
        setIsTyping(false);
        return;
      }

      // Try to parse as JSON (non-streaming fallback)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const content = data?.content || '';
        if (content) {
          setMessages((prev) => [...prev, { role: 'assistant', content }]);
        }
        setIsTyping(false);
        return;
      }

      // Streaming response
      const reader = res.body?.getReader();
      if (!reader) {
        setMessages((prev) => [
          ...prev,
          { role: 'error', content: 'Eroare la conectare. Încearcă din nou.' },
        ]);
        setIsTyping(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'assistant') {
                    return [...prev.slice(0, -1), { role: 'assistant', content: fullContent }];
                  }
                  return [...prev, { role: 'assistant', content: fullContent }];
                });
              }
              if (parsed.error) {
                setMessages((prev) => [
                  ...prev,
                  { role: 'error', content: parsed.error },
                ]);
              }
            } catch {
              // ignore parse errors
            }
          } else if (line.startsWith('event: error')) {
            setMessages((prev) => [
              ...prev,
              { role: 'error', content: 'Eroare la procesarea răspunsului.' },
            ]);
          }
        }
      }
    } catch (err) {
      console.error('Chat fetch error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: 'Momentan asistentul AI nu e disponibil. Pentru ofertă rapidă, sună la +40 769 889 721 sau scrie pe solaris-cet@protonmail.com' },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickButton = (msg: string) => {
    sendMessage(msg);
  };

  // Helper to render clickable links in message content
  const renderContent = (content: string) => {
    // Replace phone numbers and emails with clickable links
    const phoneRegex = /(\+40\s?\d{3}\s?\d{3}\s?\d{3})/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Combine both regex matches
    const combinedRegex = /(\+40\s?\d{3}\s?\d{3}\s?\d{3})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(content)) !== null) {
      const start = match.index;
      if (start > lastIndex) {
        parts.push(content.slice(lastIndex, start));
      }

      const matched = match[0];
      if (matched.includes('@')) {
        parts.push(
          <a
            key={start}
            href={`mailto:${matched}`}
            className="text-blue-400 underline hover:text-blue-300"
          >
            {matched}
          </a>
        );
      } else {
        // Phone number
        const cleanPhone = matched.replace(/\s/g, '');
        parts.push(
          <a
            key={start}
            href={`tel:${cleanPhone}`}
            className="text-blue-400 underline hover:text-blue-300"
          >
            {matched}
          </a>
        );
      }

      lastIndex = start + matched.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col w-80 max-h-[500px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <span className="text-white font-semibold text-sm">Solaris CET AI</span>
        <button
          onClick={() => setMessages([])}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      {/* Quick buttons */}
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-gray-700">
        {QUICK_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleQuickButton(btn.message)}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ maxHeight: '300px' }}>
        {messages.length === 0 && (
          <div className="text-gray-400 text-xs text-center py-4">
            Bună! Cu ce te pot ajuta?
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'text-right'
                : msg.role === 'error'
                ? 'text-left'
                : 'text-left'
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-lg max-w-[90%] break-words ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.role === 'error'
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {msg.role === 'error' ? (
                <span className="text-red-300">{renderContent(msg.content)}</span>
              ) : (
                renderContent(msg.content)
              )}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="text-left">
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-700 text-gray-400 text-sm animate-pulse">
              Asistentul scrie...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center border-t border-gray-700 px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie un mesaj..."
          className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-l-md border border-gray-600 focus:outline-none focus:border-blue-500"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={isTyping || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trimite
        </button>
      </form>
    </div>
  );
}

export default ChatWidget;
