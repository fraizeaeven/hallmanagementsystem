import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'

export default function BookingsListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    supabase.from('halls').select('id').eq('owner_id', user.id).then(async ({ data: halls }) => {
      if (!halls?.length) { setLoading(false); return }
      const hallIds = halls.map((h) => h.id)
      const { data: ev } = await supabase
        .from('events')
        .select('*, halls(name,city), profiles!events_guest_id_fkey(full_name,email,phone)')
        .in('hall_id', hallIds)
        .order('event_date', { ascending: true })
      setEvents(ev || [])
      setLoading(false)
    })
  }, [user])

  const statuses = [...new Set(events.map((e) => e.status))]
  const filtered = statusFilter ? events.filter((e) => e.status === statusFilter) : events

  if (loading) return <AppShell title="Bookings"><PageLoader /></AppShell>

  return (
    <AppShell title="Bookings">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Bookings</div>
          <div className="page-subtitle">{events.length} booking{events.length !== 1 ? 's' : ''} across your halls</div>
        </div>
      </div>

      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        <div className={`filter-chip${!statusFilter ? ' active' : ''}`} onClick={() => setStatusFilter('')}>All</div>
        {statuses.map((s) => (
          <div key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s.replace('_', ' ')}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No bookings" description="Bookings will appear here once guests reserve your halls." />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Event</th><th>Guest</th><th>Hall</th><th>Date</th><th>Guests</th><th>Status</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${e.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div className="text-sm text-muted">{e.event_type}</div>
                  </td>
                  <td>
                    <div>{e.profiles?.full_name || '—'}</div>
                    <div className="text-sm text-muted">{e.profiles?.phone || e.profiles?.email}</div>
                  </td>
                  <td className="text-sm text-secondary">{e.halls?.name}</td>
                  <td>{formatDate(e.event_date)}</td>
                  <td>{e.guest_count}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(e.total_cost)}</td>
                  <td style={{ color: 'var(--brand-light)', fontSize: 'var(--text-sm)' }}>View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
