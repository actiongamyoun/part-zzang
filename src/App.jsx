import { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import HullPage from './pages/HullPage'
import CheckPage from './pages/CheckPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedHull, setSelectedHull] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('qm_user')
    if (saved) {
      setUser(JSON.parse(saved))
      setPage('dashboard')
    }
  }, [])

  function handleLogin(inspector) {
    sessionStorage.setItem('qm_user', JSON.stringify(inspector))
    setUser(inspector)
    setPage('dashboard')
  }

  function handleLogout() {
    sessionStorage.removeItem('qm_user')
    setUser(null)
    setPage('login')
    setSelectedProject(null)
    setSelectedHull(null)
    setSelectedRecord(null)
  }

  if (page === 'login') return <LoginPage onLogin={handleLogin} />
  if (page === 'admin') return <AdminPage user={user} onBack={() => setPage('dashboard')} />
  if (page === 'dashboard') return (
    <DashboardPage user={user} onLogout={handleLogout}
      onSelectProject={(p) => { setSelectedProject(p); setPage('project') }}
      onOpenAdmin={() => setPage('admin')}
    />
  )
  if (page === 'project') return (
    <ProjectPage project={selectedProject} user={user}
      onBack={() => setPage('dashboard')}
      onSelectHull={(h, p) => { setSelectedHull(h); setSelectedProject(p); setPage('hull') }}
    />
  )
  if (page === 'hull') return (
    <HullPage hull={selectedHull} project={selectedProject} user={user}
      onBack={() => setPage('project')}
      onSelectRecord={(r, h, p) => { setSelectedRecord(r); setSelectedHull(h); setSelectedProject(p); setPage('check') }}
    />
  )
  if (page === 'check') return (
    <CheckPage record={selectedRecord} hull={selectedHull} project={selectedProject} user={user}
      onBack={() => setPage('hull')}
      onSaved={() => setPage('hull')}
    />
  )
}
