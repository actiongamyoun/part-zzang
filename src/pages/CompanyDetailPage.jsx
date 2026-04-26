import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CompanyDetailPage({ company, user, onBack, onSelectRecord }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [groupBy, setGroupBy] = useState('hull') // 'hull' | 'item'

  useEffect(() => { load() }, [company.company_id])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('check_records')
      .select(`*, check_items(name, display_order), inspectors(name), hulls(hull_no, project_id, projects(name))`)
      .eq('company_id', company.company_id)

    // 일반 검사원이면 본인 담당만
    if (user.grade !== 'admin') {
      query = query.eq('inspector_id', user.id)
    }

    const { data } = await query.order('check_items(display_order)')
    setRecords(data || [])
    setLoading(false)
  }

  function getStatus(rec) {
    if (rec.is_completed) return { key: 'done', label: '완료', cls: 'badge-success' }
    if (rec.target_date && new Date(rec.target_date) < new Date()) return { key: 'overdue', label: '지연', cls: 'badge-danger' }
    if (rec.target_date) return { key: 'inprogress', label: '진행중', cls: 'badge-info' }
    return { key: 'pending', label: '미착수', cls: 'badge-muted' }
  }

  let visibleRecords = filter === 'all' ? records : records.filter(r => getStatus(r).key === filter)

  // 그룹핑
  const groups = {}
  if (groupBy === 'hull') {
    visibleRecords.forEach(r => {
      const key = r.hulls ? `${r.hulls.projects?.name || '?'} - 호선 ${r.hulls.hull_no}` : '미배정'
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
  } else {
    visibleRecords.forEach(r => {
      const key = r.check_items?.name || '미배정'
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
  }

  const stats = {
    total: records.length,
    done: records.filter(r => r.is_completed).length,
    overdue: records.filter(r => !r.is_completed && r.target_date && new Date(r.target_date) < new Date()).length,
    issue: records.filter(r => r.issue_memo && !r.is_completed).length
  }

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: '8px 0', marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">🏢 {company.company_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{company.type || '협력사'}</div>
        </div>
      </div>

      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <StatCard label="전체" value={stats.total} color="var(--text)" />
          <StatCard label="완료" value={stats.done} color="var(--success)" />
          <StatCard label="지연" value={stats.overdue} color="var(--danger)" />
          <StatCard label="이슈" value={stats.issue} color="var(--warning)" />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>그룹:</span>
          {[{ k: 'hull', l: '호선별' }, { k: 'item', l: '항목별' }].map(g => (
            <button key={g.k} onClick={() => setGroupBy(g.k)}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 12,
                background: groupBy === g.k ? 'var(--accent)' : 'var(--card)',
                color: groupBy === g.k ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--card-border)'
              }}>{g.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: '전체' },
            { key: 'overdue', label: '지연' },
            { key: 'inprogress', label: '진행중' },
            { key: 'pending', label: '미착수' },
            { key: 'done', label: '완료' }
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 12px', fontSize: 12, borderRadius: 16, whiteSpace: 'nowrap',
                background: filter === f.key ? 'var(--accent)' : 'var(--card)',
                color: filter === f.key ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--card-border)'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {Object.keys(groups).length === 0 && <div className="empty">표시할 항목이 없습니다</div>}

        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} style={{ marginTop: 8 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>{groupName} ({items.length})</div>
            {items.map(rec => {
              const st = getStatus(rec)
              return (
                <button key={rec.id} className="card" onClick={() => onSelectRecord(rec)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {groupBy === 'hull' ? rec.check_items?.name : `호선 ${rec.hulls?.hull_no || '?'}`}
                    </div>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <span>👤 {rec.inspectors?.name || '미배정'}</span>
                    {rec.target_date && <span>📅 {rec.target_date}</span>}
                  </div>
                  {rec.issue_memo && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--warning)' }}>⚠ {rec.issue_memo}</div>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
