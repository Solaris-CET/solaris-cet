import { formatAiPromMetrics } from '../lib/aiMetrics';
import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

function response(text: string, allowedOrigin: string): Response {
  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response('method not allowed', { status: 405 });
  }

  const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasEncSecret = Boolean(process.env.ENCRYPTION_SECRET?.trim());
  const hasGrokPlain = Boolean(process.env.GROK_API_KEY?.trim());
  const hasGrokEnc = Boolean(process.env.GROK_API_KEY_ENC?.trim());
  const hasGeminiPlain = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasGeminiEnc = Boolean(process.env.GEMINI_API_KEY_ENC?.trim());
  const hasTonRpcUrl = Boolean(process.env.TONCENTER_RPC_URL?.trim());
  const hasTonApiKey = Boolean(process.env.TONCENTER_API_KEY?.trim());
  const hasJwt = Boolean(process.env.JWT_SECRET?.trim());
  const hasJwtSecrets = Boolean(process.env.JWT_SECRETS?.trim());
  const hasUpstashUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim());
  const hasUpstashToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
  const gitSha =
    process.env.GIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    process.env.SOURCE_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    'unknown';

  const aiConfigured = Boolean(
    (hasGrokPlain || (hasGrokEnc && hasEncSecret)) && (hasGeminiPlain || (hasGeminiEnc && hasEncSecret)),
  );
  const dbConfigured = hasDbUrl;
  const tonConfigured = hasTonRpcUrl;
  const now = Math.floor(Date.now() / 1000);

  const lines = [
    '# HELP solaris_up Service is up (static).',
    '# TYPE solaris_up gauge',
    'solaris_up 1',
    '# HELP solaris_time_seconds Current server time in seconds since epoch.',
    '# TYPE solaris_time_seconds gauge',
    `solaris_time_seconds ${now}`,
    '# HELP solaris_build_info Build metadata.',
    '# TYPE solaris_build_info gauge',
    `solaris_build_info{git_sha="${gitSha.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')}"} 1`,
    '# HELP solaris_ai_configured AI env keys configured.',
    '# TYPE solaris_ai_configured gauge',
    `solaris_ai_configured ${aiConfigured ? 1 : 0}`,
    '# HELP solaris_db_configured DATABASE_URL configured.',
    '# TYPE solaris_db_configured gauge',
    `solaris_db_configured ${dbConfigured ? 1 : 0}`,
    '# HELP solaris_ton_configured TON RPC/indexer env configured.',
    '# TYPE solaris_ton_configured gauge',
    `solaris_ton_configured ${tonConfigured ? 1 : 0}`,
    '# HELP solaris_env_database_url_present DATABASE_URL present.',
    '# TYPE solaris_env_database_url_present gauge',
    `solaris_env_database_url_present ${hasDbUrl ? 1 : 0}`,
    '# HELP solaris_env_encryption_secret_present ENCRYPTION_SECRET present.',
    '# TYPE solaris_env_encryption_secret_present gauge',
    `solaris_env_encryption_secret_present ${hasEncSecret ? 1 : 0}`,
    '# HELP solaris_env_grok_key_present GROK_API_KEY present.',
    '# TYPE solaris_env_grok_key_present gauge',
    `solaris_env_grok_key_present ${hasGrokPlain ? 1 : 0}`,
    '# HELP solaris_env_grok_key_enc_present GROK_API_KEY_ENC present.',
    '# TYPE solaris_env_grok_key_enc_present gauge',
    `solaris_env_grok_key_enc_present ${hasGrokEnc ? 1 : 0}`,
    '# HELP solaris_env_gemini_key_present GEMINI_API_KEY present.',
    '# TYPE solaris_env_gemini_key_present gauge',
    `solaris_env_gemini_key_present ${hasGeminiPlain ? 1 : 0}`,
    '# HELP solaris_env_gemini_key_enc_present GEMINI_API_KEY_ENC present.',
    '# TYPE solaris_env_gemini_key_enc_present gauge',
    `solaris_env_gemini_key_enc_present ${hasGeminiEnc ? 1 : 0}`,
    '# HELP solaris_env_jwt_secret_present JWT_SECRET present.',
    '# TYPE solaris_env_jwt_secret_present gauge',
    `solaris_env_jwt_secret_present ${hasJwt ? 1 : 0}`,
    '# HELP solaris_env_jwt_secrets_present JWT_SECRETS present.',
    '# TYPE solaris_env_jwt_secrets_present gauge',
    `solaris_env_jwt_secrets_present ${hasJwtSecrets ? 1 : 0}`,
    '# HELP solaris_env_toncenter_rpc_url_present TONCENTER_RPC_URL present.',
    '# TYPE solaris_env_toncenter_rpc_url_present gauge',
    `solaris_env_toncenter_rpc_url_present ${hasTonRpcUrl ? 1 : 0}`,
    '# HELP solaris_env_toncenter_api_key_present TONCENTER_API_KEY present.',
    '# TYPE solaris_env_toncenter_api_key_present gauge',
    `solaris_env_toncenter_api_key_present ${hasTonApiKey ? 1 : 0}`,
    '# HELP solaris_env_upstash_url_present UPSTASH_REDIS_REST_URL present.',
    '# TYPE solaris_env_upstash_url_present gauge',
    `solaris_env_upstash_url_present ${hasUpstashUrl ? 1 : 0}`,
    '# HELP solaris_env_upstash_token_present UPSTASH_REDIS_REST_TOKEN present.',
    '# TYPE solaris_env_upstash_token_present gauge',
    `solaris_env_upstash_token_present ${hasUpstashToken ? 1 : 0}`,
    '',
  ];

  lines.push(formatAiPromMetrics());

  return response(lines.join('\n'), allowedOrigin);
}
