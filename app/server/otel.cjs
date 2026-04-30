const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

function boolFromEnv(name, fallback) {
  const v = String(process.env[name] ?? '').trim();
  if (!v) return fallback;
  if (v === '0' || v.toLowerCase() === 'false') return false;
  return true;
}

function resolveOtelEndpoint() {
  const traces = String(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? '').trim();
  if (traces) return traces;
  const base = String(process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? '').trim();
  if (!base) return '';
  return base.endsWith('/') ? `${base}v1/traces` : `${base}/v1/traces`;
}

function resolveServiceName() {
  return String(process.env.OTEL_SERVICE_NAME ?? '').trim() || 'solaris-cet';
}

function resolveServiceVersion() {
  const candidates = [
    process.env.GIT_SHA,
    process.env.GIT_COMMIT,
    process.env.SOURCE_VERSION,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.CF_PAGES_COMMIT_SHA,
    process.env.GITHUB_SHA,
  ];
  for (const v of candidates) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return 'unknown';
}

function resolveDiagLevel() {
  const raw = String(process.env.OTEL_DIAG_LOG_LEVEL ?? '').trim().toLowerCase();
  if (raw === 'debug') return DiagLogLevel.DEBUG;
  if (raw === 'info') return DiagLogLevel.INFO;
  if (raw === 'warn' || raw === 'warning') return DiagLogLevel.WARN;
  if (raw === 'error') return DiagLogLevel.ERROR;
  if (raw === 'none' || raw === 'off') return DiagLogLevel.NONE;
  return DiagLogLevel.ERROR;
}

const otelEnabled = boolFromEnv('OTEL_ENABLED', true);
const otlpTracesEndpoint = resolveOtelEndpoint();

if (!otelEnabled || !otlpTracesEndpoint) {
  module.exports = Promise.resolve(false);
} else {
  diag.setLogger(new DiagConsoleLogger(), resolveDiagLevel());

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: resolveServiceName(),
      [SemanticResourceAttributes.SERVICE_VERSION]: resolveServiceVersion(),
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        String(process.env.OTEL_RESOURCE_ATTRIBUTES_DEPLOYMENT_ENVIRONMENT ?? '').trim() ||
        String(process.env.NODE_ENV ?? '').trim() ||
        'production',
    }),
    traceExporter: new OTLPTraceExporter({ url: otlpTracesEndpoint, headers: {} }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  const startPromise = sdk
    .start()
    .then(() => true)
    .catch(() => false);

  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch {
      void 0;
    }
  };

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());

  module.exports = startPromise;
}

