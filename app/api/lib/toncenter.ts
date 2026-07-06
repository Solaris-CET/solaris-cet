export function getToncenterRpcUrl(): URL {
  const rpc = process.env.TONCENTER_RPC_URL?.trim() || 'https://toncenter.com/api/v2/jsonRPC';
  return new URL(rpc);
}

export function withToncenterApiKey(url: URL): URL {
  const apiKey = process.env.TONCENTER_API_KEY?.trim();
  if (!apiKey) return url;
  const u = new URL(url.toString());
  u.searchParams.set('api_key', apiKey);
  return u;
}

export async function fetchToncenterAddressBalance(
  rpcUrl: URL,
  address: string,
  opts: { timeoutMs: number },
): Promise<string | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(rpcUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '1',
        jsonrpc: '2.0',
        method: 'getAddressBalance',
        params: { address },
      }),
      signal: controller.signal,
    });
    const json = (await res.json()) as { result?: unknown };
    if (!res.ok || json?.result == null) return null;
    return String(json.result);
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

