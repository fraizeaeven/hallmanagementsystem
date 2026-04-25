import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, MapPin } from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { VENDOR_CATEGORIES, PRICE_TYPE_LABELS } from '@/lib/constants'

// Mock services
const MOCK_SERVICES = [
  { id: 's1', vendor_id: 'v1', name: 'Premium Wedding Catering', category: 'catering', description: 'Full 5-course dinner with setup and service staff. Includes appetizers, main course, desserts, and beverages.', price: 8500, price_type: 'starting_from', vendors: { business_name: 'Royal Kitchen Co.', whatsapp: '60123456789' } },
  { id: 's2', vendor_id: 'v1', name: 'Standard Buffet Package', category: 'catering', description: 'Buffet-style serving for up to 300 pax with local and western cuisine options.', price: 4500, price_type: 'per_pax', vendors: { business_name: 'Royal Kitchen Co.', whatsapp: '60123456789' } },
  { id: 's3', vendor_id: 'v2', name: 'Floral & Draping Decoration', category: 'decor', description: 'Full venue decoration with fresh flowers, fabric draping, and lighting setup.', price: 6000, price_type: 'fixed', vendors: { business_name: 'Bloom & Drape Studio' } },
  { id: 's4', vendor_id: 'v2', name: 'Simple Elegant Decor', category: 'decor', description: 'Minimalist decoration with premium artificial flowers and table centerpieces.', price: 3000, price_type: 'fixed', vendors: { business_name: 'Bloom & Drape Studio' } },
  { id: 's5', vendor_id: 'v3', name: 'Full Day Photography', category: 'photography', description: '12 hours coverage, 2 photographers, 500+ edited photos, and 30-second highlight video.', price: 5500, price_type: 'fixed', vendors: { business_name: 'SnapFrame Studio' } },
  { id: 's6', vendor_id: 'v4', name: 'Live Band Performance', category: 'entertainment', description: '5-piece live band playing throughout the event with custom playlist available.', price: 4000, price_type: 'fixed', vendors: { business_name: 'Harmony Live' } },
  { id: 's7', vendor_id: 'v5', name: 'DJ + Sound & Lighting', category: 'av', description: 'Professional DJ with full PA system, LED uplighting, and fog machine.', price: 3500, price_type: 'fixed', vendors: { business_name: 'BeatDrop Productions' } },
  { id: 's8', vendor_id: 'v6', name: 'Bridal Makeup & Hair', category: 'makeup', description: 'Bridal makeup, hairstyling, touch-ups, and accessories for bride and 2 bridesmaids.', price: 2500, price_type: 'fixed', vendors: { business_name: 'Glow Up Beauty' } },
  { id: 's9', vendor_id: 'v7', name: 'Fresh Floral Arrangements', category: 'florist', description: 'Hand bouquet, corsages, car decoration, and 20 table arrangements.', price: 3800, price_type: 'fixed', vendors: { business_name: 'Petal & Bloom' } },
  { id: 's10', vendor_id: 'v8', name: 'Event MC / Emcee', category: 'emcee', description: 'Professional bilingual MC to host your event with charisma and elegance.', price: 1800, price_type: 'fixed', vendors: { business_name: 'SpeakEasy MC' } },
]

const STEPS = [
  { label: 'Hall', done: true },
  { label: 'Vendors', active: true },
  { label: 'Review' },
  { label: 'Confirm' },
]

