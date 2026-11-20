import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createApiClient } from '../../services/apiService'
import { createAuthService } from '../../services/authService'
import { server } from '../mocks/server'

const AUTH_OPTIONS = {
  accessTokenKey: 'api_test_access_token',
  refreshTokenKey: 'api_test_refresh_token',
  sessionKey: 'api_test_session',
  requestedRole: 'TestRole',
}

function makeAuthenticatedClient() {
  const auth = createAuthService(AUTH_OPTIONS)
  localStorage.setItem(AUTH_OPTIONS.accessTokenKey, 'mock-access-token')
  localStorage.setItem(AUTH_OPTIONS.refreshTokenKey, 'mock-refresh-token')
  localStorage.setItem(
    AUTH_OPTIONS.sessionKey,
    JSON.stringify({
      userId: 1,
      username: 'testuser',
      roles: ['TestRole'],
      displayName: 'Test User',
      loginAt: new Date().toISOString(),
    }),
  )
  const client = createApiClient(auth)
  return { auth, client }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('createApiClient – successful requests', () => {
  it('fetches JSON data from a successful endpoint', async () => {
    const { client } = makeAuthenticatedClient()
    const result = await client.fetch<{ data: string; value: number }>('/api/test/ok')
    expect(result.data).toBe('success')
    expect(result.value).toBe(42)
  })

  it('returns undefined for 204 No Content', async () => {
    const { client } = makeAuthenticatedClient()
    const result = await client.fetch('/api/test/204')
    expect(result).toBeUndefined()
  })

  it('sends Authorization header with Bearer token', async () => {
    let receivedAuth: string | null = null
    server.use(
      http.get('http://localhost:8080/api/test/auth-check', ({ request }) => {
        receivedAuth = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    const { client } = makeAuthenticatedClient()
    await client.fetch('/api/test/auth-check')
    expect(receivedAuth).toBe('Bearer mock-access-token')
  })
})

describe('createApiClient – error handling', () => {
  it('throws with status 400 and mapped message', async () => {
    const { client } = makeAuthenticatedClient()
    await expect(client.fetch('/api/test/400')).rejects.toThrow()
    try {
      await client.fetch('/api/test/400')
    } catch (err) {
      const error = err as Error & { status?: number }
      expect(error.status).toBe(400)
    }
  })

  it('throws with status 404 and backend code message', async () => {
    const { client } = makeAuthenticatedClient()
    try {
      await client.fetch('/api/test/404')
    } catch (err) {
      const error = err as Error & { status?: number; code?: string }
      expect(error.status).toBe(404)
      expect(error.code).toBe('PROGRAMA_NOT_FOUND')
      expect(error.message).toContain('El programa ya no existe.')
    }
  })

  it('throws with status 500', async () => {
    const { client } = makeAuthenticatedClient()
    try {
      await client.fetch('/api/test/500')
    } catch (err) {
      const error = err as Error & { status?: number }
      expect(error.status).toBe(500)
    }
  })
})

describe('createApiClient – 401/403 session refresh', () => {
  it('retries with refreshed token on 401', async () => {
    let callCount = 0
    server.use(
      http.get('http://localhost:8080/api/test/requires-auth', () => {
        callCount++
        if (callCount === 1) {
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ ok: true })
      }),
    )

    const { client } = makeAuthenticatedClient()
    const result = await client.fetch<{ ok: boolean }>('/api/test/requires-auth')
    expect(result.ok).toBe(true)
    expect(callCount).toBe(2)
  })

  it('logs out and throws on second 401 (refresh fails)', async () => {
    server.use(
      http.get('http://localhost:8080/api/test/always-401', () =>
        new HttpResponse(null, { status: 401 }),
      ),
      http.post('http://localhost:8080/auth/refresh', () =>
        new HttpResponse(null, { status: 401 }),
      ),
    )

    const { client } = makeAuthenticatedClient()
    await expect(client.fetch('/api/test/always-401')).rejects.toThrow(
      'Sesión expirada',
    )
    // Session should be cleared after logout
    expect(localStorage.getItem(AUTH_OPTIONS.sessionKey)).toBeNull()
  })

  it('retries with refreshed token on 403', async () => {
    let callCount = 0
    server.use(
      http.get('http://localhost:8080/api/test/requires-role', () => {
        callCount++
        if (callCount === 1) {
          return new HttpResponse(null, { status: 403 })
        }
        return HttpResponse.json({ ok: true })
      }),
    )

    const { client } = makeAuthenticatedClient()
    const result = await client.fetch<{ ok: boolean }>('/api/test/requires-role')
    expect(result.ok).toBe(true)
    expect(callCount).toBe(2)
  })
})

describe('createApiClient – network failure', () => {
  it('propagates network errors', async () => {
    server.use(
      // HttpResponse.error() causes fetch to throw a TypeError (network-level failure)
      http.get('http://localhost:8080/api/test/network-error', () => HttpResponse.error()),
    )
    const { client } = makeAuthenticatedClient()
    await expect(client.fetch('/api/test/network-error')).rejects.toThrow()
  })
})
