import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InspectorsView({ user, onSelectInspector }) {
  const [inspectors, setInspectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    let query = supabase.from('v_inspector_workload').select('*').eq('is_active', true)

    if (user.grade !== 'admin') {
      query = query.eq('inspector_id', user.id)
    }

    const { data } = await query.order('total_assigned', { ascending: false })
    setInspectors(data || [])
    setLoading(false)
  }

  function getPct(i) {
    if (!i.total_assigned) return 0
    return Math.round((i.completed / i.total_assigned) * 100)
  }

  const filtered = inspectors.filter(i => !search || i.inspector_name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검사원 검색"
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, marginBottom: 8 }}/>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {filtered.length}명</div>

      {filtered.length === 0 && <div className="empty">검사원이 없습니다</div>}

      {filtered.map(i => {
        const pct = getPct(i)
        return (
          <button key={i.inspector_id} className="card" onClick={() => onSelectInspector(i)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--navy-border)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: 'var(--accent)', flexShrink: 0
              }}>
                {i.inspector_name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {i.inspector_name}
                  {i.grade === 'admin' && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>관리자</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {i.company_name || '소속 없음'} · {i.total_assigned}건 담당
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                {i.overdue > 0 && <span className="badge badge-danger">지연 {i.overdue}</span>}
                {i.issues > 0 && <span className="badge badge-warning">이슈 {i.issues}</span>}
              </div>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{i.completed}/{i.total_assigned} 완료</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
            </div>
          </button>
        )
      })}
    </>
  )
}
