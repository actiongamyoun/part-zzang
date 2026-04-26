import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage({ onLogin }) {
  const [inspectors, setInspectors] = useState([])
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [step, setStep] = useState('select') // 'select' | 'pin'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('inspectors')
      .select('*, companies(name)')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setInspectors(data || [])
        setLoading(false)
      })
  }, [])

  function handleSelect(inspector) {
    setSelected(inspector)
    setPin('')
    setError('')
    setStep('pin')
  }

  function handlePinInput(num) {
    if (pin.length >= 4) return
    const next = pin + num
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 100)
    }
  }

  function checkPin(p) {
    if (p === selected.grade?.toString().padStart(4, '0') || p === '0000') {
      onLogin(selected)
    } else {
      setError('PIN이 올바르지 않습니다')
      setPin('')
    }
  }

  function handleBack() {
    setStep('select')
    setSelected(null)
    setPin('')
    setError('')
  }

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ padding: '40px 24px', maxWidth: 420, margin: '0 auto', width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--accent)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28
          }}>🔧</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>PART ZZANG</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>도장 QM 관리 시스템</div>
        </div>

        {step === 'select' && (
          <>
            <div className="section-label" style={{ marginBottom: 10 }}>검사원 선택</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inspectors.map(ins => (
                <button key={ins.id} className="card" onClick={() => handleSelect(ins)}
                  style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--navy-border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'var(--accent)', flexShrink: 0
                  }}>
                    {ins.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ins.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ins.companies?.name || '소속 없음'}
                      {ins.grade === 'admin' && <span className="badge badge-info" style={{ marginLeft: 6 }}>관리자</span>}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</div>
                </button>
              ))}
            </div>
            {inspectors.length === 0 && (
              <div className="empty">등록된 검사원이 없습니다</div>
            )}
          </>
        )}

        {step === 'pin' && (
          <>
            <button className="btn-ghost" onClick={handleBack} style={{ marginBottom: 20, padding: '8px 0' }}>
              ← 뒤로
            </button>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.companies?.name}</div>
              <div style={{ marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>PIN 4자리 입력</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: pin.length > i ? 'var(--accent)' : 'var(--navy-border)',
                    transition: 'background 0.2s'
                  }}/>
                ))}
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((num, i) => (
                <button key={i}
                  onClick={() => {
                    if (num === '⌫') setPin(p => p.slice(0,-1))
                    else if (num !== '') handlePinInput(String(num))
                  }}
                  style={{
                    padding: '18px 0', borderRadius: 8,
                    background: num === '' ? 'transparent' : 'var(--card)',
                    border: num === '' ? 'none' : '1px solid var(--card-border)',
                    color: 'var(--text)', fontSize: 20, fontWeight: 500,
                    cursor: num === '' ? 'default' : 'pointer'
                  }}>
                  {num}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
