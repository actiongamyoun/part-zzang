import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProjectPage({ project, user, onBack, onSelectHull }) {
  const [hulls, setHulls] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('hulls')

  useEffect(() => { loadData() }, [project.project_id])

  async function loadData() {
    setLoading(true)
    const [{ data: h }, { data: n }] = await Promise.all([
      supabase.from('v_hull_summary').select('*').eq('project_id', project.project_id).order('hull_no'),
      supabase.from('notices').select('*').eq('project_id', project.project_id).is('hull_id', null).order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
    ])
    setHulls(h || [])
    setNotices(n || [])
    setLoading(false)
  }

  function getPct(h) {
    if (!h.total_items) return 0
    return Math.round((h.completed_items / h.total_items) * 100)
  }

  function getStatus(h) {
    if (h.overdue_items > 0) return { label: `지연 ${h.overdue_items}`, cls: 'badge-danger' }
    if (h.total_items > 0 && h.completed_items === h.total_items) return { label: '완료', cls: 'badge-success' }
    if (h.total_items === 0) return { label: '미배정', cls: 'badge-muted' }
    return { label: '진행중', cls: 'badge-info' }
  }

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: '8px 0', marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">{project.project_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.ship_type} · 호선 {hulls.length}척</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', background: 'var(--navy-light)' }}>
        {['hulls', 'notices'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px', fontSize: 14, fontWeight: 600,
              background: 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent'
            }}>
            {t === 'hulls' ? `호선 (${hulls.length})` : `공지 (${notices.length})`}
          </button>
        ))}
      </div>

      <div className="content">
        {tab === 'hulls' && (
          <>
            {hulls.length === 0 && <div className="empty">등록된 호선이 없습니다</div>}
            {hulls.map(h => {
              const pct = getPct(h)
              const st = getStatus(h)
              return (
                <button key={h.hull_id} className="card" onClick={() => onSelectHull(h, project)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>호선 {h.hull_no}</div>
                      {h.target_date && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>완료예정 {h.target_date}</div>}
                    </div>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{h.completed_items}/{h.total_items} 항목</span>
                    <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
                  </div>
                </button>
              )
            })}
          </>
        )}

        {tab === 'notices' && (
          <>
            {notices.length === 0 && <div className="empty">공지사항이 없습니다</div>}
            {notices.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: n.is_pinned ? '3px solid var(--accent)' : '3px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--accent)' }}>📌</span>}
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{n.content}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(n.created_at).toLocaleDateString('ko-KR')}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
