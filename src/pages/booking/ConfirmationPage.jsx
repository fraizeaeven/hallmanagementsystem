import { useNavigate } from 'react-router-dom'
import { Check, Download, MessageCircle, Home, Calendar, MapPin, Users, Clock } from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { VENDOR_CATEGORIES } from '@/lib/constants'

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { booking, hallCost, vendorCost, totalCost } = useBooking()

  // Demo fallback when no booking in context (direct URL access)
  const hall = booking.hall || { name: 'Grand Ballroom KL', city: 'Kuala Lumpur' }
  const eventDate = booking.eventDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const cost = totalCost || 15000

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo"><div className="nav-logo-icon">🏛️</div> EventNest</a>
        </div>
      </nav>

      <div className="confirm-page">
        <div className="confirm-card animate-in">
          {/* Confetti accent */}
          <div style={{ height: 6, background: 'linear-gradient(90deg, var(--brand), var(--accent), var(--amber), var(--coral), var(--brand))' }} />

          <div style={{ padding: 'var(--s-10) var(--s-8)' }}>
            <div className="confirm-check">
              <Check size={32} strokeWidth={3} />
            </div>
            <h1 className="confirm-title">Booking Confirmed! 🎉</h1>
            <p className="confirm-subtitle">
              Your event is booked. We've sent a confirmation to your email. You can manage your booking from your dashboard.
            </p>

            {/* Booking Reference */}
            <div style={{ background: 'var(--brand-50)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', marginBottom: 'var(--s-6)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Reference</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '0.05em', marginTop: 'var(--s-1)' }}>
                EN-{Date.now().toString(36).toUpperCase().slice(-6)}
              </div>
            </div>

            {/* Details */}
            <div className="confirm-details">
              <div className="confirm-row">
                <span className="confirm-row-label flex items-center gap-2"><Calendar size={14} /> Date</span>
                <span className="confirm-row-value">{formatDate(eventDate)}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label flex items-center gap-2"><MapPin size={14} /> Venue</span>
                <span className="confirm-row-value">{hall?.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-row-label flex items-center gap-2"><MapPin size={14} /> Location</span>
                <span className="confirm-row-value">{hall?.city}</span>
              </div>
              {booking.eventPax && (
                <div className="confirm-row">
                  <span className="confirm-row-label flex items-center gap-2"><Users size={14} /> Guests</span>
                  <span className="confirm-row-value">{booking.eventPax} pax</span>
                </div>
              )}
              {booking.selectedServices.length > 0 && (
                <div className="confirm-row">
                  <span className="confirm-row-label">Services</span>
                  <span className="confirm-row-value">{booking.selectedServices.length} vendor{booking.selectedServices.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: 'var(--s-3) 0' }} />
              <div className="confirm-row">
                <span className="confirm-row-label" style={{ fontWeight: 700, color: 'var(--text)' }}>Total</span>
                <span className="confirm-row-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--brand)' }}>{formatCurrency(cost)}</span>
              </div>
            </div>

            {/* Vendors */}
            {booking.selectedServices.length > 0 && (
              <div style={{ margin: '0 var(--s-8) var(--s-6)', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--s-3)' }}>Services included</div>
                {booking.selectedServices.map((s) => {
                  const cat = VENDOR_CATEGORIES.find((c) => c.value === s.category)
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--s-2) 0', fontSize: 'var(--text-sm)' }}>
                      <span>{cat?.icon} {s.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.price)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--s-3)', justifyContent: 'center', flexWrap: 'wrap', padding: '0 var(--s-8)' }}>
              <button className="btn btn-primary" onClick={() => navigate('/')} id="go-home">
                <Home size={16} /> Back to Home
              </button>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Download size={16} /> Download PDF
              </button>
            </div>

            <div className="text-center mt-6" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Need help? Contact us at <a href="mailto:support@eventnest.com" style={{ color: 'var(--brand)' }}>support@eventnest.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
