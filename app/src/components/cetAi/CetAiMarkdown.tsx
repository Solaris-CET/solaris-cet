import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';

import { parseFencedCodeBlocks, tryParsePipeTable } from '@/lib/cetAiMarkdown';

function MarkdownBodyChunk({ text }: { text: string }) {
  const renderInline = (raw: string): React.ReactNode => {
    let key = 0;
    const parts: React.ReactNode[] = [];

    const pushPlain = (s: string) => {
      if (!s) return;
      const linkRe = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<]+))/g;
      let li = 0;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(s)) !== null) {
        if (m.index > li) parts.push(<span key={key++}>{s.slice(li, m.index)}</span>);
        const href = m[2] ? m[3] : m[4];
        const label = m[2] ? m[2] : (m[4] ?? '');
        if (href) {
          parts.push(
            <a
              key={key++}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 break-all"
            >
              {label}
            </a>,
          );
        }
        li = m.index + m[0].length;
      }
      if (li < s.length) parts.push(<span key={key++}>{s.slice(li)}</span>);
    };

    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(raw)) !== null) {
      if (match.index > lastIndex) pushPlain(raw.slice(lastIndex, match.index));
      if (match[2]) {
        parts.push(<strong key={key++} className="text-yellow-300 font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={key++} className="text-gray-300 italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(<code key={key++} className="bg-gray-800 text-yellow-400 px-1.5 py-0.5 rounded text-xs font-mono break-all">{match[4]}</code>);
      }
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < raw.length) pushPlain(raw.slice(lastIndex));
    return <>{parts}</>;
  };

  const renderLine = (line: string, key: number) => {
    const trimmed = line.trim();
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={key} className="my-4 border-white/10" />;
    }
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      return (
        <h2
          key={key}
          className="text-yellow-100 font-bold text-lg md:text-xl tracking-tight mt-4 mb-2"
        >
          {renderInline(h1[1])}
        </h2>
      );
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      return (
        <h3
          key={key}
          className="text-yellow-200/95 font-bold text-base md:text-lg tracking-tight mt-4 mb-2 border-b border-yellow-500/25 pb-1"
        >
          {renderInline(h2[1])}
        </h3>
      );
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      return (
        <h4 key={key} className="text-yellow-200/95 font-bold text-sm md:text-base tracking-tight mt-3 mb-1 border-b border-yellow-500/20 pb-1">
          {renderInline(h3[1])}
        </h4>
      );
    }
    const bq = line.match(/^\s*>\s?(.*)$/);
    if (bq && /^\s*>/.test(line)) {
      return (
        <blockquote
          key={key}
          className="border-l-2 border-yellow-500/35 pl-3 my-1.5 text-gray-300 leading-relaxed"
        >
          {renderInline(bq[1])}
        </blockquote>
      );
    }
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 font-bold shrink-0 min-w-[1.2em]">{numberedMatch[1]}.</span>
          <span>{renderInline(numberedMatch[2])}</span>
        </li>
      );
    }
    if (line.startsWith('- ✅')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">✅</span>
          <span>{renderInline(line.replace(/^-\s*✅\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- 🔄')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">🔄</span>
          <span>{renderInline(line.replace(/^-\s*🔄\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- 🔮')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="shrink-0">🔮</span>
          <span>{renderInline(line.replace(/^-\s*🔮\s*/, ''))}</span>
        </li>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={key} className="flex gap-2 items-start">
          <span className="text-yellow-500 mt-1.5 shrink-0">▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    }
    return <p key={key} className="leading-relaxed">{renderInline(line)}</p>;
  };

  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {paragraphs.map((para, pi) => {
        const lines = para.split('\n').filter(l => l.trim() !== '');
        const tableParsed = tryParsePipeTable(lines);
        if (tableParsed) {
          return (
            <div key={pi} className="my-3 overflow-x-auto rounded-lg">
              <table className="min-w-full text-xs border-collapse border border-white/10">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {tableParsed.headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="border border-white/10 px-2 py-2 text-left font-mono text-yellow-200/90 align-top"
                      >
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableParsed.rows.map((row, ri) => (
                    <tr key={ri} className="odd:bg-white/[0.02]">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="border border-white/10 px-2 py-1.5 text-gray-300 align-top"
                        >
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.length > 0 && lines.every(l => /^\s*>/.test(l))) {
          const inner = lines.map(l => l.replace(/^\s*>\s?/, ''));
          return (
            <blockquote
              key={pi}
              className="border-l-2 border-yellow-500/40 pl-3 my-2 text-gray-300 space-y-1.5"
            >
              {inner.map((line, li) => (
                <p key={li} className="leading-relaxed">
                  {renderInline(line)}
                </p>
              ))}
            </blockquote>
          );
        }
        const hasList = lines.some(
          l => l.startsWith('- ') || l.startsWith('• ') || /^\d+\.\s/.test(l)
        );
        if (hasList) {
          return (
            <ul key={pi} className="space-y-1.5 pl-1">
              {lines.map((line, li) => renderLine(line, li))}
            </ul>
          );
        }
        return (
          <React.Fragment key={pi}>
            {lines.map((line, li) => renderLine(line, li))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FencedCodeBlock({
  content,
  copyLabel,
  copiedAnnounce,
  lang,
}: {
  content: string;
  copyLabel: string;
  copiedAnnounce: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);
  const langLabel = lang?.trim();
  return (
    <div className="relative rounded-xl border border-white/10 bg-black/60">
      <span className="sr-only" aria-live="polite">
        {copied ? copiedAnnounce : ''}
      </span>
      {langLabel ? (
        <span
          className="absolute top-2 left-3 z-[1] max-w-[min(50%,12rem)] truncate text-[10px] font-mono uppercase tracking-wider text-gray-500"
          title={langLabel}
        >
          {langLabel}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={copyLabel}
        title={copyLabel}
        onClick={() => {
          void navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => {});
        }}
        className="absolute top-2 right-2 z-[1] inline-flex items-center justify-center p-1.5 rounded-lg bg-gray-900/95 border border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/35 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 pt-11 text-xs text-slate-200 font-mono leading-relaxed">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function MarkdownText({
  text,
  copyCodeLabel,
  codeCopiedAnnounce,
}: {
  text: string;
  copyCodeLabel: string;
  codeCopiedAnnounce: string;
}) {
  const segments = parseFencedCodeBlocks(text);
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <FencedCodeBlock
            key={i}
            content={seg.content}
            copyLabel={copyCodeLabel}
            copiedAnnounce={codeCopiedAnnounce}
            lang={seg.lang}
          />
        ) : (
          <MarkdownBodyChunk key={i} text={seg.content} />
        ),
      )}
    </div>
  );
}

export { MarkdownBodyChunk, FencedCodeBlock, MarkdownText };
