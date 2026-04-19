import { TonClient } from '@ton/ton';

let client: TonClient | null = null;

export function getTonClient(): TonClient | null {
  if (client) return client;
  const endpointRaw = process.env.TONCENTER_RPC_URL?.trim();
  if (!endpointRaw) return null;
  const apiKey = process.env.TONCENTER_API_KEY?.trim();

  let endpoint = endpointRaw;
  if (apiKey) {
    try {
      const u = new URL(endpointRaw);
      if (!u.searchParams.get('api_key')) u.searchParams.set('api_key', apiKey);
      endpoint = u.toString();
    } catch {
      return null;
    }
  }

  client = new TonClient({ endpoint });
  return client;
}
