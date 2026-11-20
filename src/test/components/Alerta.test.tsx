import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Alerta from '../../components/Alerta'

describe('Alerta – visibility', () => {
  it('renders message when isOpen=true', () => {
    render(<Alerta isOpen mensaje="Test alert message" onClose={vi.fn()} />)
    expect(screen.getByText('Test alert message')).toBeInTheDocument()
  })

  it('does not render when isOpen=false', () => {
    render(<Alerta isOpen={false} mensaje="Hidden message" onClose={vi.fn()} />)
    expect(screen.queryByText('Hidden message')).toBeNull()
  })
})

describe('Alerta – tipos', () => {
  it('renders error type by default', () => {
    render(<Alerta isOpen mensaje="Error msg" onClose={vi.fn()} />)
    expect(screen.getByText('Error msg').closest('div')).toBeInTheDocument()
  })

  it('renders exito type', () => {
    render(<Alerta isOpen mensaje="Éxito" tipo="exito" onClose={vi.fn()} />)
    expect(screen.getByText('Éxito')).toBeInTheDocument()
  })

  it('renders advertencia type', () => {
    render(<Alerta isOpen mensaje="Advertencia" tipo="advertencia" onClose={vi.fn()} />)
    expect(screen.getByText('Advertencia')).toBeInTheDocument()
  })
})

describe('Alerta – close button', () => {
  it('has a close button with accessible label', () => {
    render(<Alerta isOpen mensaje="Alert" onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /cerrar alerta/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Alerta isOpen mensaje="Alert" onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /cerrar alerta/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Alerta – auto-close', () => {
  it('calls onClose automatically after duracion ms', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Alerta isOpen mensaje="Auto close" onClose={onClose} duracion={1000} />)
    expect(onClose).not.toHaveBeenCalled()
    // Wrap timer advancement in act() so React processes the state updates
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(onClose).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('does not auto-close before duracion', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Alerta isOpen mensaje="Persistent" onClose={onClose} duracion={5000} />)
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(onClose).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
