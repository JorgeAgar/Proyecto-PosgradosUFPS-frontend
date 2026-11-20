import { test, expect } from '@playwright/test'

/**
 * E2E auth flows — only frontend behaviour, no backend required.
 *
 * Run:         npx playwright test
 * Run headed:  npx playwright test --headed
 * Show report: npx playwright show-report
 */

const PROGRAMA_LOGIN = '/programa/login'

test.describe('Programa – login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROGRAMA_LOGIN)
    await page.evaluate(() => localStorage.clear())
  })

  test('shows the login form at /programa/login', async ({ page }) => {
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })

  test('shows validation errors when form is submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page.getByText(/usuario es obligatorio/i)).toBeVisible()
  })

  test('shows error for short password', async ({ page }) => {
    await page.getByRole('textbox', { name: /usuario/i }).fill('admin')
    await page.locator('#password').fill('short')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page.getByText(/mínimo 8 caracteres/i)).toBeVisible()
  })
})

test.describe('Programa – rutas protegidas', () => {
  test('redirects unauthenticated user from /programa/inicio to /programa/login', async ({ page }) => {
    await page.goto('/programa/inicio')
    await expect(page).toHaveURL(/programa\/login/)
  })

  test('redirects unauthenticated user from /programa/cohortes to /programa/login', async ({ page }) => {
    await page.goto('/programa/cohortes')
    await expect(page).toHaveURL(/programa\/login/)
  })

  test('redirects unauthenticated user from /superadmin/inicio to /superadmin/login', async ({ page }) => {
    await page.goto('/superadmin/inicio')
    await expect(page).toHaveURL(/superadmin\/login/)
  })

  test('redirects unauthenticated user from /aspirante/inicio to /aspirante/login', async ({ page }) => {
    await page.goto('/aspirante/inicio')
    await expect(page).toHaveURL(/aspirante\/login/)
  })
})

test.describe('Superadmin – login form', () => {
  test('shows the superadmin login form', async ({ page }) => {
    await page.goto('/superadmin/login')
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })
})

test.describe('Aspirante – login form', () => {
  test('shows the aspirante login form', async ({ page }) => {
    await page.goto('/aspirante/login')
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })
})

test.describe('Root redirect', () => {
  test('redirects / to /programa/login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/programa\/login/)
  })

  test('redirects unknown routes to /404', async ({ page }) => {
    await page.goto('/ruta-inexistente-xyz')
    await expect(page).toHaveURL(/404/)
  })
})
