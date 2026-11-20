import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputField from '../../components/InputField'

function renderInputField(overrides?: Partial<Parameters<typeof InputField>[0]>) {
  const onChange = vi.fn()
  render(
    <InputField
      id="test-input"
      placeholder="Enter value"
      value=""
      onChange={onChange}
      {...overrides}
    />,
  )
  return { onChange }
}

describe('InputField – basic text', () => {
  it('renders a text input with the given id', () => {
    renderInputField()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('displays the placeholder text', () => {
    renderInputField({ placeholder: 'Write something' })
    expect(screen.getByPlaceholderText('Write something')).toBeInTheDocument()
  })

  it('reflects the value prop', () => {
    renderInputField({ value: 'hello' })
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  it('calls onChange when user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InputField id="test" placeholder="test" value="" onChange={onChange} />)
    await user.type(screen.getByRole('textbox'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('is disabled when disabled=true', () => {
    renderInputField({ disabled: true })
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('sets autoComplete attribute', () => {
    renderInputField({ autoComplete: 'username' })
    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'username')
  })

  it('does not show password toggle for type=text', () => {
    renderInputField({ type: 'text' })
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('InputField – password type', () => {
  it('renders input as password type initially', () => {
    render(<InputField id="pwd" type="password" placeholder="pwd" value="" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('pwd')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('shows a toggle button with aria-label', () => {
    render(<InputField id="pwd" type="password" placeholder="pwd" value="" onChange={vi.fn()} />)
    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i })
    expect(toggleBtn).toBeInTheDocument()
  })

  it('toggles to text type when button is clicked', async () => {
    const user = userEvent.setup()
    render(<InputField id="pwd" type="password" placeholder="pwd" value="" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('pwd')
    const toggleBtn = screen.getByRole('button', { name: /mostrar contraseña/i })

    await user.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('updates aria-label to "Ocultar contraseña" after toggle', async () => {
    const user = userEvent.setup()
    render(<InputField id="pwd" type="password" placeholder="pwd" value="" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }))
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument()
  })

  it('toggles back to password type on second click', async () => {
    const user = userEvent.setup()
    render(<InputField id="pwd" type="password" placeholder="pwd" value="" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('pwd')
    const btn = screen.getByRole('button', { name: /mostrar contraseña/i })

    await user.click(btn)
    await user.click(screen.getByRole('button', { name: /ocultar contraseña/i }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
