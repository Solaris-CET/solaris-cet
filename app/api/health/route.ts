import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasEncSecret = Boolean(process.env.ENCRYPTION_SECRET?.trim());
  const hasGrokPlain = Boolean(process.env.GROK_API_KEY?.trim());
  const hasGrokEnc = Boolean(process.env.GROK_API_KEY_ENC?.trim());
  const hasGeminiPlain = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasGeminiEnc = Boolean(process.env.GEMINI_API_KEY_ENC?.trim());
  const hasTonRpcUrl = Boolean(process.env.TONCENTER_RPC_URL?.trim());
  const hasTonApiKey = Boolean(process.env.TONCENTER_API_KEY?.trim());
  const hasUpstashUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim());
  const hasUpstashToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
  const hasJwtSecret = Boolean(process.env.JWT_SECRET?.trim());
  const hasJwtSecrets = Boolean(process.env.JWT_SECRETS?.trim());
  const gitSha =
    process.env.GIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    process.env.SOURCE_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    null;

  const dbConfigured = hasDbUrl;
  const aiConfigured = Boolean(
    (hasGrokPlain || (hasGrokEnc && hasEncSecret)) && (hasGeminiPlain || (hasGeminiEnc && hasEncSecret)),
  );
  const tonConfigured = hasTonRpcUrl;

  return jsonResponse(
    {
      status: 'ok',
      checks: {
        db: dbConfigured ? 'configured' : 'missing',
        ai: aiConfigured ? 'configured' : 'missing',
        ton: tonConfigured ? 'configured' : 'missing',
        rateLimit: hasUpstashUrl && hasUpstashToken ? 'configured' : 'missing',
        jwt: hasJwtSecrets || hasJwtSecret ? 'configured' : 'missing',
      },
      env: {
        db: { databaseUrl: hasDbUrl },
        ai: {
          grokKey: hasGrokPlain,
          grokKeyEnc: hasGrokEnc,
          geminiKey: hasGeminiPlain,
          geminiKeyEnc: hasGeminiEnc,
          encryptionSecret: hasEncSecret,
        },
        ton: {
          rpcUrl: hasTonRpcUrl,
          apiKey: hasTonApiKey,
        },
        upstash: {
          url: hasUpstashUrl,
          token: hasUpstashToken,
        },
        jwt: {
          secret: hasJwtSecret,
          secrets: hasJwtSecrets,
        },
      },
      build: {
        gitSha,
        node: typeof process !== 'undefined' ? process.version : null,
      },
      time: new Date().toISOString(),
    },
    allowedOrigin,
  );
}
