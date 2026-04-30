export type TonNetwork = 'mainnet' | 'testnet'

export function parseTonNetwork(input: string | null): TonNetwork {
  return input === 'testnet' ? 'testnet' : 'mainnet'
}

export function tonapiBaseUrl(network: TonNetwork): string {
  return network === 'testnet' ? 'https://testnet.tonapi.io' : 'https://tonapi.io'
}

export function tonapiAuthHeaders(): Record<string, string> {
  const token = (process.env.TONAPI_KEY ?? '').trim()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchTonapiJson<T>(
  network: TonNetwork,
  path: string,
  opts: { timeoutMs: number },
): Promise<{ ok: true; data: T } | { ok: false } > {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    const url = `${tonapiBaseUrl(network)}${path}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...tonapiAuthHeaders(),
      },
      signal: controller.signal,
    })
    if (!res.ok) return { ok: false }
    const data = (await res.json()) as T
    return { ok: true, data }
  } catch {
    return { ok: false }
  } finally {
    clearTimeout(id)
  }
}
