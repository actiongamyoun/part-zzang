import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DashboardPage({ user, onLogout, onSelectProject }) {
  const [projects, setProjects] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: proj }, { data: noticeData }] = await Promise.all([
      supabase.from('v_project_summary').select('*').order('hull_no'),
      supabase.from('notices').select('*').is('project_id', null).eq('is_pinned', true).order('created_at', { ascending: false }).limit(3)
    ])
    setProjects(proj || [])
    setNotices(noticeData || [])
    setLoading(false)
  }

  function getStatusBadge(p) {
    if (p.overdue_items > 0) return <span className="badge badge-danger">지연 {p.overdue_items}건</span>
    if (p.completed_items === p.total_items && p.total_items > 0) return <span className="badge badge-success">완료</span>
    if (p.total_items === 0) return <span className="badge badge-muted">미배정</span>
    return <span className="badge badge-info">진행중</span>
  }

  function getPct(p) {
    if (!p.total_items) return 0
    return Math.round((p.completed_items / p.total_items) * 100)
  }

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-title">PART ZZANG</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.name} · {user.companies?.name}</div>
        </div>
        <button className="btn-ghost" onClick={onLogout} style={{ padding: '8px 12px', fontSize: 13 }}>로그아웃</button>
      </div>

      <div className="content">
        {notices.length > 0 && (
          <div>
            <div className="section-label">📢 전체 공지</div>
            {notices.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: '3px solid var(--accent)', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{n.content}</div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="section-label">프로젝트 현황</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {projects.length}건</div>
          </div>

          {projects.length === 0 && <div className="empty">등록된 프로젝트가 없습니다</div>}

          {projects.map(p => {
            const pct = getPct(p)
            return (
              <button key={p.project_id} className="card"
                onClick={() => onSelectProject(p)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>호선 {p.hull_no}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.ship_type || '선종 미정'}
                      {p.target_date && ` · 완료예정 ${p.target_date}`}
                    </div>
                  </div>
                  {getStatusBadge(p)}
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{p.completed_items}/{p.total_items} 항목 완료</span>
                  <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
