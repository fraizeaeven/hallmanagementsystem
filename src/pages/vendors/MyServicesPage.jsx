import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { VENDOR_CATEGORIES, PRICE_TYPES, PRICE_TYPE_LABELS, buildWhatsAppLink } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

export default function MyServicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [vendor, setVendor]       = useState(null)
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [editingVendor, setEditingVendor] = useState(false)
  const [svcModal, setSvcModal]   = useState(null)  // null | 'new' | service object

  const vendorForm = useForm()
  const svcForm = useForm()

  useEffect(() => { fetchAll() }, [user])

  async function fetchAll() {
    const { data: v } = await supabase.from('vendors').select('*').eq('owner_id', user.id).single()
    setVendor(v)
    if (v) {
      vendorForm.reset(v)
      const { data: svcs } = await supabase.from('vendor_services').select('*').eq('vendor_id', v.id).order('created_at', { ascending: false })
      setServices(svcs || [])
    }
    setLoading(false)
  }

  // ─── Vendor profile CRUD ───
  const saveVendor = async (form) => {
    setSaving(true)
    const payload = {
      owner_id: user.id, business_name: form.business_name,
      description: form.description || '', contact_email: form.contact_email || '',
      contact_phone: form.contact_phone || '', whatsapp: form.whatsapp || '',
      is_active: true, is_approved: false,
    }
    if (vendor) {
      await supabase.from('vendors').update(payload).eq('id', vendor.id)
      toast({ type: 'success', title: 'Profile updated!' })
    } else {
      const { data } = await supabase.from('vendors').insert(payload).select().single()
      setVendor(data)
      toast({ type: 'success', title: 'Vendor profile created!', message: 'Pending admin approval.' })
    }
    setEditingVendor(false)
    fetchAll()
    setSaving(false)
  }

  // ─── Service CRUD ───
  const openSvcModal = (svc) => {
    if (svc === 'new') {
      svcForm.reset({ name: '', category: 'catering', description: '', price: '', price_type: 'fixed', is_active: true })
    } else {
      svcForm.reset(svc)
    }
    setSvcModal(svc)
  }

  const saveSvc = async (form) => {
    setSaving(true)
    const payload = {
      vendor_id: vendor.id, name: form.name, category: form.category,
      description: form.description || '', price: parseFloat(form.price) || 0,
      price_type: form.price_type || 'fixed', is_active: true,
    }
    if (svcModal === 'new' || !svcModal?.id) {
      await supabase.from('vendor_services').insert(payload)
      toast({ type: 'success', title: 'Service added!' })
    } else {
      await supabase.from('vendor_services').update(payload).eq('id', svcModal.id)
      toast({ type: 'success', title: 'Service updated!' })
    }
    setSvcModal(null)
    fetchAll()
    setSaving(false)
  }

  const deleteSvc = async (id) => {
    if (!confirm('Delete this service?')) return
    await supabase.from('vendor_services').delete().eq('id', id)
    toast({ type: 'info', title: 'Service deleted' })
    fetchAll()
  }

  if (loading) return <AppShell title="My Services"><PageLoader /></AppShell>

  // ─── No vendor yet ───
  if (!vendor && !editingVendor) return (
    <AppShell title="My Services">
      <EmptyState icon="🛠️" title="No vendor profile yet" description="Create your business profile, then add your service items."
        action={<button className="btn btn-primary btn-lg" onClick={() => { vendorForm.reset({}); setEditingVendor(true) }} id="create-vendor-btn">Create Vendor Profile →</button>} />
    </AppShell>
  )

  // ─── Editing vendor profile ───
  if (editingVendor || !vendor) return (
    <AppShell title={vendor ? 'Edit Vendor Profile' : 'Create Vendor Profile'}>
      <form onSubmit={vendorForm.handleSubmit(saveVendor)}>
        <div className="section-gap" style={{ maxWidth: 640 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Business Information</div>
            <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Business Name <span>*</span></label>
                <input id="vendor-name" type="text" className="form-input" placeholder="e.g. Blossom Event Services"
                  {...vendorForm.register('business_name', { required: 'Required' })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input type="email" className="form-input" {...vendorForm.register('contact_email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input type="text" className="form-input" placeholder="+60123456789" {...vendorForm.register('contact_phone')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input type="text" className="form-input" placeholder="60123456789 (no +, no dashes)"
                  {...vendorForm.register('whatsapp')} />
                <span className="form-hint">Guests will use this to contact you via WhatsApp.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Describe your business…"
                  {...vendorForm.register('description')} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-between">
            {vendor && <button type="button" className="btn btn-ghost" onClick={() => setEditingVendor(false)}>Cancel</button>}
            <button type="submit" className={`btn btn-primary btn-lg${saving ? ' btn-loading' : ''}`} disabled={saving} style={{ marginLeft: 'auto' }}>
              {saving ? 'Saving…' : vendor ? 'Save Changes' : 'Create Profile →'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  )

  // ─── Normal view ───
  return (
    <AppShell title="My Services">
      <div className="section-gap">
        {/* Vendor profile card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-card))' }}>
          <div className="flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--brand-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>{vendor.business_name}</div>
              <div className="text-sm text-muted">{vendor.is_approved ? '✅ Approved' : '⏳ Pending approval'}</div>
              {vendor.whatsapp && (
                <a href={buildWhatsAppLink(vendor.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MessageCircle size={13} /> {vendor.whatsapp}
                </a>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { vendorForm.reset(vendor); setEditingVendor(true) }}>
              <Edit2 size={13} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Services list */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Service Items</div>
            <div className="page-subtitle">{services.length} service{services.length !== 1 ? 's' : ''} listed</div>
          </div>
          <button className="btn btn-primary" onClick={() => openSvcModal('new')} id="add-service-btn">
            <Plus size={16} /> Add Service
          </button>
        </div>

        {services.length === 0 ? (
          <EmptyState icon="📋" title="No services yet" description="Add your first service item — e.g. a catering package, photography bundle, etc."
            action={<button className="btn btn-primary btn-lg" onClick={() => openSvcModal('new')}>Add Service →</button>} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {services.map((s) => {
              const cat = VENDOR_CATEGORIES.find((c) => c.value === s.category)
              const pt = PRICE_TYPE_LABELS[s.price_type] || ''
              return (
                <div key={s.id} className="card" style={{ cursor: 'default' }}>
                  <div className="flex items-start gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                    <div className="vendor-cat-icon" style={{ width: 40, height: 40, fontSize: 20 }}>{cat?.icon || '✨'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div className="text-sm text-muted">{cat?.label}</div>
                    </div>
                    {!s.is_active && <span className="badge status-cancelled">Inactive</span>}
                  </div>
                  {s.description && <div className="text-sm text-secondary" style={{ marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>{s.description}</div>}
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
                    {s.price_type === 'negotiable' ? <span style={{ color: 'var(--warning)' }}>Negotiable</span> : <>{pt === 'from' && <span className="text-sm text-muted">from </span>}{formatCurrency(s.price)}{s.price_type !== 'fixed' && s.price_type !== 'starting_from' ? <span className="text-sm text-muted"> {pt}</span> : ''}</>}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => openSvcModal(s)}>
                      <Edit2 size={12} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSvc(s.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Service Modal */}
      <Modal isOpen={!!svcModal} onClose={() => setSvcModal(null)} title={svcModal === 'new' ? 'Add Service' : 'Edit Service'}
        footer={
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => setSvcModal(null)}>Cancel</button>
            <button className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving}
              onClick={svcForm.handleSubmit(saveSvc)} id="save-service-btn">
              {saving ? 'Saving…' : 'Save Service'}
            </button>
          </div>
        }>
        <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Service Name <span>*</span></label>
            <input type="text" className="form-input" placeholder="e.g. Premium Wedding Package"
              {...svcForm.register('name', { required: 'Required' })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" {...svcForm.register('category')}>
                {VENDOR_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price Type</label>
              <select className="form-select" {...svcForm.register('price_type')}>
                {PRICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Price (MYR)</label>
            <input type="number" step="0.01" className="form-input" placeholder="5000" {...svcForm.register('price')} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="What's included…" {...svcForm.register('description')} />
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
