import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, MapPin, ChevronRight, MessageCircle } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/helpers'
import { buildWhatsAppLink } from '@/lib/constants'

export function EventCard({ event, hall, services = [] }) {
  const navigate = useNavigate()

  return (
    <div className="event-card" onClick={() => navigate(`/events/${event.id}`)} role="button" tabIndex={0}>
      <div className="event-card-accent" />
      <div className="event-card-body">
        <div className="flex items-center justify-between mb-2">
          <div className="event-card-title">{event.title}</div>
          <StatusBadge status={event.status} />
        </div>
        <div className="event-card-meta">
          <div className="event-card-meta-item"><Calendar size={13} /> {formatDate(event.event_date)}</div>
          <div className="event-card-meta-item"><Clock size={13} /> {event.start_time} – {event.end_time}</div>
          {hall && <div className="event-card-meta-item"><MapPin size={13} /> {hall.name}</div>}
          <div className="event-card-meta-item"><Users size={13} /> {event.guest_count} guests</div>
        </div>
      </div>
      <div className="event-card-footer">
        <div>
          <div className="text-sm text-muted">Total</div>
          <div style={{ fontWeight: 700, color: 'var(--brand-light)' }}>{formatCurrency(event.total_cost)}</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          {services.length > 0 && <span>{services.length} service{services.length !== 1 ? 's' : ''}</span>}
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  )
}

export function EventPackageSummary({ event, hall, services = [], hallOwnerPhone }) {
  return (
    <div className="event-package">
      {/* Left column */}
      <div className="section-gap">
        {/* Timeline */}
        <div className="card">
          <div className="card-header"><div className="card-title">Event Timeline</div></div>
          <div className="timeline">
            {[
              { time: event.setup_time,     label: 'Setup begins',   desc: 'Vendors & crew arrive', dot: 'accent' },
              { time: event.start_time,     label: 'Event starts',   desc: event.title },
              { time: event.end_time,       label: 'Event ends',     desc: 'Main program wraps up' },
              { time: event.teardown_time,  label: 'Teardown',       desc: 'Venue clearing', dot: 'accent' },
            ].map((item, i, arr) => (
              <div className="timeline-item" key={i}>
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-connector">
                  <div className={`timeline-dot${item.dot ? ` ${item.dot}` : ''}`} />
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

        {/* Services / vendors */}
        {services.length > 0 && (
          <div className="card">
            <div className="card-header"><div className="card-title">Vendors & Services</div></div>
            <div className="section-gap" style={{ gap: 'var(--space-3)' }}>
              {services.map((es) => (
                <div key={es.id} className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{es.vendor_services?.name || '—'}</div>
                    <div className="text-sm text-muted">by {es.vendors?.business_name} · {es.vendor_services?.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div>
                      <StatusBadge status={es.status} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: 4 }}>{formatCurrency(es.price)}</div>
                    </div>
                    {es.vendors?.whatsapp && (
                      <a href={buildWhatsAppLink(es.vendors.whatsapp, `Hi, regarding event "${event.title}" on ${formatDate(event.event_date)}`)}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-ghost btn-sm btn-icon"
                        title="WhatsApp vendor"
                        style={{ color: '#25D366' }}>
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>{event.notes}</p>
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="section-gap">
        {/* Cost */}
        <div className="card">
          <div className="card-header"><div className="card-title">Cost Summary</div></div>
          <div className="cost-breakdown">
            <div className="cost-row"><span className="cost-label">Hall ({hall?.name || '–'})</span><span className="cost-value">{formatCurrency(hall?.price_per_day)}</span></div>
            {services.map((es) => (
              <div key={es.id} className="cost-row">
                <span className="cost-label">{es.vendor_services?.name}</span>
                <span className="cost-value">{formatCurrency(es.price)}</span>
              </div>
            ))}
            <div className="cost-row total"><span>Total</span><span>{formatCurrency(event.total_cost)}</span></div>
          </div>
        </div>

        {/* Venue */}
        {hall && (
          <div className="card">
            <div className="card-header"><div className="card-title">Venue</div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ fontWeight: 600 }}>{hall.name}</div>
              <div className="text-sm text-secondary flex items-center gap-2"><MapPin size={13} />{hall.address}, {hall.city}</div>
              <div className="text-sm text-secondary flex items-center gap-2"><Users size={13} />Capacity: {hall.capacity} pax</div>
            </div>
            {hallOwnerPhone && (
              <a href={buildWhatsAppLink(hallOwnerPhone, `Hi, regarding booking "${event.title}" on ${formatDate(event.event_date)}`)}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-success btn-sm" style={{ marginTop: 'var(--space-4)', background: '#25D366', border: 'none' }}>
                <MessageCircle size={14} /> WhatsApp Hall Owner
              </a>
            )}
          </div>
        )}

        {/* Quick WhatsApp CTA */}
        <div className="card" style={{ background: 'linear-gradient(135deg, hsl(142 50% 12%) 0%, hsl(142 40% 8%) 100%)', border: '1px solid hsl(142 50% 25%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 'var(--space-2)' }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Need to coordinate?</div>
            <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
              Use WhatsApp buttons above to contact vendors or the hall owner directly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