export default function VendorSelectionPage() {
  const navigate = useNavigate()
  const { booking, toggleService, hallCost, vendorCost, totalCost } = useBooking()
  const [services, setServices] = useState([])
  const [catFilter, setCatFilter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!booking.hall) navigate('/halls')
  }, [booking.hall])

  useEffect(() => {
    if (!booking.hall) return
    async function load() {
      const { data } = await supabase
        .from('vendor_services')
        .select('*, vendors!inner(id, business_name, whatsapp, is_active, is_approved)')
        .eq('is_active', true)
        .eq('vendors.is_active', true)
        .eq('vendors.is_approved', true)
      if (data?.length) setServices(data)
      else setServices(MOCK_SERVICES)
      setLoading(false)
    }
    load()
  }, [booking.hall])

  const filtered = services.filter((s) => !catFilter || s.category === catFilter)

  if (!booking.hall) return <div className="page-loader" style={{minHeight:'60vh'}}><div className="spinner"/></div>

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo"><div className="nav-logo-icon">🏛️</div> EventNest</a>
        </div>
      </nav>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="step-item">
              <div className={`step-circle${s.done ? ' done' : s.active ? ' active' : ''}`}>
                {s.done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`step-label${s.done ? ' done' : s.active ? ' active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-connector${s.done ? ' done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="page">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/halls/${booking.hall?.id || ''}`)} style={{ marginBottom: 'var(--s-5)' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="summary-layout">
          {/* Main */}
          <div className="animate-in">
            <div className="page-header">
              <h1 className="page-title">Add vendor services</h1>
              <p className="page-subtitle">Optional — enhance your event with professional services.</p>
            </div>

            <div className="cat-pills">
              <div className={`cat-pill${!catFilter ? ' active' : ''}`} onClick={() => setCatFilter(null)}>All</div>
              {VENDOR_CATEGORIES.map((c) => (
                <div key={c.value} className={`cat-pill${catFilter === c.value ? ' active' : ''}`} onClick={() => setCatFilter(c.value)}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>

            {loading ? <div className="page-loader"><div className="spinner" /></div> : (
              <div className="vendor-grid">
                {filtered.map((s) => {
                  const cat = VENDOR_CATEGORIES.find((c) => c.value === s.category)
                  const isSelected = booking.selectedServices.some((sel) => sel.id === s.id)
                  return (
                    <div key={s.id} className={`vendor-card${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleService(s)} id={`svc-${s.id}`}>
                      <div className="vendor-card-check"><Check size={14} /></div>
                      <div className="vendor-card-icon">{cat?.icon || '✨'}</div>
                      <div className="vendor-card-cat">{cat?.label || s.category}</div>
                      <div className="vendor-card-name">{s.name}</div>
                      <div className="vendor-card-desc">{s.description}</div>
                      <div className="vendor-card-price">
                        {s.price_type === 'negotiable' ? (
                          <span style={{ color: 'var(--warning)' }}>Negotiable</span>
                        ) : (
                          <>
                            {s.price_type === 'starting_from' && <span className="label">from </span>}
                            {formatCurrency(s.price)}
                            {s.price_type === 'per_pax' && <span className="label"> /pax</span>}
                            {s.price_type === 'per_hour' && <span className="label"> /hour</span>}
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--s-2)' }}>
                        by {s.vendors?.business_name || '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="booking-sidebar">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--s-4)' }}>
              Your booking
            </div>
            <div className="summary-hall" style={{ marginBottom: 'var(--s-4)' }}>
              <div className="summary-hall-img-placeholder">🏛️</div>
              <div className="summary-hall-info">
                <div className="summary-hall-name">{booking.hall?.name}</div>
                <div className="summary-hall-location"><MapPin size={12} /> {booking.hall?.city}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{formatDate(booking.eventDate)}</div>
              </div>
            </div>

            <div className="booking-sidebar-divider" />

            <div className="summary-row"><span className="summary-row-label">Hall</span><span className="summary-row-value">{formatCurrency(hallCost)}</span></div>
            {booking.selectedServices.map((s) => (
              <div key={s.id} className="summary-row">
                <span className="summary-row-label" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <span className="summary-row-value">{formatCurrency(s.price)}</span>
              </div>
            ))}
            <div className="summary-row total">
              <span className="summary-row-label">Total</span>
              <span className="summary-row-value">{formatCurrency(totalCost)}</span>
            </div>

            <button className="btn btn-primary btn-lg btn-block mt-6" onClick={() => navigate('/booking/summary')} id="continue-to-review">
              Continue to Review <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost btn-sm btn-block mt-2" onClick={() => navigate('/booking/summary')} style={{ color: 'var(--text-muted)' }}>
              Skip vendors →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
