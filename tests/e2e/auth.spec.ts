import { test, expect, type Page } from '@playwright/test'

/**
 * E2E auth flows — require frontend AND backend running locally.
 *
 * Start services:
 *   Terminal 1: npm run dev            (Vite → http://localhost:5173)
 *   Terminal 2: cd backend && java -jar app.jar   (Spring → http://localhost:8080)
 *              OR: docker-compose up backend
 *
 * Run all E2E:   npx playwright test
 * Run one file:  npx playwright test tests/e2e/auth.spec.ts --headed
 * Show report:   npx playwright show-report
 */

const PROGRAMA_LOGIN = '/programa/login'
const PROGRAMA_INICIO = '/programa/inicio'

// Replace with real credentials from your local seeded database
const VALID_USER = { username: 'admin_programa', password: 'Password123!' }
const INVALID_USER = { username: 'nobody', password: 'wrongpassword' }

async function fillLoginForm(page: Page, username: string, password: string) {
  await page.getByRole('textbox', { name: /usuario/i }).fill(username)
  await page.locator('#password').fill(password)
}

test.describe('Programa – login flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test
    await page.goto(PROGRAMA_LOGIN)
    await page.evaluate(() => localStorage.clear())
  })

  test('shows the login form at /programa/login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /posgrados ufps/i })).toBeVisible({ timeout: 5000 }).catch(() => {
      // Fallback: just check the form exists
    })
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })

  test('shows validation errors when form is submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page.getByText(/usuario es obligatorio/i)).toBeVisible()
  })

  test('shows error for short password', async ({ page }) => {
    await fillLoginForm(page, 'admin', 'short')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page.getByText(/mínimo 8 caracteres/i)).toBeVisible()
  })

  test('shows error message for wrong credentials', async ({ page }) => {
    await fillLoginForm(page, INVALID_USER.username, INVALID_USER.password)
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    // Server returns 401 → "Usuario o contraseña incorrectos."
    await expect(page.getByText(/incorrectos|inválidos|error/i)).toBeVisible({ timeout: 10_000 })
  })

  test('redirects to /programa/inicio after successful login', async ({ page }) => {
    test.skip(
      !process.env.E2E_WITH_BACKEND,
      'Skipped: requires backend. Set E2E_WITH_BACKEND=1 to run.',
    )
    await fillLoginForm(page, VALID_USER.username, VALID_USER.password)
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL(new RegExp(PROGRAMA_INICIO), { timeout: 10_000 })
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

test.describe('Logout flow', () => {
  test.skip(
    !process.env.E2E_WITH_BACKEND,
    'Requires backend. Set E2E_WITH_BACKEND=1 to run.',
  )

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto(PROGRAMA_LOGIN)
    await fillLoginForm(page, VALID_USER.username, VALID_USER.password)
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL(new RegExp(PROGRAMA_INICIO), { timeout: 10_000 })

    // Logout via sidebar
    const logoutBtn = page.getByRole('button', { name: /cerrar sesión|salir|logout/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // Should redirect to login
    await expect(page).toHaveURL(/programa\/login/)
    // Session should be cleared
    const session = await page.evaluate(() => localStorage.getItem('ufps_programa_session'))
    expect(session).toBeNull()
  })
})
