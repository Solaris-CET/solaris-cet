/**
 * Fetch wrapper with exponential backoff + jitter retries.
 * Designed for outbound webhooks and external API calls that must be durable.
 */

export type FetchRetryOptions = {
  /** Maximum number of attempts (default: 5). */
  maxAttempts?: number;
  /** Initial retry delay in milliseconds (default: 500). */
  baseMs?: number;
  /** Maximum delay between retries in milliseconds (default: 30_000). */
  maxDelayMs?: number;
  /** Jitter fraction [0, 1] applied to each delay (default: 0.25). */
  jitter?: number;
  /** Predicate that decides whether an HTTP status is retryable (default: 5xx + 429). */
  retryableStatus?: (status: number) => boolean;
  /** Optional abort signal. */
  signal?: AbortSignal;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 5);
  const baseMs = Math.max(0, opts.baseMs ?? 500);
  const maxDelayMs = Math.max(baseMs, opts.maxDelayMs ?? 30_000);
  const jitter = Math.max(0, Math.min(1, opts.jitter ?? 0.25));
  const retryableStatus =
    opts.retryableStatus ??
    ((status: number) => status >= 500 || status === 429 || status === 408 || status === 0);

  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: opts.signal });
      if (res.ok || attempt === maxAttempts || !retryableStatus(res.status)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts) break;
      if (opts.signal?.aborted) throw opts.signal.reason;
    }

    if (attempt < maxAttempts) {
      const exp = Math.min(maxDelayMs, baseMs * 2 ** (attempt - 1));
      const jitterMs = exp * jitter * (Math.random() * 2 - 1);
      const delay = Math.max(0, Math.min(maxDelayMs, Math.floor(exp + jitterMs)));
      await sleep(delay, opts.signal);
    }
  }

  throw lastError ?? new Error(`fetchWithRetry failed after ${maxAttempts} attempts`);
}
