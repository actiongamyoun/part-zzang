import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('companies').select('*').order('name')
    setCompanies(data || [])
    setLoading(false)
  }

  async function save(form) {
    if (editing) {
      await supabase.from('companies').update(form).eq('id', editing.id)
    } else {
      await supabase.from('companies').insert([form])
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  async function toggleActive(c) {
    await supabase.from('companies').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  async function del(id) {
    if (!confirm('정말 삭제하시겠습니까? (소속 검사원/배정도 영향받음)')) return
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) alert('삭제 실패: ' + error.message)
    load()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      {showForm && <Form initial={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null) }} />}

      <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null) }} style={{ width: 'auto', padding: '10px 16px' }}>
        + 새 협력사 등록
      </button>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {companies.length}개 (활성 {companies.filter(c => c.is_active).length}개)</div>

      {companies.map(c => (
        <div key={c.id} className="card" style={{ opacity: c.is_active ? 1 : 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.name} {!c.is_active && <span className="badge badge-muted" style={{ marginLeft: 6 }}>비활성</span>}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {c.type || '-'} {c.contact_name && `· ${c.contact_name}`} {c.contact_phone && `· ${c.contact_phone}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setEditing(c); setShowForm(true) }} style={{ background: 'transparent', color: 'var(--accent)', fontSize: 13, padding: '4px 8px' }}>수정</button>
              <button onClick={() => toggleActive(c)} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 13, padding: '4px 8px' }}>{c.is_active ? '비활성' : '활성'}</button>
              <button onClick={() => del(c.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 16, padding: '4px 6px' }}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function Form({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type || '')
  const [contactName, setContactName] = useState(initial?.contact_name || '')
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone || '')
  const [note, setNote] = useState(initial?.note || '')

  function submit() {
    if (!name.trim()) return alert('협력사명을 입력하세요')
    onSave({
      name, type: type || null, contact_name: contactName || null,
      contact_phone: contactPhone || null, note: note || null, is_active: true
    })
  }

  return (
    <div className="card" style={{ borderColor: 'var(--accent)' }}>
      <div className="section-label" style={{ marginBottom: 10 }}>{initial ? '수정' : '신규 등록'}</div>
      <Input label="협력사명 *" value={name} onChange={setName} />
      <Input label="업종" value={type} onChange={setType} placeholder="도장/블라스팅 등" />
      <Input label="담당자" value={contactName} onChange={setContactName} />
      <Input label="연락처" value={contactPhone} onChange={setContactPhone} />
      <Input label="비고" value={note} onChange={setNote} />
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
