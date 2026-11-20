import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createAuthService } from '../../../services/authService'
import { server } from '../../mocks/server'

const OPTIONS = {
  accessTokenKey: 'test_access_token',
  refreshTokenKey: 'test_refresh_token',
  sessionKey: 'test_session',
  requestedRole: 'TestRole',
  extraKeys: ['test_extra_key'],
}

function makeService() {
  return createAuthService(OPTIONS)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('createAuthService – initial state', () => {
  it('isAuthenticated() returns false with no session', () => {
    const svc = makeService()
    expect(svc.isAuthenticated()).toBe(false)
  })

  it('getSession() returns null with no session', () => {
    const svc = makeService()
    expect(svc.getSession()).toBeNull()
  })

  it('getAccessToken() returns null with no token', () => {
    const svc = makeService()
    expect(svc.getAccessToken()).toBeNull()
  })
})

describe('createAuthService – login', () => {
  it('throws when username is empty', async () => {
    const svc = makeService()
    await expect(svc.login('', 'password123')).rejects.toThrow('Usuario y contraseña son obligatorios.')
  })

  it('throws when username is only whitespace', async () => {
    const svc = makeService()
    await expect(svc.login('   ', 'password123')).rejects.toThrow('Usuario y contraseña son obligatorios.')
  })

  it('throws when password is empty', async () => {
    const svc = makeService()
    await expect(svc.login('admin_programa', '')).rejects.toThrow('Usuario y contraseña son obligatorios.')
  })

  it('stores tokens and session on successful login', async () => {
    const svc = makeService()
    await svc.login('admin_programa', 'Password123!')

    expect(localStorage.getItem(OPTIONS.accessTokenKey)).toBe('mock-access-token')
    expect(localStorage.getItem(OPTIONS.refreshTokenKey)).toBe('mock-refresh-token')
    const session = svc.getSession()
    expect(session).not.toBeNull()
    expect(session!.username).toBe('admin_programa')
    expect(session!.userId).toBe(1)
  })

  it('isAuthenticated() is true after successful login', async () => {
    const svc = makeService()
    await svc.login('admin_programa', 'Password123!')
    expect(svc.isAuthenticated()).toBe(true)
  })

  it('throws for invalid credentials (401)', async () => {
    const svc = makeService()
    await expect(svc.login('wrong_user', 'wrongpassword')).rejects.toThrow(
      'Usuario o contraseña incorrectos.',
    )
  })

  it('throws network error when fetch fails', async () => {
    server.use(
      // HttpResponse.error() causes fetch to throw a TypeError (network-level failure)
      http.post('http://localhost:8080/auth/login', () => HttpResponse.error()),
    )
    const svc = makeService()
    await expect(svc.login('admin_programa', 'Password123!')).rejects.toThrow(
      'No se pudo conectar con el servidor',
    )
  })

  it('throws if response has no accessToken', async () => {
    server.use(
      http.post('http://localhost:8080/auth/login', () =>
        HttpResponse.json({ userId: 1, username: 'admin_programa' }),
      ),
    )
    const svc = makeService()
    await expect(svc.login('admin_programa', 'Password123!')).rejects.toThrow(
      'falta accessToken',
    )
  })

  it('calls onLogin callback after successful login', async () => {
    const onLogin = vi.fn()
    const svc = createAuthService({ ...OPTIONS, onLogin })
    await svc.login('admin_programa', 'Password123!')
    expect(onLogin).toHaveBeenCalledOnce()
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'mock-access-token' }),
    )
  })

  it('clears extraKeys before persisting new session', async () => {
    localStorage.setItem('test_extra_key', 'old-value')
    const svc = makeService()
    await svc.login('admin_programa', 'Password123!')
    expect(localStorage.getItem('test_extra_key')).toBeNull()
  })
})

describe('createAuthService – logout', () => {
  it('clears all storage keys on logout', async () => {
    const svc = makeService()
    await svc.login('admin_programa', 'Password123!')
    svc.logout()

    expect(localStorage.getItem(OPTIONS.accessTokenKey)).toBeNull()
    expect(localStorage.getItem(OPTIONS.refreshTokenKey)).toBeNull()
    expect(localStorage.getItem(OPTIONS.sessionKey)).toBeNull()
  })

  it('isAuthenticated() is false after logout', async () => {
    const svc = makeService()
    await svc.login('admin_programa', 'Password123!')
    svc.logout()
    expect(svc.isAuthenticated()).toBe(false)
  })

  it('calls onLogout callback', async () => {
    const onLogout = vi.fn()
    const svc = createAuthService({ ...OPTIONS, onLogout })
    await svc.login('admin_programa', 'Password123!')
    svc.logout()
    expect(onLogout).toHaveBeenCalledOnce()
  })
})

describe('createAuthService – refreshSession', () => {
  it('returns false when no refresh token exists', async () => {
    const svc = makeService()
    const result = await svc.refreshSession()
    expect(result).toBe(false)
  })

  it('returns true and updates tokens on successful refresh', async () => {
    localStorage.setItem(OPTIONS.refreshTokenKey, 'mock-refresh-token')
    const svc = makeService()
    const result = await svc.refreshSession()
    expect(result).toBe(true)
    expect(localStorage.getItem(OPTIONS.accessTokenKey)).toBe('refreshed-access-token')
  })

  it('returns false when refresh token is expired', async () => {
    localStorage.setItem(OPTIONS.refreshTokenKey, 'expired-refresh-token')
    const svc = makeService()
    const result = await svc.refreshSession()
    expect(result).toBe(false)
  })
})
