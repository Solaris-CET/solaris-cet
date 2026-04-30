import { errorResponsePublic } from './publicApiResponse';
import { verifyApiKey } from './publicApiStore';

export type PublicApiAuth = {
  apiKeyId: string;
  userId: string;
  apiKeyName: string;
  apiKeyPrefix: string;
};

export function extractApiKey(req: Request): string {
  const x = String(req.headers.get('x-api-key') ?? '').trim();
  if (x) return x;
  const auth = String(req.headers.get('authorization') ?? '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return '';
}

export async function requirePublicApiKey(req: Request): Promise<PublicApiAuth | Response> {
  const raw = extractApiKey(req);
  if (!raw) return errorResponsePublic(req, 401, 'unauthorized', 'Missing API key');

  const verified = await verifyApiKey(raw);
  if (!verified) return errorResponsePublic(req, 401, 'unauthorized', 'Invalid API key');
  return {
    apiKeyId: verified.id,
    userId: verified.userId,
    apiKeyName: verified.name,
    apiKeyPrefix: verified.prefix,
  };
}

