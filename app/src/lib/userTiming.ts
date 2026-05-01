type MarkOptions = {
  detail?: unknown;
};

function canUsePerformance(): boolean {
  return typeof performance !== 'undefined' && typeof performance.mark === 'function';
}

export function utMark(name: string, opts?: MarkOptions): void {
  if (!canUsePerformance()) return;
  try {
    performance.mark(name, opts);
  } catch {
    void 0;
  }
}

export function utMeasure(name: string, start: string, end: string): void {
  if (!canUsePerformance()) return;
  if (typeof performance.measure !== 'function') return;
  try {
    performance.measure(name, start, end);
  } catch {
    void 0;
  }
}

export function utMeasureToNextFrame(prefix: string, detail?: unknown): void {
  const start = `${prefix}:start`;
  const end = `${prefix}:next-frame`;
  utMark(start, detail ? { detail } : undefined);
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    utMark(end);
    utMeasure(prefix, start, end);
  });
}

