import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CompaniesView from '../components/CompaniesView'
import InspectorsView from '../components/InspectorsView'

export default function DashboardPage({ user, onLogout, onSelectProject, onOpenAdmin, onSelectCompany, onSelectInspector }) {
  const [tab, setTab] = useState('projects')
  const [stats, setStats] = useState(null)
  const [projects, setProjects] = useState([])
  const [topInspectors, setTopInspectors] = useState([])
  const [globalNotices, setGlobalNotices] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user.grade === 'admin'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const tasks = [
      supabase.from('v_project_summary').select('*').order('project_name'),
      supabase.from('notices').select('*').is('hull_id', null).is('project_id', null).eq('is_pinned', true).order('created_at', { ascending: false }).limit(3)
    ]
    if (isAdmin) {
      tasks.push(supabase.from('v_dashboard_summary').select('*').single())
      tasks.push(supabase.from('v_inspector_workload').select('*').eq('is_active', true).order('total_assigned', { ascending: false }).limit(5))
    }
    const results = await Promise.all(tasks)
    setProjects(results[0].data || [])
    setGlobalNotices(results[1].data || [])
    if (isAdmin) {
      setStats(results[2].data || null)
      setTopInspectors(results[3].data || [])
    }
    setLoading(false)
  }

  if (loading) return <div className="loading">불러오는 중...</div>

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-title">PART ZZANG</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {user.name}
            {user.companies?.name && ` · ${user.companies.name}`}
            {isAdmin && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>관리자</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {isAdmin && (
            <button className="btn-ghost" onClick={onOpenAdmin} style={{ padding: '8px 12px', fontSize: 13, color: 'var(--accent)' }}>⚙ 관리</button>
          )}
          <button className="btn-ghost" onClick={onLogout} style={{ padding: '8px 12px', fontSize: 13 }}>로그아웃</button>
        </div>
      </div>

      <div className="content">
        {/* 관리자 전용: 통계 카드 */}
        {isAdmin && stats && (
          <>
            <div className="section-label">📊 전체 현황</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <BigStatCard
                label="진행률"
                value={stats.total_items > 0 ? Math.round((stats.completed_items / stats.total_items) * 100) + '%' : '0%'}
                sub={`${stats.completed_items}/${stats.total_items} 완료`}
                color="var(--accent)"
              />
              <BigStatCard
                label="활성 호선"
                value={stats.total_hulls}
                sub={`프로젝트 ${stats.total_projects}개`}
                color="var(--text)"
              />
              <BigStatCard
                label="지연 항목"
                value={stats.overdue_items}
                sub="조치 필요"
                color={stats.overdue_items > 0 ? 'var(--danger)' : 'var(--text-muted)'}
              />
              <BigStatCard
                label="활성 이슈"
                value={stats.issue_items}
                sub={`임박 ${stats.upcoming_items}건 (D-7)`}
                color={stats.issue_items > 0 ? 'var(--warning)' : 'var(--text-muted)'}
              />
            </div>

            {/* 검사원별 업무량 TOP 5 */}
            {topInspectors.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 12 }}>👥 검사원 업무량 TOP {topInspectors.length}</div>
                <div className="card">
                  {topInspectors.map((i, idx) => {
                    const pct = i.total_assigned > 0 ? (i.completed / i.total_assigned * 100) : 0
                    return (
                      <div key={i.inspector_id} style={{ marginBottom: idx < topInspectors.length - 1 ? 12 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {i.inspector_name}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                              {i.company_name || '소속 없음'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {i.completed}/{i.total_assigned}
                            {i.overdue > 0 && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>지연 {i.overdue}</span>}
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* 전체 공지 */}
        {globalNotices.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: isAdmin ? 12 : 0 }}>📢 전체 공지</div>
            {globalNotices.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: '3px solid var(--accent)', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.content}</div>
              </div>
            ))}
          </>
        )}

        {/* 탭 영역 */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, marginBottom: 4, padding: 4, background: 'var(--navy-light)', borderRadius: 10, border: '1px solid var(--card-border)' }}>
          {[
            { key: 'projects', label: '📋 프로젝트' },
            { key: 'companies', label: '🏢 협력사' },
            { key: 'inspectors', label: '👤 검사원' }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '8px 4px', fontSize: 13, fontWeight: 600, borderRadius: 6,
                background: tab === t.key ? 'var(--accent)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text-muted)'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'projects' && <ProjectsTab projects={projects} onSelectProject={onSelectProject} isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} />}
        {tab === 'companies' && <CompaniesView user={user} onSelectCompany={onSelectCompany} />}
        {tab === 'inspectors' && <InspectorsView user={user} onSelectInspector={onSelectInspector} />}
      </div>
    </div>
  )
}

function ProjectsTab({ projects, onSelectProject, isAdmin, onOpenAdmin }) {
  function getStatusBadge(p) {
    if (p.overdue_items > 0) return <span className="badge badge-danger">지연 {p.overdue_items}</span>
    if (p.completed_items === p.total_items && p.total_items > 0) return <span className="badge badge-success">완료</span>
    if (p.total_items === 0) return <span className="badge badge-muted">미배정</span>
    return <span className="badge badge-info">진행중</span>
  }
  function getPct(p) {
    if (!p.total_items) return 0
    return Math.round((p.completed_items / p.total_items) * 100)
  }

  if (projects.length === 0) {
    return (
      <div className="empty">
        등록된 프로젝트가 없습니다
        {isAdmin && (
          <div style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={onOpenAdmin} style={{ width: 'auto', padding: '8px 20px', fontSize: 13 }}>+ 프로젝트 등록</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 {projects.length}개 시리즈</div>
      {projects.map(p => {
        const pct = getPct(p)
        return (
          <button key={p.project_id} className="card" onClick={() => onSelectProject(p)}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.project_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {p.ship_type || '선종 미정'} · 호선 {p.total_hulls}척
                </div>
              </div>
              {getStatusBadge(p)}
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: pct + '%' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{p.completed_items}/{p.total_items} 항목</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--success)' : 'var(--text)' }}>{pct}%</span>
            </div>
          </button>
        )
      })}
    </>
  )
}

function BigStatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}
