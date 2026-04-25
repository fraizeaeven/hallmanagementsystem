import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, CheckCircle2, Users, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { KPICard, EmptyState, PageLoader } from '@/components/ui/Common'
import { EventCard } from '@/components/bookings/EventCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/helpers'

export default function GuestDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [halls, setHalls]   = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('events').select('*').eq('guest_id', user.id).order('event_date', { ascending: false }).limit(10)
      .then(async ({ data }) => {
        if (data?.length) {
          const ids = [...new Set(data.map((e) => e.hall_id))]
          const { data: hd } = await supabase.from('halls').select('id,name,city').in('id', ids)
          const hm = {}; hd?.forEach((h) => (hm[h.id] = h))
          setHalls(hm)
        }
        setEvents(data || [])
        setLoading(false)
      })
  }, [user])

  const upcoming = events.filter((e) => ['pending','confirmed','in_progress'].includes(e.status))
  const total    = events.reduce((s, e) => s + (+e.total_cost || 0), 0)

  if (loading) return <AppShell title="Dashboard"><PageLoader /></AppShell>

  return (
    <AppShell title="Dashboard">
      <div className="section-gap">
        <div className="kpi-grid">
          <KPICard label="Total Events"   value={events.length} icon={LayoutDashboard}  variant="brand" />
          <KPICard label="Upcoming"       value={upcoming.length} icon={CalendarDays}    variant="accent" />
          <KPICard label="Confirmed"      value={events.filter((e) => e.status === 'confirmed').length} icon={CheckCircle2} variant="success" />
          <KPICard label="Total Value"    value={formatCurrency(total)} icon={Users}     variant="brand" />
        </div>

        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Recent Events</div>
            <div className="page-subtitle">{events.length} total</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/halls')} id="new-booking-btn">+ New Booking</button>
        </div>

        {events.length === 0 ? (
          <EmptyState icon="🎉" title="No events yet" description="Book your first event to get started."
            action={<button className="btn btn-primary btn-lg" onClick={() => navigate('/halls')}>Browse Halls →</button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
            {events.map((e) => <EventCard key={e.id} event={e} hall={halls[e.hall_id]} />)}
          </div>
        )}
      </div>
    </AppShell>
  )
}
