type CircuitState = { failures: number; openUntilMs: number };

const circuits = new Map<string, CircuitState>();

function nowMs() {
  return Date.now();
}

function backoffMs(failures: number): number {
  const n = Math.max(0, failures - 3);
  const base = 15_000;
  const ms = base * Math.pow(2, Math.min(6, n));
  return Math.min(ms, 5 * 60_000);
}

export function circuitAllows(key: string): boolean {
  const s = circuits.get(key);
  if (!s) return true;
  if (s.openUntilMs <= nowMs()) return true;
  return false;
}

export function circuitReportSuccess(key: string): void {
  circuits.delete(key);
}

export function circuitReportFailure(key: string): void {
  const now = nowMs();
  const current = circuits.get(key) ?? { failures: 0, openUntilMs: 0 };
  const failures = current.failures + 1;
  const openUntilMs = failures >= 3 ? now + backoffMs(failures) : current.openUntilMs;
  circuits.set(key, { failures, openUntilMs });
  if (circuits.size > 2000) {
    for (const [k, v] of circuits.entries()) {
      if (v.openUntilMs && v.openUntilMs <= now) circuits.delete(k);
      if (circuits.size <= 1500) break;
    }
  }
}

