export function extractFrontmatter(markdown: string): {
  data: Record<string, string | string[]>;
  content: string;
} {
  const input = typeof markdown === 'string' ? markdown : '';
  if (!input.startsWith('---\n') && !input.startsWith('---\r\n')) {
    return { data: {}, content: input };
  }

  const end = input.indexOf('\n---', 4);
  if (end === -1) return { data: {}, content: input };

  const rawFm = input.slice(4, end).replace(/\r/g, '');
  const rest = input.slice(end + '\n---'.length);
  const content = rest.startsWith('\n') ? rest.slice(1) : rest;

  const data: Record<string, string | string[]> = {};
  let currentListKey: string | null = null;

  for (const line of rawFm.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;

    const listItem = /^-\s+(.+)$/.exec(trimmed);
    if (listItem && currentListKey) {
      const v = stripQuotes(listItem[1].trim());
      const prev = data[currentListKey];
      data[currentListKey] = Array.isArray(prev) ? [...prev, v] : [v];
      continue;
    }

    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(trimmed);
    if (!kv) continue;
    const key = kv[1];
    const valueRaw = kv[2] ?? '';
    if (valueRaw === '') {
      currentListKey = key;
      data[key] = [];
      continue;
    }
    currentListKey = null;

    if (valueRaw.startsWith('[') && valueRaw.endsWith(']')) {
      const inner = valueRaw.slice(1, -1);
      const parts = inner
        .split(',')
        .map((p) => stripQuotes(p.trim()))
        .filter(Boolean);
      data[key] = parts;
      continue;
    }

    data[key] = stripQuotes(valueRaw.trim());
  }

  return { data, content };
}

function stripQuotes(v: string): string {
  return v.replace(/^['"]|['"]$/g, '');
}
