import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function CheckPage({ record, hull, project, user, onBack, onSaved }) {
  const [steps, setSteps] = useState([])
  const [photos, setPhotos] = useState([])
  const [memo, setMemo] = useState(record.issue_memo || '')
  const [targetDate, setTargetDate] = useState(record.target_date || '')
  const [isCompleted, setIsCompleted] = useState(record.is_completed || false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    loadSteps()
    setPhotos(record.photo_urls || [])
  }, [record.id])

  async function loadSteps() {
    const { data } = await supabase
      .from('sub_step_records')
      .select('*, sub_step_masters(step_name, display_order)')
      .eq('record_id', record.id)
      .order('sub_step_masters(display_order)')
    if (data && data.length > 0) {
      setSteps(data)
    } else {
      const { data: masters } = await supabase
        .from('sub_step_masters').select('*').eq('is_active', true).order('display_order')
      if (masters) {
        const toInsert = masters.map(m => ({
          record_id: record.id, step_master_id: m.id, step_name: m.step_name, is_completed: false
        }))
        const { data: inserted } = await supabase.from('sub_step_records').insert(toInsert).select('*, sub_step_masters(step_name, display_order)')
        setSteps(inserted || [])
      }
    }
  }

  async function toggleStep(step) {
    const next = !step.is_completed
    const { data } = await supabase.from('sub_step_records')
      .update({ is_completed: next, completed_date: next ? new Date().toISOString().split('T')[0] : null, completed_by: next ? user.id : null })
      .eq('id', step.id).select()
    if (data) setSteps(prev => prev.map(s => s.id === step.id ? { ...s, ...data[0] } : s))
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `records/${record.id}/${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`
      const { error } = await supabase.storage.from('photos').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
        urls.push(urlData.publicUrl)
      } else {
        console.error('upload error', error)
      }
    }
    const newPhotos = [...photos, ...urls]
    setPhotos(newPhotos)
    await supabase.from('check_records').update({ photo_urls: newPhotos }).eq('id', record.id)
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('check_records').update({
      target_date: targetDate || null,
      issue_memo: memo || null,
      is_completed: isCompleted,
      completed_date: isCompleted ? new Date().toISOString().split('T')[0] : null
    }).eq('id', record.id)
    setSaving(false)
    onSaved()
  }

  const allDone = steps.length > 0 && steps.every(s => s.is_completed)

  return (
    <div className="page">
      <div className="topbar">
        <button className="btn-ghost" onClick={onBack} style={{ padding: '8px 0', marginRight: 12 }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">{record.check_items?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            호선 {record.hulls?.hull_no || hull.hull_no || '?'}
            {(record.hulls?.projects?.name || project.project_name) && ` · ${record.hulls?.projects?.name || project.project_name}`}
          </div>
        </div>
      </div>

      <div className="content">
        <div className="card">
          <div className="section-label" style={{ marginBottom: 10 }}>세부 단계</div>
          {steps.map((step, i) => (
            <button key={step.id} onClick={() => toggleStep(step)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', background: 'transparent', textAlign: 'left',
                borderBottom: i < steps.length - 1 ? '1px solid var(--card-border)' : 'none'
              }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: step.is_completed ? 'var(--success)' : 'var(--navy-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: step.is_completed ? '#fff' : 'var(--text-muted)'
              }}>
                {step.is_completed ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: step.is_completed ? 'var(--text-muted)' : 'var(--text)', textDecoration: step.is_completed ? 'line-through' : 'none' }}>
                  {step.step_name}
                </div>
                {step.completed_date && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.completed_date}</div>}
              </div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: 10 }}>예상 완료일</div>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 15 }}/>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="section-label">사진 ({photos.length})</div>
            <button onClick={() => fileRef.current.click()}
              style={{ fontSize: 13, color: 'var(--accent)', background: 'transparent', padding: '4px 8px' }}>
              {uploading ? '업로드 중...' : '+ 추가'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} capture="environment"/>
          {photos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}/>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>📷 사진을 추가하세요</div>
          )}
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: 8 }}>특이사항 메모</div>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="이슈 또는 특이사항을 입력하세요"
            style={{ width: '100%', minHeight: 80, background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, resize: 'none', lineHeight: 1.5 }}/>
        </div>

        {allDone && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--success)' }}>
            ✅ 모든 단계가 완료되었습니다. 최종 완료 처리를 하세요.
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={isCompleted} onChange={e => setIsCompleted(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: 'var(--success)', cursor: 'pointer' }}/>
          <div>
            <div style={{ fontWeight: 600 }}>최종 완료</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>모든 작업이 완료되었을 때 체크하세요</div>
          </div>
        </label>

        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8, opacity: saving ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
