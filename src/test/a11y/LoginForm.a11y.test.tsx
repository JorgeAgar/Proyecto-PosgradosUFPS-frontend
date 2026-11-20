import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import axe from 'axe-core'
import LoginForm from '../../components/auth/LoginForm'

async function runAxe(container: Element) {
  return axe.run(container, {
    rules: {
      // Color contrast requires computed CSS which is not available in jsdom
      'color-contrast': { enabled: false },
    },
  })
}

describe('LoginForm – accesibilidad (axe-core)', () => {
  it('has no axe violations on initial render', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema de Posgrados"
          subtitulo="Acceso para directores"
          placeholderUsuario="Ingresa tu usuario"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    const results = await runAxe(container)
    if (results.violations.length > 0) {
      const details = results.violations
        .map((v) => `[${v.id}] ${v.description} — ${v.nodes.length} node(s)`)
        .join('\n')
      throw new Error(`Axe violations found:\n${details}`)
    }
    expect(results.violations).toHaveLength(0)
  })

  it('username field has an associated label', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema"
          subtitulo="Sub"
          placeholderUsuario="user"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    // The label "Usuario" should reference the input with id="usuario"
    const label = container.querySelector('label[for="usuario"]')
    expect(label).not.toBeNull()
    const input = container.querySelector('#usuario')
    expect(input).not.toBeNull()
  })

  it('password field has an associated label', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema"
          subtitulo="Sub"
          placeholderUsuario="user"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    const label = container.querySelector('label[for="password"]')
    expect(label).not.toBeNull()
    const input = container.querySelector('#password')
    expect(input).not.toBeNull()
  })

  it('submit button has descriptive text', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema"
          subtitulo="Sub"
          placeholderUsuario="user"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    const submitBtn = container.querySelector('button[type="submit"]')
    expect(submitBtn).not.toBeNull()
    expect(submitBtn!.textContent?.trim()).toBeTruthy()
  })

  it('password toggle button has an aria-label', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema"
          subtitulo="Sub"
          placeholderUsuario="user"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    // The password toggle button should have an aria-label (from InputField)
    const toggleBtn = container.querySelector('[aria-label]') as HTMLElement | null
    expect(toggleBtn).not.toBeNull()
    expect(toggleBtn!.getAttribute('aria-label')).toBeTruthy()
  })

  it('form uses noValidate to prevent browser-native validation', async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginForm
          titulo="Sistema"
          subtitulo="Sub"
          placeholderUsuario="user"
          onLogin={vi.fn()}
          rutaExito="/inicio"
          rutaRecuperar="/recuperar"
        />
      </MemoryRouter>,
    )

    const form = container.querySelector('form')
    expect(form).toHaveAttribute('novalidate')
  })
})
