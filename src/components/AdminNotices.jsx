import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminNotices({ user }) {
  const [notices, setNotices] = useState([])
  const [projects, setProjects] = useState([])
  const [hulls, setHulls] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: n }, { data: p }, { data: h }] = await Promise.all([
      supabase.from('notices').select('*, projects(name), hulls(hull_no), inspectors(name)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('name'),
      supabase.from('hulls').select('*, projects(name)').order('hull_no')
    ])
    setNotices(n || [])
    setProjects(p || [])
    setHulls(h || [])
    setLoading(false)
  }

  async function save(form) {
    const payload = { ...form, author_id: user.id, source: 'app' }
    if (editing) {
      await supabase.from('notices').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('notices').insert([payload])
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  async function del(id) {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('notices').delete().eq('id', id)
    load()
  }

  async function togglePin(n) {
    await supabase.from('notices').update({ is_pinned: !n.is_pinned }).eq('id', n.id)
    load()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>

  return (
    <>
      {showForm && <Form initial={editing} projects={projects} hulls={hulls}
        onSave={save} onCancel={() => { setShowForm(false); setEditing(null) }} />}

      <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null) }} style={{ width: 'auto', padding: '10px 16px' }}>
        + 새 공지 작성
      </button>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {notices.length}개</div>

      {notices.map(n => (
        <div key={n.id} className="card" style={{ borderLeft: n.is_pinned ? '3px solid var(--accent)' : '3px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--accent)' }}>📌</span>}
                <div style={{ fontWeight: 600 }}>{n.title}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {n.hulls?.hull_no ? `호선 ${n.hulls.hull_no}` : n.projects?.name ? `${n.projects.name} 시리즈` : '전체 공지'}
                {n.inspectors?.name && ` · ${n.inspectors.name}`}
                {' · '}{new Date(n.created_at).toLocaleDateString('ko-KR')}
                {n.source === 'gsheet' && <span className="badge badge-muted" style={{ marginLeft: 6, fontSize: 10 }}>구글시트</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => togglePin(n)} style={{ background: 'transparent', color: n.is_pinned ? 'var(--accent)' : 'var(--text-muted)', fontSize: 14, padding: '4px 6px' }}>📌</button>
              <button onClick={() => { setEditing(n); setShowForm(true) }} style={{ background: 'transparent', color: 'var(--accent)', fontSize: 13, padding: '4px 8px' }}>수정</button>
              <button onClick={() => del(n.id)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: 14, padding: '4px 6px' }}>🗑</button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{n.content}</div>
        </div>
      ))}
    </>
  )
}

function Form({ initial, projects, hulls, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [scope, setScope] = useState(initial?.hull_id ? 'hull' : initial?.project_id ? 'project' : 'all')
  const [projectId, setProjectId] = useState(initial?.project_id || '')
  const [hullId, setHullId] = useState(initial?.hull_id || '')
  const [isPinned, setIsPinned] = useState(initial?.is_pinned || false)

  const filteredHulls = scope === 'hull' && projectId ? hulls.filter(h => h.project_id === projectId) : hulls

  function submit() {
    if (!title.trim()) return alert('제목을 입력하세요')
    if (!content.trim()) return alert('내용을 입력하세요')
    onSave({
      title, content, is_pinned: isPinned,
      project_id: scope === 'project' ? (projectId || null) : (scope === 'hull' && hullId ? hulls.find(h => h.id === hullId)?.project_id : null),
      hull_id: scope === 'hull' ? (hullId || null) : null
    })
  }

  return (
    <div className="card" style={{ borderColor: 'var(--accent)' }}>
      <div className="section-label" style={{ marginBottom: 10 }}>{initial ? '수정' : '새 공지'}</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>공지 범위</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: '전체' },
            { key: 'project', label: '프로젝트' },
            { key: 'hull', label: '호선' }
          ].map(s => (
            <button key={s.key} onClick={() => setScope(s.key)}
              style={{
                flex: 1, padding: '8px', fontSize: 13, borderRadius: 6,
                background: scope === s.key ? 'var(--accent)' : 'var(--input-bg)',
                color: scope === s.key ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--card-border)'
              }}>{s.label}</button>
          ))}
        </div>
      </div>

      {scope === 'project' && (
        <div style={{ marginBottom: 10 }}>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}
            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
            <option value="">프로젝트 선택</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {scope === 'hull' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <select value={projectId} onChange={e => { setProjectId(e.target.value); setHullId('') }}
              style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
              <option value="">프로젝트 선택 (선택 시 호선 필터)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <select value={hullId} onChange={e => setHullId(e.target.value)}
              style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}>
              <option value="">호선 선택</option>
              {filteredHulls.map(h => <option key={h.id} value={h.id}>호선 {h.hull_no} ({h.projects?.name})</option>)}
            </select>
          </div>
        </>
      )}

      <Input label="제목 *" value={title} onChange={setTitle} />

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>내용 *</div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          style={{ width: '100%', minHeight: 100, background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, resize: 'vertical', lineHeight: 1.5 }}/>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}/>
        <span style={{ fontSize: 13 }}>📌 상단 고정</span>
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={submit}>저장</button>
        <button className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14 }}/>
    </div>
  )
}
