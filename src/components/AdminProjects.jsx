import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminProjects({ user }) {
  const [projects, setProjects] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingHull, setEditingHull] = useState(null) // hull object for assignment editing
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { loadProjects() }, [refreshKey])

  async function loadProjects() {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('name')
    setProjects(data || [])
    setLoading(false)
  }

  async function handleAddProject(form) {
    const { error } = await supabase.from('projects').insert([form])
    if (error) return alert('등록 실패: ' + error.message)
    setShowProjectForm(false)
    setRefreshKey(k => k + 1)
  }

  async function handleDeleteProject(id) {
    if (!confirm('프로젝트와 모든 호선/체크기록이 삭제됩니다. 진행하시겠습니까?')) return
    await supabase.from('projects').delete().eq('id', id)
    setRefreshKey(k => k + 1)
  }

  if (editingHull) {
    return <HullAssignment hull={editingHull} onBack={() => { setEditingHull(null); setRefreshKey(k => k + 1) }} />
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      {showProjectForm && <ProjectForm onSave={handleAddProject} onCancel={() => setShowProjectForm(false)} />}

      <button className="btn-primary" onClick={() => setShowProjectForm(true)} style={{ width: 'auto', padding: '10px 16px' }}>
        + 새 프로젝트 등록
      </button>

      {projects.length === 0 && <div className="empty">프로젝트를 등록하세요</div>}

      {projects.map(p => (
        <ProjectItem key={p.id} project={p}
          expanded={expanded === p.id}
          onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
          onDelete={() => handleDeleteProject(p.id)}
          onEditAssign={(hull) => setEditingHull(hull)}
          refreshKey={refreshKey}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      ))}
    </>
  )
}

function ProjectForm({ onSave, onCancel, initial }) {
  const [name, setName] = useState(initial?.name || '')
  const [shipType, setShipType] = useState(initial?.ship_type || '')
  const [description, setDescription] = useState(initial?.description || '')

  function submit() {
    if (!name.trim()) return alert('프로젝트명을 입력하세요')
    onSave({ name, ship_type: shipType || null, description: description || null, status: 'active' })
  }

  return (
    <div className="card" style={{ borderColor: 'var(--accent)' }}>
      <div className="section-label" style={{ marginBottom: 10 }}>새 프로젝트</div>
      <Input label="프로젝트명 *" value={name} onChange={setName} placeholder="예: LNGC-A 시리즈" />
      <Input label="선종" value={shipType} onChange={setShipType} placeholder="예: LNGC, 탱커" />
      <Input label="설명" value={description} onChange={setDescription} placeholder="비고" />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn-primary" onClick={submit}>저장</button>
        <button className="btn-ghost" onClick={onCancel} style={{ flexShrink: 0 }}>취소</button>
      </div>
    </div>
  )
}

function ProjectItem({ project, expanded, onToggle, onDelete, onEditAssign, refreshKey, onRefresh }) {
  const [hulls, setHulls] = useState([])
  const [showHullForm, setShowHullForm] = useState(false)

  useEffect(() => { if (expanded) loadHulls() }, [expanded, refreshKey])

  async function loadHulls() {
    const { data } = await supabase.from('hulls').select('*').eq('project_id', project.id).order('hull_no')
    setHulls(data || [])
  }

  async function handleAddHull(form) {
    const { data: hull, error } = await supabase.from('hulls').insert([{ ...form, project_id: project.id }]).select().single()
    if (error) return alert('등록 실패: ' + error.message)

    // 호선 등록 시 체크항목 11개 자동 생성 (배정 없이)
    const { data: items } = await supabase.from('check_items').select('id').eq('is_active', true).order('display_order')
    if (items) {
      await supabase.from('check_records').insert(items.map(it => ({
        hull_id: hull.id, check_item_id: it.id
      })))
    }

    setShowHullForm(false)
    loadHulls()
    onRefresh()
  }

  async function handleDeleteHull(id) {
    if (!confirm('호선과 모든 체크기록이 삭제됩니다.')) return
    await supabase.from('hulls').delete().eq('id', id)
    loadHulls()
    onRefresh()
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onToggle} style={{ flex: 1, background: 'transparent', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project.ship_type || '선종 미정'}</div>
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onDelete} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 18, padding: '4px 8px' }}>🗑</button>
          <button onClick={onToggle} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px' }}>{expanded ? '▾' : '▸'}</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="section-label">호선 ({hulls.length})</div>
            <button onClick={() => setShowHullForm(!showHullForm)}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'transparent', padding: '4px 8px' }}>
              {showHullForm ? '취소' : '+ 호선 추가'}
            </button>
          </div>

          {showHullForm && <HullForm onSave={handleAddHull} onCancel={() => setShowHullForm(false)} />}

          {hulls.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--input-bg)', borderRadius: 8, marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600 }}>호선 {h.hull_no}</div>
                {h.target_date && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>완료예정 {h.target_date}</div>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => onEditAssign(h)} style={{ fontSize: 12, padding: '6px 10px', background: 'var(--accent)', color: '#fff', borderRadius: 6 }}>배정</button>
                <button onClick={() => handleDeleteHull(h.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 14, padding: '4px 6px' }}>🗑</button>
              </div>
            </div>
          ))}
          {hulls.length === 0 && !showHullForm && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>호선을 추가하세요</div>}
        </div>
      )}
    </div>
  )
}

