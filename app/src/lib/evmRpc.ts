type JsonRpcOk = { jsonrpc: '2.0'; id: number; result: unknown };
type JsonRpcErr = { jsonrpc: '2.0'; id: number; error: { code: number; message: string; data?: unknown } };

export async function evmRpc<T = unknown>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal,
  });
  if (!res.ok) throw new Error(`rpc_http_${res.status}`);
  const json = (await res.json()) as JsonRpcOk | JsonRpcErr;
  if ('error' in json) throw new Error(`rpc_${json.error.code}`);
  return json.result as T;
}

export function hexToNumber(hex: string): number {
  const s = hex.trim().toLowerCase();
  if (!s.startsWith('0x')) throw new Error('invalid_hex');
  return Number(BigInt(s));
}

