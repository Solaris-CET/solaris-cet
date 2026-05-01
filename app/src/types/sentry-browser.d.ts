declare module '@sentry/browser' {
  export type Scope = {
    setExtras: (extras: Record<string, unknown>) => void;
  };

  export function init(config: Record<string, unknown>): void;
  export function withScope(cb: (scope: Scope) => void): void;
  export function captureException(error: unknown): void;
}

