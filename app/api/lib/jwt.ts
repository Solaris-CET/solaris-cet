import crypto from 'node:crypto';

function b64url(input: Buffer) {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

export type JwtPayload = Record<string, unknown>;

export function getJwtSecretsFromEnv(): string[] {
  const list = (process.env.JWT_SECRETS ?? '').trim();
  if (list) {
    const secrets = list
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (secrets.length > 0) return secrets;
  }
  const single = process.env.JWT_SECRET?.trim();
  return single ? [single] : [];
}

export async function signJwt(
  payload: JwtPayload,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const encHeader = b64url(Buffer.from(JSON.stringify(header)));
  const encPayload = b64url(Buffer.from(JSON.stringify(fullPayload)));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encPayload, encSig] = parts;
  const data = `${encHeader}.${encPayload}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest();
  let provided: Buffer;
  try {
    provided = b64urlDecode(encSig);
  } catch {
    return null;
  }

  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  let decoded: unknown;
  try {
    decoded = JSON.parse(b64urlDecode(encPayload).toString('utf8'));
  } catch {
    return null;
  }
  if (!decoded || typeof decoded !== 'object') return null;
  const payload = decoded as Record<string, unknown>;
  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  const now = Math.floor(Date.now() / 1000);
  if (now > exp) return null;
  return payload;
}

export function verifyJwtWithSecrets(token: string, secrets: string[]): JwtPayload | null {
  for (const secret of secrets) {
    const decoded = verifyJwt(token, secret);
    if (decoded) return decoded;
  }
  return null;
}
