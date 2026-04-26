import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProjectPage({ project, user, onBack, onSelectRecord }) {
  const [records, setRecords] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('items') // 'items' | 'notices'

  useEffect(() => {
    loadData()
  }, [project.project_id])

  async function loadData() {
    setLoading(true)
    const [{ data: recs }, { data: noticeData }] = await Promise.all([
      supabase
        .from('check_records')
        .select(`*, check_items(name, display_order), companies(name), inspectors(name)`)
        .eq('project_id', project.project_id)
        .order('check_items(display_order)'),
      supabase
        .from('notices')
        .select('*')
        .eq('project_id', project.project_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
    ])
    setRecords(recs || [])
    setNotices(noticeData || [])
    setLoading(false)
  }

  function getItemStatus(rec) {
    if (!rec) return 'unassigned'
    if (rec.is_completed) return 'done'
    if (rec.target_date && new Date(rec.target_date) < new Date()) return 'overdue'
    if (rec.target_date) return 'inprogress'
    return 'pending'
  }

  const statusMap = {
    done:       { label: '완료',   cls: 'badge-success' },
    overdue:    { label: '지연',   cls: 'badge-danger' },
    inprogress: { label: '진행중', cls: 'badge-info' },
    pending:    { label: '미착수', cls: 'badge-muted' },
    unassigned: { label: '미배정', cls: 'badge-muted' },
  }

  const myRecords = user.grade === 'admin'
    ? records
    : records.filter(r => r.inspector_id === user.id)

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: '8px 0', marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">호선 {project.hull_no}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.ship_type || '선종 미정'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--navy-border)', background: 'var(--navy-light)' }}>
        {['items', 'notices'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px', fontSize: 14, fontWeight: 600,
              background: 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent'
            }}>
            {t === 'items' ? `체크항목 (${records.length})` : `공지사항 (${notices.length})`}
          </button>
        ))}
      </div>

      <div className="content">
        {tab === 'items' && (
          <>
            {user.grade !== 'admin' && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--navy-light)', padding: '10px 14px', borderRadius: 8 }}>
                내 담당 항목만 표시됩니다
              </div>
            )}
            {(user.grade === 'admin' ? records : myRecords).map(rec => {
              const st = getItemStatus(rec)
              const { label, cls } = statusMap[st]
              return (
                <button key={rec.id} className="card"
                  onClick={() => onSelectRecord(rec, project)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{rec.check_items?.name}</div>
                    <span className={`badge ${cls}`}>{label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    <span>👤 {rec.inspectors?.name || '미배정'}</span>
                    <span>🏢 {rec.companies?.name || '미배정'}</span>
                    {rec.target_date && <span>📅 {rec.target_date}</span>}
                  </div>
                  {rec.issue_memo && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)', background: 'rgba(245,158,11,0.08)', padding: '6px 10px', borderRadius: 6 }}>
                      ⚠ {rec.issue_memo}
                    </div>
                  )}
                </button>
              )
            })}
            {(user.grade === 'admin' ? records : myRecords).length === 0 && (
              <div className="empty">담당 항목이 없습니다</div>
            )}
          </>
        )}

        {tab === 'notices' && (
          <>
            {notices.length === 0 && <div className="empty">등록된 공지사항이 없습니다</div>}
            {notices.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: n.is_pinned ? '3px solid var(--accent)' : '3px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--accent)' }}>📌 고정</span>}
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{n.content}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