function HullForm({ onSave, onCancel }) {
  const [hullNo, setHullNo] = useState('')
  const [targetDate, setTargetDate] = useState('')

  function submit() {
    if (!hullNo.trim()) return alert('호선번호를 입력하세요')
    onSave({ hull_no: hullNo, target_date: targetDate || null, status: 'active' })
  }

  return (
    <div style={{ background: 'var(--input-bg)', padding: 12, borderRadius: 8, marginBottom: 10, border: '1px solid var(--accent)' }}>
      <Input label="호선번호 *" value={hullNo} onChange={setHullNo} placeholder="예: 3395" />
      <Input label="완료예정일" type="date" value={targetDate} onChange={setTargetDate} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={submit} style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13 }}>등록</button>
        <button onClick={onCancel} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text-muted)', borderRadius: 6, fontSize: 13 }}>취소</button>
      </div>
    </div>
  )
}

function HullAssignment({ hull, onBack }) {
  const [records, setRecords] = useState([])
  const [companies, setCompanies] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [hull.id])

  async function loadData() {
    setLoading(true)
    const [{ data: recs }, { data: comps }, { data: insps }] = await Promise.all([
      supabase.from('check_records').select('*, check_items(name, display_order)').eq('hull_id', hull.id).order('check_items(display_order)'),
      supabase.from('companies').select('*').eq('is_active', true).order('name'),
      supabase.from('inspectors').select('*, companies(name)').eq('is_active', true).order('name')
    ])
    setRecords(recs || [])
    setCompanies(comps || [])
    setInspectors(insps || [])
    setLoading(false)
  }

  function updateRecord(recId, field, value) {
    setRecords(prev => prev.map(r => {
      if (r.id !== recId) return r
      const updated = { ...r, [field]: value }
      // 협력사 변경 시 자동으로 그 협력사 소속 첫 검사원 배정
      if (field === 'company_id' && value) {
        const insp = inspectors.find(i => i.company_id === value)
        if (insp) updated.inspector_id = insp.id
      }
      return updated
    }))
  }

  async function saveAll() {
    setSaving(true)
    for (const r of records) {
      await supabase.from('check_records').update({
        company_id: r.company_id || null,
        inspector_id: r.inspector_id || null,
        target_date: r.target_date || null
      }).eq('id', r.id)
    }
    setSaving(false)
    alert('저장되었습니다')
    onBack()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button className="btn-ghost" onClick={onBack} style={{ padding: '4px 8px' }}>←</button>
        <div>
          <div style={{ fontWeight: 700 }}>호선 {hull.hull_no} 배정</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>각 항목별 협력사/검사원/예상일 설정</div>
        </div>
      </div>

      {records.map(rec => (
        <div key={rec.id} className="card">
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>{rec.check_items?.name}</div>

          <SelectField label="협력사" value={rec.company_id || ''}
            onChange={v => updateRecord(rec.id, 'company_id', v)}
            options={[{ value: '', label: '선택 안 함' }, ...companies.map(c => ({ value: c.id, label: c.name }))]}
          />

          <SelectField label="검사원" value={rec.inspector_id || ''}
            onChange={v => updateRecord(rec.id, 'inspector_id', v)}
            options={[
              { value: '', label: '선택 안 함' },
              ...inspectors
                .filter(i => !rec.company_id || i.company_id === rec.company_id || !i.company_id)
                .map(i => ({ value: i.id, label: `${i.name}${i.companies?.name ? ` (${i.companies.name})` : ''}` }))
            ]}
          />

          <Input label="예상 완료일" type="date" value={rec.target_date || ''}
            onChange={v => updateRecord(rec.id, 'target_date', v)} />
        </div>
      ))}

      <button className="btn-primary" onClick={saveAll} disabled={saving} style={{ position: 'sticky', bottom: 12 }}>
        {saving ? '저장 중...' : '전체 저장'}
      </button>
    </>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}/>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
