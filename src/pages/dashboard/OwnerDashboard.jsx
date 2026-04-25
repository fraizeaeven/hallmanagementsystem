import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, Users, Clock, Plus, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { KPICard, EmptyState, PageLoader } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [halls, setHalls]     = useState([])
  const [events, setEvents]   = useState([])
  const [collabs, setCollabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: h } = await supabase.from('halls').select('*').eq('owner_id', user.id)
    setHalls(h || [])
    if (h?.length) {
      const ids = h.map((x) => x.id)
      const [{ data: ev }, { data: cl }] = await Promise.all([
        supabase.from('events').select('*, profiles!events_guest_id_fkey(full_name,phone)').in('hall_id', ids).order('event_date', { ascending: true }).limit(10),
        supabase.from('hall_vendor_collabs').select('*, vendors(business_name,whatsapp)').in('hall_id', ids),
      ])
      setEvents(ev || [])
      setCollabs(cl || [])
    }
    setLoading(false)
  }

  const pending = events.filter((e) => e.status === 'pending')
  const upcoming = events.filter((e) => ['confirmed','in_progress'].includes(e.status))
  const revenue = events.filter((e) => e.status === 'completed').reduce((s, e) => s + (+e.total_cost || 0), 0)

  if (loading) return <AppShell title="Dashboard"><PageLoader /></AppShell>

  if (halls.length === 0) return (
    <AppShell title="Dashboard">
      <EmptyState icon="🏢" title="No halls listed yet" description="List your first hall and start receiving bookings."
        action={<button className="btn btn-primary btn-lg" onClick={() => navigate('/my-halls/new')} id="add-first-hall">Add Hall →</button>} />
    </AppShell>
  )

  return (
    <AppShell title="Dashboard">
      <div className="section-gap">
        <div className="kpi-grid">
          <KPICard label="My Halls"       value={halls.length}       icon={Building2}    variant="brand" />
          <KPICard label="Pending Bookings" value={pending.length}   icon={Clock}        variant="warning" />
          <KPICard label="Upcoming"       value={upcoming.length}    icon={CalendarDays} variant="accent" />
          <KPICard label="Total Revenue"  value={formatCurrency(revenue)} icon={Users}   variant="success" />
        </div>

        {/* Pending bookings */}
        {pending.length > 0 && (
          <>
            <div className="page-header">
              <div className="page-header-left">
                <div className="page-title">⏳ Pending Bookings</div>
                <div className="page-subtitle">Awaiting your confirmation</div>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Event</th><th>Guest</th><th>Date</th><th>Guests</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {pending.map((e) => (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${e.id}`)}>
                      <td><div style={{ fontWeight: 600 }}>{e.title}</div><div className="text-sm text-muted">{e.event_type}</div></td>
                      <td>
                        <div>{e.profiles?.full_name || '—'}</div>
                        {e.profiles?.phone && (
                          <a href={`https://wa.me/${e.profiles.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm" style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={(ev) => ev.stopPropagation()}>
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        )}
                      </td>
                      <td>{formatDate(e.event_date)}</td>
                      <td>{e.guest_count}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(e.total_cost)}</td>
                      <td style={{ color: 'var(--brand-light)', fontSize: 'var(--text-sm)' }}>Review →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Collab vendors */}
        {collabs.length > 0 && (
          <>
            <div className="page-header">
              <div className="page-header-left">
                <div className="page-title">🤝 Collab Vendors</div>
                <div className="page-subtitle">{collabs.length} vendor{collabs.length !== 1 ? 's' : ''} partnered with your halls</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/collabs')}>Manage →</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {collabs.slice(0, 6).map((c) => (
                <div key={c.id} className="card" style={{ cursor: 'default', flex: '0 1 220px' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.vendors?.business_name || '—'}</div>
                  {c.vendors?.whatsapp && (
                    <a href={`https://wa.me/${c.vendors.whatsapp}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm" style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
