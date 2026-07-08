import { formatAiPromMetrics } from './aiMetrics';

export const SOLARIS_METRICS_PATH = '/api/metrics';
export const SOLARIS_METRICS_METHODS = 'GET, OPTIONS';

export const SOLARIS_METRICS_PROBE = {
  path: SOLARIS_METRICS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  contentType: 'text/plain; version=0.0.4; charset=utf-8' as const,
  cacheControl: 'no-store' as const,
  defaultGitSha: 'unknown' as const,
};

export type SolarisEnvSnapshot = {
  hasDbUrl: boolean;
  hasEncSecret: boolean;
  hasGrokPlain: boolean;
  hasGrokEnc: boolean;
  hasGeminiPlain: boolean;
  hasGeminiEnc: boolean;
  hasTonRpcUrl: boolean;
  hasTonApiKey: boolean;
  hasJwt: boolean;
  hasJwtSecrets: boolean;
  hasUpstashUrl: boolean;
  hasUpstashToken: boolean;
  gitSha: string;
};

export function readTrimmedEnv(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export function resolveSolarisGitSha(): string {
  return (
    readTrimmedEnv('GIT_SHA') ||
    readTrimmedEnv('GIT_COMMIT') ||
    readTrimmedEnv('SOURCE_VERSION') ||
    readTrimmedEnv('VERCEL_GIT_COMMIT_SHA') ||
    readTrimmedEnv('CF_PAGES_COMMIT_SHA') ||
    readTrimmedEnv('GITHUB_SHA') ||
    SOLARIS_METRICS_PROBE.defaultGitSha
  );
}

export function collectSolarisEnvSnapshot(): SolarisEnvSnapshot {
  const hasDbUrl = Boolean(readTrimmedEnv('DATABASE_URL'));
  const hasEncSecret = Boolean(readTrimmedEnv('ENCRYPTION_SECRET'));
  const hasGrokPlain = Boolean(readTrimmedEnv('GROK_API_KEY'));
  const hasGrokEnc = Boolean(readTrimmedEnv('GROK_API_KEY_ENC'));
  const hasGeminiPlain = Boolean(readTrimmedEnv('GEMINI_API_KEY'));
  const hasGeminiEnc = Boolean(readTrimmedEnv('GEMINI_API_KEY_ENC'));
  const hasTonRpcUrl = Boolean(readTrimmedEnv('TONCENTER_RPC_URL'));
  const hasTonApiKey = Boolean(readTrimmedEnv('TONCENTER_API_KEY'));
  const hasJwt = Boolean(readTrimmedEnv('JWT_SECRET'));
  const hasJwtSecrets = Boolean(readTrimmedEnv('JWT_SECRETS'));
  const hasUpstashUrl = Boolean(readTrimmedEnv('UPSTASH_REDIS_REST_URL'));
  const hasUpstashToken = Boolean(readTrimmedEnv('UPSTASH_REDIS_REST_TOKEN'));

  return {
    hasDbUrl,
    hasEncSecret,
    hasGrokPlain,
    hasGrokEnc,
    hasGeminiPlain,
    hasGeminiEnc,
    hasTonRpcUrl,
    hasTonApiKey,
    hasJwt,
    hasJwtSecrets,
    hasUpstashUrl,
    hasUpstashToken,
    gitSha: resolveSolarisGitSha(),
  };
}

export function escapePromLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

export function buildSolarisPromMetricsBody(snapshot: SolarisEnvSnapshot, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const aiConfigured = Boolean(
    (snapshot.hasGrokPlain || (snapshot.hasGrokEnc && snapshot.hasEncSecret)) &&
      (snapshot.hasGeminiPlain || (snapshot.hasGeminiEnc && snapshot.hasEncSecret)),
  );
  const gitSha = escapePromLabelValue(snapshot.gitSha);

  const lines = [
    '# HELP solaris_up Service is up (static).',
    '# TYPE solaris_up gauge',
    'solaris_up 1',
    '# HELP solaris_time_seconds Current server time in seconds since epoch.',
    '# TYPE solaris_time_seconds gauge',
    `solaris_time_seconds ${nowSeconds}`,
    '# HELP solaris_build_info Build metadata.',
    '# TYPE solaris_build_info gauge',
    `solaris_build_info{git_sha="${gitSha}"} 1`,
    '# HELP solaris_ai_configured AI env keys configured.',
    '# TYPE solaris_ai_configured gauge',
    `solaris_ai_configured ${aiConfigured ? 1 : 0}`,
    '# HELP solaris_db_configured DATABASE_URL configured.',
    '# TYPE solaris_db_configured gauge',
    `solaris_db_configured ${snapshot.hasDbUrl ? 1 : 0}`,
    '# HELP solaris_ton_configured TON RPC/indexer env configured.',
    '# TYPE solaris_ton_configured gauge',
    `solaris_ton_configured ${snapshot.hasTonRpcUrl ? 1 : 0}`,
    '# HELP solaris_env_database_url_present DATABASE_URL present.',
    '# TYPE solaris_env_database_url_present gauge',
    `solaris_env_database_url_present ${snapshot.hasDbUrl ? 1 : 0}`,
    '# HELP solaris_env_encryption_secret_present ENCRYPTION_SECRET present.',
    '# TYPE solaris_env_encryption_secret_present gauge',
    `solaris_env_encryption_secret_present ${snapshot.hasEncSecret ? 1 : 0}`,
    '# HELP solaris_env_grok_key_present GROK_API_KEY present.',
    '# TYPE solaris_env_grok_key_present gauge',
    `solaris_env_grok_key_present ${snapshot.hasGrokPlain ? 1 : 0}`,
    '# HELP solaris_env_grok_key_enc_present GROK_API_KEY_ENC present.',
    '# TYPE solaris_env_grok_key_enc_present gauge',
    `solaris_env_grok_key_enc_present ${snapshot.hasGrokEnc ? 1 : 0}`,
    '# HELP solaris_env_gemini_key_present GEMINI_API_KEY present.',
    '# TYPE solaris_env_gemini_key_present gauge',
    `solaris_env_gemini_key_present ${snapshot.hasGeminiPlain ? 1 : 0}`,
    '# HELP solaris_env_gemini_key_enc_present GEMINI_API_KEY_ENC present.',
    '# TYPE solaris_env_gemini_key_enc_present gauge',
    `solaris_env_gemini_key_enc_present ${snapshot.hasGeminiEnc ? 1 : 0}`,
    '# HELP solaris_env_jwt_secret_present JWT_SECRET present.',
    '# TYPE solaris_env_jwt_secret_present gauge',
    `solaris_env_jwt_secret_present ${snapshot.hasJwt ? 1 : 0}`,
    '# HELP solaris_env_jwt_secrets_present JWT_SECRETS present.',
    '# TYPE solaris_env_jwt_secrets_present gauge',
    `solaris_env_jwt_secrets_present ${snapshot.hasJwtSecrets ? 1 : 0}`,
    '# HELP solaris_env_toncenter_rpc_url_present TONCENTER_RPC_URL present.',
    '# TYPE solaris_env_toncenter_rpc_url_present gauge',
    `solaris_env_toncenter_rpc_url_present ${snapshot.hasTonRpcUrl ? 1 : 0}`,
    '# HELP solaris_env_toncenter_api_key_present TONCENTER_API_KEY present.',
    '# TYPE solaris_env_toncenter_api_key_present gauge',
    `solaris_env_toncenter_api_key_present ${snapshot.hasTonApiKey ? 1 : 0}`,
    '# HELP solaris_env_upstash_url_present UPSTASH_REDIS_REST_URL present.',
    '# TYPE solaris_env_upstash_url_present gauge',
    `solaris_env_upstash_url_present ${snapshot.hasUpstashUrl ? 1 : 0}`,
    '# HELP solaris_env_upstash_token_present UPSTASH_REDIS_REST_TOKEN present.',
    '# TYPE solaris_env_upstash_token_present gauge',
    `solaris_env_upstash_token_present ${snapshot.hasUpstashToken ? 1 : 0}`,
    '',
    formatAiPromMetrics(),
  ];

  return lines.join('\n');
}