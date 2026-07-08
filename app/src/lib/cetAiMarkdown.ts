export function parseFencedCodeBlocks(text: string): Array<{ type: 'md' | 'code'; lang?: string; content: string }> {
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  const out: Array<{ type: 'md' | 'code'; lang?: string; content: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'md', content: text.slice(last, m.index) });
    }
    out.push({ type: 'code', lang: m[1] || undefined, content: (m[2] ?? '').replace(/\n$/, '') });
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ type: 'md', content: text.slice(last) });
  }
  if (out.length === 0) {
    out.push({ type: 'md', content: text });
  }
  return out;
}

export function isMarkdownTableSeparatorLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes('|') || !t.includes('-')) return false;
  return /^[\s|:-]+$/.test(t) && !/[0-9a-zA-Z]/.test(t);
}

export function splitMarkdownPipeRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return t.split('|').map((c) => c.trim());
}

export function tryParsePipeTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  if (!isMarkdownTableSeparatorLine(lines[1])) return null;
  const headers = splitMarkdownPipeRow(lines[0]);
  if (headers.length < 2) return null;
  const n = headers.length;
  const rows = lines.slice(2).map((row) => {
    const cells = splitMarkdownPipeRow(row);
    if (cells.length === n) return cells;
    const next = [...cells];
    while (next.length < n) next.push('');
    return next.slice(0, n);
  });
  return { headers, rows };
}
