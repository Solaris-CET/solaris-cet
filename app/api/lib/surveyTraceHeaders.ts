import { context, trace } from '@opentelemetry/api';
import { randomBytes } from 'node:crypto';

/** Build traceparent for downstream survey-engine (HARD-005). */
export function resolveOutboundTraceparent(req: Request): { traceparent: string; traceId: string } {
  const incoming = req.headers.get('traceparent')?.trim();
  if (incoming && /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i.test(incoming)) {
    const traceId = incoming.split('-')[1]?.toLowerCase() ?? newTraceId();
    return { traceparent: incoming, traceId };
  }
  try {
    const span = trace.getSpan(context.active());
    const ctx = span?.spanContext();
    if (ctx?.traceId && ctx?.spanId) {
      const tp = `00-${ctx.traceId}-${ctx.spanId}-01`;
      return { traceparent: tp, traceId: ctx.traceId };
    }
  } catch {
    void 0;
  }
  const traceId = newTraceId();
  const spanId = randomBytes(8).toString('hex');
  return { traceparent: `00-${traceId}-${spanId}-01`, traceId };
}

function newTraceId(): string {
  return randomBytes(16).toString('hex');
}