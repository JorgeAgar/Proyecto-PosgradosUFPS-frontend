import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { AuthSession } from '../services/authService'

/** Render a component inside a MemoryRouter (needed for components that use useNavigate/Link). */
export function renderWithRouter(
  ui: ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {},
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
    ...options,
  })
}

/** Persist a fake authenticated session in localStorage for the given role. */
export function seedSession(
  rolePrefix: 'aspirante' | 'programa' | 'superadmin' | 'posgrados',
  overrides: Partial<AuthSession> = {},
) {
  const session: AuthSession = {
    userId: 1,
    username: 'test_user',
    roles: [rolePrefix],
    displayName: 'Test User',
    loginAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
  localStorage.setItem(`ufps_${rolePrefix}_session`, JSON.stringify(session))
  localStorage.setItem(`ufps_${rolePrefix}_access_token`, 'mock-access-token')
  localStorage.setItem(`ufps_${rolePrefix}_refresh_token`, 'mock-refresh-token')
}

/** Remove all session keys for a given role (simulates logged-out state). */
export function clearSession(rolePrefix: 'aspirante' | 'programa' | 'superadmin' | 'posgrados') {
  localStorage.removeItem(`ufps_${rolePrefix}_session`)
  localStorage.removeItem(`ufps_${rolePrefix}_access_token`)
  localStorage.removeItem(`ufps_${rolePrefix}_refresh_token`)
}
