import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/helpers'

export default function AdminBookingsPage() {
  const navigate  = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]  = useState('')

  useEffect(() => {
    supabase.from('events')
      .select('*, halls(name,city), profiles!events_guest_id_fkey(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setEvents(data || []); setLoading(false) })
  }, [])

  const statuses = [...new Set(events.map((e) => e.status))]
  const filtered = events.filter((e) => {
    const matchStatus = !statusFilter || e.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || e.title?.toLowerCase().includes(q) || e.profiles?.full_name?.toLowerCase().includes(q) || e.halls?.name?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (loading) return <AppShell title="All Bookings"><PageLoader /></AppShell>

  return (
    <AppShell title="All Bookings">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">All Bookings</div>
          <div className="page-subtitle">{events.length} total bookings</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <input id="admin-search" type="text" className="form-input search-input" style={{ paddingLeft: 'var(--space-4)' }}
            placeholder="Search by event, guest, hall…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          <div className={`filter-chip${!statusFilter ? ' active' : ''}`} onClick={() => setStatusFilter('')}>All</div>
          {statuses.map((s) => <div key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s.replace('_',' ')}</div>)}
        </div>
      </div>

      {filtered.length === 0 ? <EmptyState icon="📋" title="No bookings found" /> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Event</th><th>Guest</th><th>Hall</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                  <td><div style={{ fontWeight: 600 }}>{e.title}</div><div className="text-sm text-muted">{e.event_type}</div></td>
                  <td><div>{e.profiles?.full_name || '—'}</div><div className="text-sm text-muted">{e.profiles?.email}</div></td>
                  <td className="text-sm">{e.halls?.name}<div className="text-sm text-muted">{e.halls?.city}</div></td>
                  <td>{formatDate(e.event_date)}</td>
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
