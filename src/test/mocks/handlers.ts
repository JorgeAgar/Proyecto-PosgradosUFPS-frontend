import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8080'

export const handlers = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string }

    if (body.username === 'admin_programa' && body.password === 'Password123!') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        userId: 1,
        username: 'admin_programa',
        roles: ['Programa'],
      })
    }

    if (body.username === 'aspirante1' && body.password === 'Password123!') {
      return HttpResponse.json({
        accessToken: 'mock-aspirante-token',
        refreshToken: 'mock-aspirante-refresh',
        userId: 42,
        username: 'aspirante1',
        roles: ['Aspirante'],
      })
    }

    return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' })
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string }
    if (body.refreshToken === 'expired-refresh-token') {
      return new HttpResponse(null, { status: 401 })
    }
    return HttpResponse.json({
      accessToken: 'refreshed-access-token',
      refreshToken: 'refreshed-refresh-token',
      userId: 1,
      username: 'admin_programa',
      roles: ['Programa'],
    })
  }),

  // ── Aspirante ────────────────────────────────────────────────────────────
  http.get(`${BASE}/api/application/case/aspirantes/aspirante/:userId`, () => {
    return HttpResponse.json({ idAspirante: 42 })
  }),

  http.get(`${BASE}/api/application/case/aspirantes/:id/estado-proceso`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Inscripción', status: 'Completado' },
      { id: 2, name: 'Pago de inscripción', status: 'En Progreso' },
      { id: 3, name: 'Documentación', status: 'Pendiente' },
    ])
  }),

  http.get(`${BASE}/api/application/case/aspirantes/:id/correo`, () => {
    return HttpResponse.json({ correo: 'aspirante@test.com' })
  }),

  // ── Generic error endpoints for API client testing ────────────────────────
  http.get(`${BASE}/api/test/400`, () =>
    HttpResponse.json(
      { code: 'VALIDACION_FALLIDA', param: { nombre: 'required' }, message: 'Validation failed' },
      { status: 400 },
    ),
  ),

  http.get(`${BASE}/api/test/401`, () =>
    new HttpResponse(null, { status: 401, statusText: 'Unauthorized' }),
  ),

  http.get(`${BASE}/api/test/403`, () =>
    new HttpResponse(null, { status: 403, statusText: 'Forbidden' }),
  ),

  http.get(`${BASE}/api/test/404`, () =>
    HttpResponse.json({ code: 'PROGRAMA_NOT_FOUND', message: 'Not found' }, { status: 404 }),
  ),

  http.get(`${BASE}/api/test/500`, () =>
    HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
  ),

  http.get(`${BASE}/api/test/ok`, () =>
    HttpResponse.json({ data: 'success', value: 42 }),
  ),

  http.get(`${BASE}/api/test/204`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
]
