/**
 * Typed fetch wrapper.
 * All requests use credentials: 'include' so the HttpOnly JWT cookie is sent automatically.
 * No Authorization header needed — the cookie handles auth.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.error ?? body?.message ?? message
    } catch {
      // ignore parse errors; use statusText
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(path, {
      method: 'POST',
      credentials: 'include',
      body: form,
      // No Content-Type header — browser sets multipart boundary automatically
    }).then(async (res) => {
      if (!res.ok) {
        let message = res.statusText
        try { const b = await res.json(); message = b?.error ?? b?.message ?? message } catch {}
        throw new ApiError(res.status, message)
      }
      return res.json() as Promise<T>
    })
  },

  download: (path: string) =>
    fetch(path, { credentials: 'include' }).then(async (res) => {
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.blob()
    }),
}
