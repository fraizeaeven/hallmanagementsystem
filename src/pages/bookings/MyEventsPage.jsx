import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { EventCard } from '@/components/bookings/EventCard'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function MyEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [halls, setHalls]   = useState({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    supabase.from('events').select('*').eq('guest_id', user.id).order('event_date', { ascending: false })
      .then(async ({ data }) => {
        if (data?.length) {
          const ids = [...new Set(data.map((e) => e.hall_id))]
          const { data: hd } = await supabase.from('halls').select('id,name,city').in('id', ids)
          const hm = {}; hd?.forEach((h) => (hm[h.id] = h))
          setHalls(hm); setEvents(data)
        }
        setLoading(false)
      })
  }, [user])

  const statuses = [...new Set(events.map((e) => e.status))]
  const filtered = statusFilter ? events.filter((e) => e.status === statusFilter) : events

  if (loading) return <AppShell title="My Events"><PageLoader /></AppShell>

  return (
    <AppShell title="My Events">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">My Events</div>
          <div className="page-subtitle">{events.length} total event{events.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/halls')} id="new-event-btn">+ New Booking</button>
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
        <EmptyState icon="📅" title="No events yet" description="Create your first booking to get started."
          action={<button className="btn btn-primary btn-lg" onClick={() => navigate('/halls')}>Browse Halls →</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((e) => <EventCard key={e.id} event={e} hall={halls[e.hall_id]} />)}
        </div>
      )}
    </AppShell>
  )
}
