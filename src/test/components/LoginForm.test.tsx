import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../../components/auth/LoginForm'
import { renderWithRouter } from '../utils'

function renderLogin(overrides: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  const onLogin = vi.fn().mockResolvedValue(undefined)
  renderWithRouter(
    <LoginForm
      titulo="Sistema de Posgrados"
      subtitulo="Director de Programa"
      placeholderUsuario="usuario"
      onLogin={onLogin}
      rutaExito="/programa/inicio"
      rutaRecuperar="/recuperar-password"
      {...overrides}
    />,
  )
  return { onLogin }
}

describe('LoginForm – render', () => {
  it('shows the title and subtitle', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /sistema de posgrados/i })).toBeInTheDocument()
    expect(screen.getByText(/director de programa/i)).toBeInTheDocument()
  })

  it('renders username and password fields by role/label', () => {
    renderLogin()
    expect(screen.getByRole('textbox', { name: /usuario/i })).toBeInTheDocument()
    // Password field has a label but no textbox role (type=password) — use label
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('renders the forgot-password button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /olvidaste tu contraseña/i })).toBeInTheDocument()
  })
})

describe('LoginForm – validation', () => {
  it('shows error when username is empty on submit', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/usuario es obligatorio/i)).toBeInTheDocument()
  })

  it('shows custom empty-username message when provided', async () => {
    const user = userEvent.setup()
    renderLogin({ mensajeUsuarioVacio: 'El número de documento es obligatorio.' })
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/número de documento es obligatorio/i)).toBeInTheDocument()
  })

  it('shows error when password is empty', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/contraseña es obligatoria/i)).toBeInTheDocument()
  })

  it('shows error when password has fewer than 8 characters', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'short')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/mínimo 8 caracteres/i)).toBeInTheDocument()
  })

  it('shows general validation error banner when fields are invalid', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/revisa los campos marcados/i)).toBeInTheDocument()
  })

  it('does NOT call onLogin when validation fails', async () => {
    const user = userEvent.setup()
    const { onLogin } = renderLogin()
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(onLogin).not.toHaveBeenCalled()
  })
})

describe('LoginForm – successful submission', () => {
  it('calls onLogin with the entered credentials', async () => {
    const user = userEvent.setup()
    const { onLogin } = renderLogin()
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin_programa')
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('admin_programa', 'Password123!'))
  })

  it('shows success message after onLogin resolves', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin_programa')
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/inicio de sesión exitoso/i)).toBeInTheDocument()
  })
})

describe('LoginForm – loading and double-submit prevention', () => {
  it('disables the submit button while loading', async () => {
    const user = userEvent.setup()
    // onLogin never resolves to keep the loading state
    const onLogin = vi.fn().mockReturnValue(new Promise(() => {}))
    renderWithRouter(
      <LoginForm
        titulo="Test"
        subtitulo="Test"
        placeholderUsuario="user"
        onLogin={onLogin}
        rutaExito="/inicio"
        rutaRecuperar="/recuperar"
      />,
    )
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeDisabled()
  })
})

describe('LoginForm – error display', () => {
  it('shows error message when onLogin throws', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn().mockRejectedValue(new Error('Usuario o contraseña incorrectos.'))
    renderWithRouter(
      <LoginForm
        titulo="Test"
        subtitulo="Test"
        placeholderUsuario="user"
        onLogin={onLogin}
        rutaExito="/inicio"
        rutaRecuperar="/recuperar"
      />,
    )
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'WrongPass1!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument()
  })

  it('shows fallback error message when onLogin throws non-Error', async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn().mockRejectedValue('string error')
    renderWithRouter(
      <LoginForm
        titulo="Test"
        subtitulo="Test"
        placeholderUsuario="user"
        onLogin={onLogin}
        rutaExito="/inicio"
        rutaRecuperar="/recuperar"
      />,
    )
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin')
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText(/error al iniciar sesión/i)).toBeInTheDocument()
  })
})

describe('LoginForm – keyboard', () => {
  it('submits form when Enter is pressed in the username field', async () => {
    const user = userEvent.setup()
    const { onLogin } = renderLogin()
    await user.type(screen.getByRole('textbox', { name: /usuario/i }), 'admin_programa')
    await user.type(screen.getByLabelText('Contraseña'), 'Password123!')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(onLogin).toHaveBeenCalled())
  })
})

describe('LoginForm – pie slot', () => {
  it('renders optional pie content', () => {
    renderLogin({ pie: <span>Pie content here</span> })
    expect(screen.getByText('Pie content here')).toBeInTheDocument()
  })
})
