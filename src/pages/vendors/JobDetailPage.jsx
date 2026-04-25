import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, Clock, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'
import { VENDOR_CATEGORIES, buildWhatsAppLink } from '@/lib/constants'

export default function JobDetailPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob]     = useState(null)
  const [event, setEvent] = useState(null)
  const [hall, setHall]   = useState(null)
  const [coServices, setCoServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('vendors').select('id').eq('owner_id', user.id).single().then(async ({ data: v }) => {
      if (!v) { setLoading(false); return }
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single()
      const { data: jb } = await supabase.from('event_services').select('*, vendor_services(name,category)').eq('event_id', eventId).eq('vendor_id', v.id).limit(1).single()
      const { data: h } = await supabase.from('halls').select('*, profiles!halls_owner_id_fkey(full_name,phone)').eq('id', ev?.hall_id).single()
      const { data: cvs } = await supabase.from('event_services').select('*, vendor_services(name,category), vendors(business_name,whatsapp)').eq('event_id', eventId).neq('vendor_id', v.id)
      setEvent(ev); setJob(jb); setHall(h); setCoServices(cvs || [])
      setLoading(false)
    })
  }, [eventId, user])

  if (loading) return <AppShell title="Job Detail"><PageLoader /></AppShell>
  if (!event || !job) return <AppShell title="Job Detail"><div className="empty-state"><div className="empty-state-title">Job not found</div></div></AppShell>

  return (
    <AppShell title={event.title}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={16} /> Back to Jobs
      </button>

      <div className="detail-hero" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
            <StatusBadge status={job.status} />
            <span className="text-sm text-muted">{event.event_type}</span>
          </div>
          <div className="detail-hero-title">{event.title}</div>
          <div className="detail-hero-meta">
            <div className="detail-meta-item">📅 {formatDate(event.event_date)}</div>
            <div className="detail-meta-item"><Clock size={14} /> {event.start_time} – {event.end_time}</div>
            <div className="detail-meta-item"><Users size={14} /> {event.guest_count} guests</div>
            {hall && <div className="detail-meta-item"><MapPin size={14} /> {hall.name}, {hall.city}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-sm text-muted">Your fee</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--accent)' }}>
            {formatCurrency(job.price)}
          </div>
          <div className="text-sm text-muted" style={{ marginTop: 4 }}>{job.vendor_services?.name}</div>
        </div>
      </div>

      <div className="event-package">
        <div className="section-gap">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Event Timeline</div>
            <div className="timeline">
              {[
                { time: event.setup_time,    label: 'Setup begins', desc: 'Your crew should arrive' },
                { time: event.start_time,    label: 'Event starts', desc: event.title },
                { time: event.end_time,      label: 'Event ends',   desc: 'Main program wraps' },
                { time: event.teardown_time, label: 'Teardown',     desc: 'Clear your equipment' },
              ].map((item, i, arr) => (
                <div className="timeline-item" key={i}>
                  <div className="timeline-time">{item.time}</div>
                  <div className="timeline-connector">
                    <div className="timeline-dot" />
                    {i < arr.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="t-title">{item.label}</div>
                    <div className="t-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {coServices.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Other Vendors at This Event</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {coServices.map((cv) => {
                  const cat = VENDOR_CATEGORIES.find((c) => c.value === cv.vendor_services?.category)
                  return (
                    <div key={cv.id} className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 20 }}>{cat?.icon || '✨'}</span>
                        <div>
                          <div className="font-semibold text-sm">{cv.vendor_services?.name}</div>
                          <div className="text-sm text-muted">by {cv.vendors?.business_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={cv.status} />
                        {cv.vendors?.whatsapp && (
                          <a href={buildWhatsAppLink(cv.vendors.whatsapp, `Hi, we're both assigned to "${event.title}" on ${formatDate(event.event_date)}`)}
                            target="_blank" rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm btn-icon" style={{ color: '#25D366' }} title="WhatsApp vendor">
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="section-gap">
          {hall && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Venue Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{hall.name}</div>
                <div className="flex items-center gap-2 text-sm text-secondary"><MapPin size={13} />{hall.address}</div>
                <div className="text-sm text-secondary">📍 {hall.city}</div>
                <div className="text-sm text-secondary"><Users size={13} /> Capacity: {hall.capacity} pax</div>
              </div>
              {hall.profiles?.phone && (
                <a href={buildWhatsAppLink(hall.profiles.phone, `Hi, I'm a vendor for event "${event.title}" on ${formatDate(event.event_date)}`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-success btn-sm" style={{ marginTop: 'var(--space-4)', background: '#25D366', border: 'none' }}>
                  <MessageCircle size={14} /> WhatsApp Hall Owner
                </a>
              )}
            </div>
          )}

          {event.notes && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>Notes from Guest</div>
              <p className="text-sm text-secondary" style={{ lineHeight: 1.8 }}>{event.notes}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
