import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminInspectors() {
  const [inspectors, setInspectors] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: i }, { data: c }] = await Promise.all([
      supabase.from('inspectors').select('*, companies(name)').order('name'),
      supabase.from('companies').select('*').eq('is_active', true).order('name')
    ])
    setInspectors(i || [])
    setCompanies(c || [])
    setLoading(false)
  }

  async function save(form) {
    if (editing) {
      await supabase.from('inspectors').update(form).eq('id', editing.id)
    } else {
      await supabase.from('inspectors').insert([form])
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  async function toggleActive(i) {
    await supabase.from('inspectors').update({ is_active: !i.is_active }).eq('id', i.id)
    load()
  }

  async function del(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('inspectors').delete().eq('id', id)
    if (error) alert('삭제 실패: ' + error.message)
    load()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      {showForm && <Form initial={editing} companies={companies} onSave={save} onCancel={() => { setShowForm(false); setEditing(null) }} />}

      <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null) }} style={{ width: 'auto', padding: '10px 16px' }}>
        + 새 검사원 등록
      </button>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {inspectors.length}명 (활성 {inspectors.filter(i => i.is_active).length}명)</div>

      {inspectors.map(i => (
        <div key={i.id} className="card" style={{ opacity: i.is_active ? 1 : 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {i.name}
                {i.grade === 'admin' && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>관리자</span>}
                {!i.is_active && <span className="badge badge-muted" style={{ marginLeft: 6 }}>비활성</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {i.companies?.name || '소속 없음'}
                {i.phone && ` · ${i.phone}`}
                {i.qualification && ` · ${i.qualification}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setEditing(i); setShowForm(true) }} style={{ background: 'transparent', color: 'var(--accent)', fontSize: 13, padding: '4px 8px' }}>수정</button>
              <button onClick={() => toggleActive(i)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 13, padding: '4px 8px' }}>{i.is_active ? '비활성' : '활성'}</button>
              <button onClick={() => del(i.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 16, padding: '4px 6px' }}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function Form({ initial, companies, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [companyId, setCompanyId] = useState(initial?.company_id || '')
  const [qualification, setQualification] = useState(initial?.qualification || '')
  const [grade, setGrade] = useState(initial?.grade || 'inspector')

  function submit() {
    if (!name.trim()) return alert('이름을 입력하세요')
    onSave({
      name, phone: phone || null,
      company_id: companyId || null,
      qualification: qualification || null,
      grade, is_active: true
    })
  }

  return (
    <div className="card" style={{ borderColor: 'var(--accent)' }}>
      <div className="section-label" style={{ marginBottom: 10 }}>{initial ? '수정' : '신규 등록'}</div>
      <Input label="이름 *" value={name} onChange={setName} />
      <Input label="연락처" value={phone} onChange={setPhone} />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>소속 협력사</div>
        <select value={companyId} onChange={e => setCompanyId(e.target.value)}
          style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
          <option value="">소속 없음 (파트장 등)</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Input label="자격증" value={qualification} onChange={setQualification} />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>등급</div>
        <select value={grade} onChange={e => setGrade(e.target.value)}
          style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
          <option value="inspector">일반 검사원</option>
          <option value="admin">관리자 (전체 조회/관리 가능)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn-primary" onClick={submit}>저장</button>
        <button className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}/>
    </div>
  )
}
