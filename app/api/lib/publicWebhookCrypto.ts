import { createHmac } from 'node:crypto';

import { decryptApiKeyWithEnvSecrets } from './crypto';
import { sha256Hex } from './nodeCrypto';

function isProd(): boolean {
  return String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

export function webhookPepper(): string {
  const p = String(process.env.WEBHOOK_SECRET_PEPPER ?? '').trim();
  if (p) return p;
  const e = String(process.env.ENCRYPTION_SECRET ?? '').trim();
  if (e) return e;
  if (!isProd()) return 'dev-pepper';
  throw new Error('WEBHOOK_SECRET_PEPPER is required in production');
}

export function hashWebhookSecret(secret: string): string {
  return sha256Hex(`${webhookPepper()}:${secret.trim()}`);
}

export async function decryptWebhookSecret(secretEncrypted: string | null): Promise<string | null> {
  const blob = (secretEncrypted ?? '').trim();
  if (!blob) return null;
  try {
    return await decryptApiKeyWithEnvSecrets(blob);
  } catch {
    return null;
  }
}

export function signWebhookBody(secret: string, body: string): string {
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${sig}`;
}
