export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code)
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...init?.headers }
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string }
    throw new ApiError(res.status, body.code ?? 'UNKNOWN')
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
