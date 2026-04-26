import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CompaniesView({ user, onSelectCompany }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    let query = supabase.from('v_company_summary').select('*').eq('is_active', true).order('company_name')

    // 일반 검사원이면 본인 소속 협력사만
    if (user.grade !== 'admin') {
      const { data: myInsp } = await supabase.from('inspectors').select('company_id').eq('id', user.id).single()
      if (myInsp?.company_id) {
        query = query.eq('company_id', myInsp.company_id)
      }
    }

    const { data } = await query
    setCompanies(data || [])
    setLoading(false)
  }

  function getPct(c) {
    if (!c.total_items) return 0
    return Math.round((c.completed_items / c.total_items) * 100)
  }

  const filtered = companies.filter(c => !search || c.company_name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 협력사 검색"
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, marginBottom: 8 }}/>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {filtered.length}개 협력사</div>

      {filtered.length === 0 && <div className="empty">협력사가 없습니다</div>}

      {filtered.map(c => {
        const pct = getPct(c)
        return (
          <button key={c.company_id} className="card" onClick={() => onSelectCompany(c)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.company_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.type || '미분류'} · 호선 {c.active_hulls}척 · 항목 {c.total_items}개
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                {c.overdue_items > 0 && <span className="badge badge-danger">지연 {c.overdue_items}</span>}
                {c.issue_items > 0 && <span className="badge badge-warning">이슈 {c.issue_items}</span>}
              </div>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{c.completed_items}/{c.total_items} 완료</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
            </div>
          </button>
        )
      })}
    </>
  )
}
