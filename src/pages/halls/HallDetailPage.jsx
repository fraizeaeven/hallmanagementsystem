import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Star, Check } from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/helpers'
import AvailabilityCalendar from '@/components/halls/AvailabilityCalendar'

const AMENITY_ICONS = {
  Parking: '🅿️', WiFi: '📶', Stage: '🎭', 'Air Conditioning': '❄️',
  'Sound System': '🔊', Projector: '📽️', 'Dressing Room': '👗',
  Kitchen: '🍳', 'Outdoor Garden': '🌿', 'Prayer Room': '🕌',
  'Valet Service': '🚗', 'Backup Generator': '⚡', Elevator: '🛗', 'CCTV Security': '📹',
}

export default function HallDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { booking, selectHall, update } = useBooking()
  const [hall, setHall] = useState(booking.hall)
  const [blocked, setBlocked] = useState([])
  const [selectedDate, setSelectedDate] = useState(booking.eventDate || '')  // ISO string yyyy-MM-dd
  const [loading, setLoading] = useState(!booking.hall)

  useEffect(() => {
    async function load() {
      if (booking.hall?.id === id) {
        setHall(booking.hall)
        setLoading(false)
      } else {
        const { data } = await supabase.from('halls').select('*').eq('id', id).single()
        if (data) { setHall(data); selectHall(data) }
        setLoading(false)
      }
      // Fetch blocked dates
      const { data: avail } = await supabase.from('hall_availability').select('blocked_date').eq('hall_id', id)
      setBlocked(avail?.map((a) => a.blocked_date) || [])
    }
    load()
  }, [id])

  const handleSelectHall = () => {
    update({ eventDate: selectedDate })
    selectHall(hall)
    navigate('/booking/vendors')
  }

  if (loading) return <div className="page-loader" style={{ minHeight: '100vh' }}><div className="spinner" /></div>

  const amenities = Array.isArray(hall?.amenities) ? hall.amenities : []
  const fakeRating = (4.5 + Math.random() * 0.4).toFixed(1)

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo"><div className="nav-logo-icon">🏛️</div> EventNest</a>
          <div className="nav-links">
            <button className="nav-link" onClick={() => navigate('/auth')}>Sign In</button>
          </div>
        </div>
      </nav>

      <div className="detail-container animate-in">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/halls')} style={{ marginBottom: 'var(--s-5)' }}>
          <ArrowLeft size={16} /> Back to listings
        </button>

        {/* Gallery */}
        <div className="gallery" style={{ marginBottom: 'var(--s-8)' }}>
          <div className="gallery-main">
            <div className="gallery-placeholder">🏛️</div>
          </div>
          <div className="gallery-placeholder" style={{ fontSize: 32 }}>📸</div>
          <div className="gallery-placeholder" style={{ fontSize: 32 }}>🌅</div>
        </div>

        <div className="detail-layout">
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--s-2)' }}>
              <span className="badge badge-brand">Verified</span>
              <div className="detail-rating"><Star size={14} fill="var(--amber)" color="var(--amber)" /> {fakeRating} · 87 reviews</div>
            </div>
            <h1 className="detail-title">{hall?.name || 'Hall'}</h1>
            <div className="detail-location"><MapPin size={16} /> {hall?.address}, {hall?.city}</div>

            {/* About */}
            <div className="detail-section">
              <h2 className="detail-section-title">About this venue</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 'var(--text-sm)' }}>
                {hall?.description || `${hall?.name} is a premium event venue located in ${hall?.city}. With a capacity of up to ${hall?.capacity} guests, this versatile space is perfect for weddings, corporate events, and celebrations of all kinds.`}
              </p>
              <div className="flex gap-6 mt-6">
                <div style={{ padding: 'var(--s-4) var(--s-6)', background: 'var(--gray-50)', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)' }}>{hall?.capacity}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Max Guests</div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="detail-section">
                <h2 className="detail-section-title">Amenities</h2>
                <div className="amenity-list">
                  {amenities.map((a) => (
                    <span key={a} className="amenity-chip">
                      <span>{AMENITY_ICONS[a] || '✓'}</span> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="detail-section">
              <h2 className="detail-section-title">Pick a date</h2>
              <div style={{ maxWidth: 400 }}>
                <AvailabilityCalendar
                  blockedDates={blocked}
                  selected={selectedDate ? new Date(selectedDate) : null}
                  onSelect={(d) => setSelectedDate(d instanceof Date ? d.toISOString().split('T')[0] : d)}
                />
              </div>
              {selectedDate && (
                <div className="mt-4 flex items-center gap-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)' }}>
                  <Check size={16} /> Selected: <strong>{formatDate(selectedDate)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Booking Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-sidebar-price">
              {formatCurrency(hall?.price_per_day)}
              <span className="unit"> / day</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              All-inclusive venue rental
            </div>
            <div className="booking-sidebar-divider" />

            <div className="stack" style={{ gap: 'var(--s-4)' }}>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input className="input input-sm" type="date" value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="input-group">
                <label className="input-label">Guests</label>
                <input className="input input-sm" type="number" placeholder="Number of guests"
                  value={booking.eventPax} onChange={(e) => update({ eventPax: e.target.value })}
                  max={hall?.capacity} />
              </div>
              {booking.eventPax && parseInt(booking.eventPax) > (hall?.capacity || 9999) && (
                <div className="error-text">Exceeds capacity of {hall?.capacity}</div>
              )}
            </div>

            <div className="booking-sidebar-divider" />

            <div className="summary-row" style={{ padding: 'var(--s-2) 0' }}>
              <span className="summary-row-label">Venue</span>
              <span className="summary-row-value">{formatCurrency(hall?.price_per_day)}</span>
            </div>
            <div className="summary-row total" style={{ marginTop: 'var(--s-3)', paddingTop: 'var(--s-3)' }}>
              <span className="summary-row-label">Total</span>
              <span className="summary-row-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--brand)' }}>{formatCurrency(hall?.price_per_day)}</span>
            </div>

            <button className="btn btn-primary btn-lg btn-block mt-6" onClick={handleSelectHall}
              disabled={!selectedDate} id="select-hall-btn">
              {selectedDate ? 'Select Hall →' : 'Pick a date first'}
            </button>
            <div className="text-center mt-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              You won't be charged yet
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
