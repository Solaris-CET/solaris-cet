export class ApiError extends Error {
  status: number
  detail: string | null

  constructor(status: number, message: string, detail: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function readErrorDetail(res: Response): Promise<string | null> {
  try {
    const raw = await res.text()
    if (!raw) return null
    try {
      const json = JSON.parse(raw) as unknown
      if (json && typeof json === 'object') {
        const rec = json as Record<string, unknown>
        const msg = typeof rec.message === 'string' ? rec.message : null
        const err = typeof rec.error === 'string' ? rec.error : null
        return (msg ?? err) || raw.slice(0, 500)
      }
    } catch {
      return raw.slice(0, 500)
    }
    return raw.slice(0, 500)
  } catch {
    return null
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const detail = await readErrorDetail(res)
    throw new ApiError(res.status, `Request failed (${res.status})`, detail)
  }

  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}
