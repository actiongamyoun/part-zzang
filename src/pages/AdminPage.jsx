import { useState } from 'react'
import AdminProjects from '../components/AdminProjects'
import AdminCompanies from '../components/AdminCompanies'
import AdminInspectors from '../components/AdminInspectors'
import AdminNotices from '../components/AdminNotices'

export default function AdminPage({ user, onBack }) {
  const [tab, setTab] = useState('projects')

  const tabs = [
    { key: 'projects', label: '프로젝트', icon: '📋' },
    { key: 'companies', label: '협력사', icon: '🏢' },
    { key: 'inspectors', label: '검사원', icon: '👥' },
    { key: 'notices', label: '공지', icon: '📢' }
  ]

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: '8px 0', marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">관리자 메뉴</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.name}</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', background: 'var(--navy-light)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: 'transparent', color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent'
            }}>
            <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="content">
        {tab === 'projects' && <AdminProjects user={user} />}
        {tab === 'companies' && <AdminCompanies />}
        {tab === 'inspectors' && <AdminInspectors />}
        {tab === 'notices' && <AdminNotices user={user} />}
      </div>
    </div>
  )
}
