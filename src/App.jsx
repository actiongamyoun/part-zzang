import { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import HullPage from './pages/HullPage'
import CheckPage from './pages/CheckPage'
import AdminPage from './pages/AdminPage'
import CompanyDetailPage from './pages/CompanyDetailPage'
import InspectorDetailPage from './pages/InspectorDetailPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [history, setHistory] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedHull, setSelectedHull] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedInspector, setSelectedInspector] = useState(null)

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
    setHistory([])
  }

  function goTo(newPage) {
    setHistory(h => [...h, page])
    setPage(newPage)
  }

  function goBack() {
    setHistory(h => {
      const prev = h[h.length - 1] || 'dashboard'
      setPage(prev)
      return h.slice(0, -1)
    })
  }

  if (page === 'login') return <LoginPage onLogin={handleLogin} />
  if (page === 'admin') return <AdminPage user={user} onBack={() => setPage('dashboard')} />

  if (page === 'dashboard') return (
    <DashboardPage user={user} onLogout={handleLogout}
      onSelectProject={(p) => { setSelectedProject(p); goTo('project') }}
      onSelectCompany={(c) => { setSelectedCompany(c); goTo('company') }}
      onSelectInspector={(i) => { setSelectedInspector(i); goTo('inspector') }}
      onOpenAdmin={() => setPage('admin')}
    />
  )

  if (page === 'project') return (
    <ProjectPage project={selectedProject} user={user}
      onBack={goBack}
      onSelectHull={(h, p) => { setSelectedHull(h); setSelectedProject(p); goTo('hull') }}
    />
  )

  if (page === 'hull') return (
    <HullPage hull={selectedHull} project={selectedProject} user={user}
      onBack={goBack}
      onSelectRecord={(r, h, p) => { setSelectedRecord(r); setSelectedHull(h); setSelectedProject(p); goTo('check') }}
    />
  )

  if (page === 'company') return (
    <CompanyDetailPage company={selectedCompany} user={user}
      onBack={goBack}
      onSelectRecord={(r) => { setSelectedRecord(r); goTo('check_simple') }}
    />
  )

  if (page === 'inspector') return (
    <InspectorDetailPage inspector={selectedInspector} user={user}
      onBack={goBack}
      onSelectRecord={(r) => { setSelectedRecord(r); goTo('check_simple') }}
    />
  )

  if (page === 'check' || page === 'check_simple') return (
    <CheckPage record={selectedRecord} hull={selectedHull || { hull_no: '?' }}
      project={selectedProject || { project_name: '' }} user={user}
      onBack={goBack}
      onSaved={goBack}
    />
  )
}
