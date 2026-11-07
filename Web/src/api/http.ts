const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

const API_BASE_URL = (configuredBaseUrl ?? '/api').replace(/\/$/, '')

interface ErrorResponse {
  message?: string | string[]
  error?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError(
      0,
      'Unable to reach Odo. Check your connection and try again.',
    )
  }

  const body = (await response.json().catch(() => null)) as
    | ErrorResponse
    | T
    | null

  if (!response.ok) {
    const errorBody = body as ErrorResponse | null
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join('. ')
      : (errorBody?.message ?? errorBody?.error ?? 'Something went wrong')

    throw new ApiError(response.status, message)
  }

  return body as T
}
