import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'

export default function JobsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    supabase.from('vendors').select('id').eq('owner_id', user.id).single().then(async ({ data: v }) => {
      if (!v) { setLoading(false); return }
      const { data: ev } = await supabase
        .from('event_services')
        .select('*, vendor_services(name,category), events(id,title,event_type,event_date,start_time,end_time,guest_count,status,halls(name,city))')
        .eq('vendor_id', v.id)
        .order('added_at', { ascending: false })
      setJobs(ev || [])
      setLoading(false)
    })
  }, [user])

  const statuses = [...new Set(jobs.map((j) => j.status))]
  const filtered = filter ? jobs.filter((j) => j.status === filter) : jobs

  if (loading) return <AppShell title="Jobs"><PageLoader /></AppShell>

  return (
    <AppShell title="Jobs">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">My Jobs</div>
          <div className="page-subtitle">{jobs.length} job{jobs.length !== 1 ? 's' : ''} assigned</div>
        </div>
      </div>

      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        <div className={`filter-chip${!filter ? ' active' : ''}`} onClick={() => setFilter('')}>All</div>
        {statuses.map((s) => <div key={s} className={`filter-chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s}</div>)}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No jobs yet" description="You'll appear here once guests add your services to events." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((j) => (
            <div key={j.id} className="card interactive" onClick={() => navigate(`/jobs/${j.event_id}`)}>
              <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{j.events?.title || '—'}</div>
                  <div className="text-sm text-muted">Service: {j.vendor_services?.name}</div>
                </div>
                <StatusBadge status={j.status} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <div>📅 {formatDate(j.events?.event_date)}</div>
                <div>⏰ {j.events?.start_time} – {j.events?.end_time}</div>
                <div>🏢 {j.events?.halls?.name}, {j.events?.halls?.city}</div>
                <div>👥 {j.events?.guest_count} guests</div>
              </div>
              <div style={{ marginTop: 'var(--space-4)', fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--text-lg)' }}>
                {formatCurrency(j.price)}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
