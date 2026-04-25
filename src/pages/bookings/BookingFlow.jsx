import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Check, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import Stepper from '@/components/ui/Stepper'
import { ServiceCard, VendorCategoryFilter } from '@/components/vendors/VendorCard'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { EVENT_TYPES, buildWhatsAppLink } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/helpers'

const STEPS = ['Event Details', 'Add Services', 'Review & Confirm']

export default function BookingFlow() {
  const { hallId } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { sendNotification } = useNotifications()

  const [step, setStep]       = useState(0)
  const [hall, setHall]       = useState(null)
  const [allServices, setAllServices] = useState([])
  const [vendorMap, setVendorMap] = useState({})
  const [selectedServices, setSelectedServices] = useState([])
  const [catFilter, setCatFilter] = useState(null)
  const [tab, setTab]         = useState('recommended') // 'recommended' or 'all'
  const [collabVendorIds, setCollabVendorIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const prefillDate = searchParams.get('date') || ''
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      event_date: prefillDate, setup_time: '08:00', start_time: '10:00',
      end_time: '22:00', teardown_time: '23:00', event_type: 'wedding',
      guest_count: '', title: '', notes: '',
    }
  })
  const formVals = watch()

  useEffect(() => {
    async function load() {
      const { data: h } = await supabase.from('halls').select('*, profiles!halls_owner_id_fkey(full_name,phone)').eq('id', hallId).single()
      setHall(h)

      // Get collab vendors for this hall
      const { data: collabs } = await supabase.from('hall_vendor_collabs').select('vendor_id').eq('hall_id', hallId)
      const cids = (collabs || []).map((c) => c.vendor_id)
      setCollabVendorIds(cids)

      // Get all active services with vendor info
      const { data: svcs } = await supabase
        .from('vendor_services')
        .select('*, vendors!inner(id, business_name, whatsapp, is_active, is_approved)')
        .eq('is_active', true)
        .eq('vendors.is_active', true)
        .eq('vendors.is_approved', true)
      setAllServices(svcs || [])

      // Build vendor map
      const vm = {}
      svcs?.forEach((s) => { if (s.vendors) vm[s.vendors.id] = s.vendors })
      setVendorMap(vm)
      setLoading(false)
    }
    load()
  }, [hallId])

  const toggleService = (svc) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === svc.id) ? prev.filter((s) => s.id !== svc.id) : [...prev, svc]
    )
  }

  // Filter services by tab + category
  const displayServices = allServices.filter((s) => {
    const matchCat = !catFilter || s.category === catFilter
    const matchTab = tab === 'all' || collabVendorIds.includes(s.vendor_id)
    return matchCat && matchTab
  })

  const hallCost = parseFloat(hall?.price_per_day) || 0
  const svcCost  = selectedServices.reduce((s, v) => s + parseFloat(v.price || 0), 0)
  const totalCost = hallCost + svcCost

  const onConfirm = async () => {
    setSaving(true)
    const { data: event, error: evErr } = await supabase.from('events').insert({
      guest_id: user.id, hall_id: hallId, title: formVals.title,
      event_type: formVals.event_type, event_date: formVals.event_date,
      setup_time: formVals.setup_time, start_time: formVals.start_time,
      end_time: formVals.end_time, teardown_time: formVals.teardown_time,
      guest_count: parseInt(formVals.guest_count) || 0, notes: formVals.notes,
      status: 'pending', total_cost: totalCost,
    }).select().single()

    if (evErr) { toast({ type: 'error', title: 'Booking failed', message: evErr.message }); setSaving(false); return }

    // Attach services
    if (selectedServices.length > 0) {
      await supabase.from('event_services').insert(
        selectedServices.map((s) => ({
          event_id: event.id, service_id: s.id,
          vendor_id: s.vendor_id || s.vendors?.id,
          price: s.price, status: 'confirmed',
        }))
      )
    }

    // Notify hall owner
    if (hall?.owner_id) {
      await sendNotification({ userId: hall.owner_id, eventId: event.id, type: 'booking_new',
        title: `New booking: ${formVals.title}`, body: `${formatDate(formVals.event_date)} · ${formVals.guest_count} guests`,
      })
    }

    // Notify vendor owners  
    const notifiedOwners = new Set()
    for (const s of selectedServices) {
      const vid = s.vendor_id || s.vendors?.id
      const vendor = vendorMap[vid]
      if (vendor && !notifiedOwners.has(vid)) {
        notifiedOwners.add(vid)
        // We'd need vendor's owner_id – which we don't have directly from vendor_services
        // The notification system would use vendor.owner_id if we had it
      }
    }

    // Notify guest
    await sendNotification({ userId: user.id, eventId: event.id, type: 'booking_new',
      title: 'Booking submitted!', body: `${formVals.title} · Pending confirmation.`,
    })

    toast({ type: 'success', title: 'Booking created!', message: 'Your event is pending confirmation.' })
    navigate(`/events/${event.id}`)
    setSaving(false)
  }

  if (loading) return <AppShell title="New Booking"><PageLoader /></AppShell>
  if (!hall) return <AppShell title="New Booking"><div className="empty-state"><div className="empty-state-title">Hall not found</div></div></AppShell>

  return (
    <AppShell title="New Booking">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/halls/${hallId}`)} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={16} /> Back to Hall
      </button>
      <Stepper steps={STEPS} currentStep={step} />

      <div className="booking-layout">
        {/* Main */}
        <div>
          {/* STEP 0 */}
          {step === 0 && (
            <form id="booking-step-details" onSubmit={handleSubmit(() => setStep(1))}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Event Details</div>
                <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Event Title <span>*</span></label>
                    <input id="event-title" type="text" className="form-input" placeholder="e.g. Sarah & Ahmad's Wedding"
                      {...register('title', { required: 'Required' })} />
                    {errors.title && <span className="form-error">{errors.title.message}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Event Type <span>*</span></label>
                      <select id="event-type" className="form-select" {...register('event_type', { required: true })}>
                        {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Guest Count <span>*</span></label>
                      <input id="guest-count" type="number" className="form-input" placeholder="200"
                        {...register('guest_count', { required: 'Required', min: { value: 1, message: 'Min 1' } })} />
                      {errors.guest_count && <span className="form-error">{errors.guest_count.message}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Date <span>*</span></label>
                    <input id="event-date" type="date" className="form-input"
                      min={new Date().toISOString().split('T')[0]} {...register('event_date', { required: 'Required' })} />
                    {errors.event_date && <span className="form-error">{errors.event_date.message}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Setup Time</label>
                      <input type="time" className="form-input" {...register('setup_time')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Event Starts</label>
                      <input type="time" className="form-input" {...register('start_time')} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Event Ends</label>
                      <input type="time" className="form-input" {...register('end_time')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teardown Time</label>
                      <input type="time" className="form-input" {...register('teardown_time')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Special Notes</label>
                    <textarea className="form-textarea" placeholder="Any special requirements…" {...register('notes')} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between" style={{ marginTop: 'var(--space-5)' }}>
                <div />
                <button type="submit" className="btn btn-primary btn-lg" id="step-1-next">
                  Next: Add Services <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 1: Services */}
          {step === 1 && (
            <div>
              <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                  Add Vendor Services <span className="text-sm text-muted" style={{ fontWeight: 400 }}>(optional)</span>
                </div>

                {/* Tab: recommended vs all */}
                <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
                  <button className={`tab-btn${tab === 'recommended' ? ' active' : ''}`} onClick={() => setTab('recommended')}>
                    ⭐ Recommended by Hall ({collabVendorIds.length})
                  </button>
                  <button className={`tab-btn${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>
                    🌐 All Vendors
                  </button>
                </div>
                <VendorCategoryFilter value={catFilter} onChange={setCatFilter} />
              </div>

              {displayServices.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                  <div className="empty-state-icon">{tab === 'recommended' ? '⭐' : '✨'}</div>
                  <div className="empty-state-title">{tab === 'recommended' ? 'No recommended vendors yet' : 'No services found'}</div>
                  <div className="empty-state-desc">
                    {tab === 'recommended' ? 'Try "All Vendors" to browse the full marketplace.' : 'Try a different category.'}
                  </div>
                  {tab === 'recommended' && <button className="btn btn-secondary" onClick={() => setTab('all')}>Browse All →</button>}
                </div>
              ) : (
                <div className="vendor-select-grid">
                  {displayServices.map((s) => (
                    <ServiceCard
                      key={s.id} service={s} vendor={vendorMap[s.vendor_id]}
                      selectable selected={!!selectedServices.find((sel) => sel.id === s.id)}
                      onToggle={toggleService}
                    />
                  ))}
                </div>
              )}
              <div className="flex justify-between" style={{ marginTop: 'var(--space-6)' }}>
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(0)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} id="step-2-next">
                  Next: Review <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="section-gap">
              <div className="card">
                <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Review Your Booking</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ padding: 'var(--space-4)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 4 }}>{formVals.title || 'Untitled Event'}</div>
                    <div className="text-sm text-secondary">📅 {formVals.event_date} · ⏰ {formVals.start_time}–{formVals.end_time} · 👥 {formVals.guest_count} guests</div>
                  </div>
                  <div style={{ padding: 'var(--space-4)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>🏢 {hall.name}</div>
                    <div className="text-sm text-muted">{hall.city} · Setup: {formVals.setup_time} · Teardown: {formVals.teardown_time}</div>
                  </div>
                  {selectedServices.length > 0 && (
                    <div style={{ padding: 'var(--space-4)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Services ({selectedServices.length})</div>
                      {selectedServices.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-sm" style={{ marginBottom: 4 }}>
                          <span>{s.name} <span className="text-muted">by {s.vendor?.business_name || vendorMap[s.vendor_id]?.business_name}</span></span>
                          <span style={{ color: 'var(--accent)' }}>{formatCurrency(s.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-card))' }}>
                <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Cost Summary</div>
                <div className="cost-breakdown">
                  <div className="cost-row"><span className="cost-label">Hall ({hall.name})</span><span className="cost-value">{formatCurrency(hallCost)}</span></div>
                  {selectedServices.map((s) => (
                    <div key={s.id} className="cost-row"><span className="cost-label">{s.name}</span><span className="cost-value">{formatCurrency(s.price)}</span></div>
                  ))}
                  <div className="cost-row total"><span>Total Estimate</span><span>{formatCurrency(totalCost)}</span></div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              {hall.profiles?.phone && (
                <div className="card" style={{ background: 'linear-gradient(135deg, hsl(142 50% 12%) 0%, hsl(142 40% 8%) 100%)', border: '1px solid hsl(142 50% 25%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 'var(--space-2)' }}>💬</div>
                  <div style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>Need to discuss with the hall owner?</div>
                  <a href={buildWhatsAppLink(hall.profiles.phone, `Hi! I'd like to book ${hall.name} on ${formVals.event_date} for "${formVals.title}" (${formVals.guest_count} guests).`)}
                    target="_blank" rel="noopener noreferrer"
                    className="btn btn-success" style={{ background: '#25D366', border: 'none' }}>
                    <MessageCircle size={16} /> WhatsApp Hall Owner
                  </a>
                </div>
              )}

              <div className="flex justify-between">
                <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>← Back</button>
                <button id="confirm-booking-btn"
                  className={`btn btn-primary btn-lg${saving ? ' btn-loading' : ''}`}
                  disabled={saving} onClick={onConfirm}>
                  {saving ? 'Submitting…' : '✅ Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="booking-sidebar-card">
            <div className="booking-sidebar-title">🏢 {hall.name}</div>
            <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>{hall.city}</div>
            <div className="cost-breakdown">
              <div className="cost-row"><span className="cost-label">Hall</span><span className="cost-value">{formatCurrency(hallCost)}</span></div>
              {selectedServices.map((s) => (
                <div key={s.id} className="cost-row"><span className="cost-label">{s.name}</span><span className="cost-value">{formatCurrency(s.price)}</span></div>
              ))}
              <div className="cost-row total"><span>Total</span><span>{formatCurrency(totalCost)}</span></div>
            </div>
            {selectedServices.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
