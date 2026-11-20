import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import ProgramaLayout from '../../layouts/ProgramaLayout'
import SuperadminLayout from '../../layouts/SuperadminLayout'
import { seedSession, clearSession } from '../utils'

/** Minimal test placeholder rendered as the outlet content. */
function Dashboard() {
  return <main>Dashboard content</main>
}

function renderProgramaLayout(initialPath = '/programa/inicio') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/programa/login" element={<div>Programa Login Page</div>} />
        <Route path="/programa" element={<ProgramaLayout />}>
          <Route path="inicio" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function renderSuperadminLayout(initialPath = '/superadmin/inicio') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/superadmin/login" element={<div>Superadmin Login Page</div>} />
        <Route path="/superadmin" element={<SuperadminLayout />}>
          <Route path="inicio" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProgramaLayout – ruta protegida', () => {
  beforeEach(() => {
    clearSession('programa')
  })

  it('redirects to /programa/login when there is no session', () => {
    renderProgramaLayout()
    expect(screen.getByText('Programa Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard content')).toBeNull()
  })

  it('renders the dashboard when a valid session exists', () => {
    seedSession('programa')
    renderProgramaLayout()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('redirects to login even if access_token exists but session is missing', () => {
    localStorage.setItem('ufps_programa_access_token', 'some-token')
    renderProgramaLayout()
    expect(screen.getByText('Programa Login Page')).toBeInTheDocument()
  })
})

describe('SuperadminLayout – ruta protegida', () => {
  beforeEach(() => {
    clearSession('superadmin')
  })

  it('redirects to /superadmin/login when there is no session', () => {
    renderSuperadminLayout()
    expect(screen.getByText('Superadmin Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard content')).toBeNull()
  })

  it('renders the dashboard when a valid session exists', () => {
    seedSession('superadmin')
    renderSuperadminLayout()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
})
