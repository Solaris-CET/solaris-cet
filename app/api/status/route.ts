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

  const hasEncSecret = Boolean(process.env.ENCRYPTION_SECRET?.trim());
  const hasGrokPlain = Boolean(process.env.GROK_API_KEY?.trim());
  const hasGrokEnc = Boolean(process.env.GROK_API_KEY_ENC?.trim());
  const hasGeminiPlain = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasGeminiEnc = Boolean(process.env.GEMINI_API_KEY_ENC?.trim());

  const hasAiKey = Boolean(
    (hasGrokPlain || (hasGrokEnc && hasEncSecret)) && (hasGeminiPlain || (hasGeminiEnc && hasEncSecret)),
  );

  const hasTonRpc = Boolean(process.env.TONCENTER_RPC_URL?.trim());

  return jsonResponse(
    {
      ok: true,
      ai: hasAiKey ? 'configured' : 'missing_keys',
      ton: hasTonRpc ? 'configured' : 'not_configured',
      env: {
        ai: {
          grokKey: hasGrokPlain,
          grokKeyEnc: hasGrokEnc,
          geminiKey: hasGeminiPlain,
          geminiKeyEnc: hasGeminiEnc,
          encryptionSecret: hasEncSecret,
        },
        ton: {
          rpcUrl: hasTonRpc,
          apiKey: Boolean(process.env.TONCENTER_API_KEY?.trim()),
        },
      },
      time: new Date().toISOString(),
    },
    allowedOrigin,
    200,
  );
}
