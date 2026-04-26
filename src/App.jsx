import { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import CheckPage from './pages/CheckPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [selectedProject, setSelectedProject] = useState(null)
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
    setSelectedRecord(null)
  }

  function handleSelectProject(project) {
    setSelectedProject(project)
    setPage('project')
  }

  function handleSelectRecord(record, project) {
    setSelectedRecord(record)
    setSelectedProject(project)
    setPage('check')
  }

  if (page === 'login') return <LoginPage onLogin={handleLogin} />
  if (page === 'dashboard') return <DashboardPage user={user} onLogout={handleLogout} onSelectProject={handleSelectProject} />
  if (page === 'project') return <ProjectPage project={selectedProject} user={user} onBack={() => setPage('dashboard')} onSelectRecord={handleSelectRecord} />
  if (page === 'check') return <CheckPage record={selectedRecord} project={selectedProject} user={user} onBack={() => setPage('project')} onSaved={() => setPage('project')} />
}
