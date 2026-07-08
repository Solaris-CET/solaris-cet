export type ReActPhase =
  | 'idle'
  | 'observe_parse'
  | 'observe_context'
  | 'think_route'
  | 'think_validate'
  | 'act_execute'
  | 'act_consensus'
  | 'verify_cross'
  | 'verify_anchor'
  | 'complete';

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop?: () => void;
};

export type AiState = 'idle' | 'loading' | 'success' | 'error';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'SEC' | 'QUANTUM';
  message: string;
}

export interface MetricsData {
  confidence: number;
  latency: number;
  cetCost: number;
}

export interface AiAttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  bytes: number;
  url: string | null;
}

export interface CetAiFetchResult {
  text: string | null;
  sourceHeader: string | null;
  sources: Array<{ id: string; title: string; url: string; snippet: string }>;
  modelUsed: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  queryLogId: string | null;
  usedCache: boolean;
  /** True if /api/chat responded with a non-success or empty body (helps explain fallback). */
  liveEndpointError: boolean;
  /** Parsed `message` or `error` from JSON body when the call did not yield a response. */
  errorDetail: string | null;
  /** Last HTTP status from /api/chat when the response was not usable (4xx/5xx or empty body). */
  httpStatus: number | null;
}
