import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, XCircle, CheckCircle2, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { EventPackageSummary } from '@/components/bookings/EventCard'
import { StatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'
import { buildWhatsAppLink } from '@/lib/constants'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { sendNotification } = useNotifications()
  const [event, setEvent]     = useState(null)
  const [hall, setHall]       = useState(null)
  const [services, setServices] = useState([])
  const [hallOwnerPhone, setHallOwnerPhone] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
    if (!ev) { setLoading(false); return }
    setEvent(ev)

    const [{ data: h }, { data: svc }] = await Promise.all([
      supabase.from('halls').select('*, profiles!halls_owner_id_fkey(full_name,phone)').eq('id', ev.hall_id).single(),
      supabase.from('event_services').select('*, vendor_services(name,category,price_type), vendors(business_name,whatsapp,owner_id)').eq('event_id', id),
    ])
    setHall(h)
    setHallOwnerPhone(h?.profiles?.phone || '')
    setServices(svc || [])
    setLoading(false)
  }

  async function changeStatus(newStatus) {
    const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', id)
    if (!error) {
      toast({ type: 'success', title: `Booking ${newStatus}` })
      await sendNotification({ userId: event.guest_id, eventId: id, type: 'status_changed',
        title: `Booking ${newStatus}: ${event.title}`, body: formatDate(event.event_date) })
      fetchAll()
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this booking?')) return
    changeStatus('cancelled')
  }

  if (loading) return <AppShell title="Event Detail"><PageLoader /></AppShell>
  if (!event) return <AppShell title="Event Detail"><div className="empty-state"><div className="empty-state-title">Event not found</div></div></AppShell>

  const isGuest = profile?.role === 'guest' && event.guest_id === user?.id
  const isOwner = profile?.role === 'hall_owner'
  const isAdmin = profile?.role === 'admin'
  const canCancel = (isGuest || isAdmin) && !['cancelled','completed'].includes(event.status)
  const canConfirm = (isOwner || isAdmin) && event.status === 'pending'
  const canMarkDone = (isOwner || isAdmin) && event.status === 'confirmed'

  return (
    <AppShell title={event.title}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="detail-hero" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
            <StatusBadge status={event.status} />
            <span className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>{event.event_type}</span>
          </div>
          <div className="detail-hero-title">{event.title}</div>
          <div className="detail-hero-meta">
            <div className="detail-meta-item">📅 {formatDate(event.event_date)}</div>
            <div className="detail-meta-item">⏰ {event.start_time} – {event.end_time}</div>
            <div className="detail-meta-item">👥 {event.guest_count} guests</div>
            {hall && <div className="detail-meta-item">📍 {hall.name}, {hall.city}</div>}
          </div>
        </div>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          {canConfirm && (
            <button className="btn btn-success" onClick={() => changeStatus('confirmed')} id="confirm-event-btn">
              <CheckCircle2 size={15} /> Confirm Booking
            </button>
          )}
          {canMarkDone && (
            <button className="btn btn-primary" onClick={() => changeStatus('completed')} id="complete-event-btn">
              ✅ Mark Complete
            </button>
          )}
          {hallOwnerPhone && isGuest && (
            <a href={buildWhatsAppLink(hallOwnerPhone, `Hi, regarding my booking "${event.title}" on ${formatDate(event.event_date)}`)}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-success" style={{ background: '#25D366', border: 'none' }}>
              <MessageCircle size={15} /> WhatsApp Owner
            </a>
          )}
          {canCancel && (
            <button className="btn btn-danger" onClick={handleCancel} id="cancel-event-btn">
              <XCircle size={15} /> Cancel
            </button>
          )}
        </div>
      </div>

      {event.status === 'pending' && isGuest && (
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4) var(--space-5)', background: 'var(--warning-ghost)', border: '1px solid hsl(38 92% 55% / 30%)', borderRadius: 'var(--radius-lg)', color: 'var(--warning)', fontSize: 'var(--text-sm)' }}>
          ⏳ <strong>Pending confirmation.</strong> The hall owner will review and confirm your booking.
        </div>
      )}

      <EventPackageSummary event={event} hall={hall} services={services} hallOwnerPhone={hallOwnerPhone} />
    </AppShell>
  )
}
