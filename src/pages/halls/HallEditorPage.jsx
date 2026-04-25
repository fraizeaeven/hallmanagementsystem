import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AMENITIES_LIST } from '@/lib/constants'

export default function HallEditorPage() {
  const { id } = useParams()  // 'new' or uuid
  const isNew = id === 'new'
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving]   = useState(false)
  const [amenities, setAmenities] = useState([])
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (!isNew) {
      supabase.from('halls').select('*').eq('id', id).single().then(({ data }) => {
        if (data) { reset(data); setAmenities(data.amenities || []) }
        setLoading(false)
      })
    }
  }, [id])

  const toggleAmenity = (a) => setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])

  const onSubmit = async (form) => {
    setSaving(true)
    const payload = {
      owner_id: user.id,
      name: form.name,
      description: form.description,
      address: form.address,
      city: form.city,
      capacity: parseInt(form.capacity) || 0,
      price_per_day: parseFloat(form.price_per_day) || 0,
      amenities,
      is_active: true,
      is_approved: false,
    }
    if (isNew) {
      const { data, error } = await supabase.from('halls').insert(payload).select().single()
      if (error) toast({ type: 'error', title: 'Error', message: error.message })
      else { toast({ type: 'success', title: 'Hall listed!', message: 'Pending admin approval.' }); navigate('/my-halls') }
    } else {
      const { error } = await supabase.from('halls').update(payload).eq('id', id)
      if (error) toast({ type: 'error', title: 'Error', message: error.message })
      else { toast({ type: 'success', title: 'Hall updated!' }); navigate('/my-halls') }
    }
    setSaving(false)
  }

  if (loading) return <AppShell title="Hall Editor"><PageLoader /></AppShell>

  return (
    <AppShell title={isNew ? 'Add New Hall' : 'Edit Hall'}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-halls')} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={16} /> Back to My Halls
      </button>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="section-gap">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Hall Information</div>
            <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Hall Name <span>*</span></label>
                <input id="hall-name" type="text" className="form-input" placeholder="e.g. The Crystal Ballroom"
                  {...register('name', { required: 'Required' })} />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City <span>*</span></label>
                  <input id="hall-city" type="text" className="form-input" placeholder="Kuala Lumpur"
                    {...register('city', { required: 'Required' })} />
                  {errors.city && <span className="form-error">{errors.city.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (pax) <span>*</span></label>
                  <input id="hall-capacity" type="number" className="form-input" placeholder="300"
                    {...register('capacity', { required: 'Required', min: 1 })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Address</label>
                <input id="hall-address" type="text" className="form-input" placeholder="No. 1, Jalan Utama, KL"
                  {...register('address')} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Per Day (MYR) <span>*</span></label>
                <input id="hall-price" type="number" step="0.01" className="form-input" placeholder="5000"
                  {...register('price_per_day', { required: 'Required', min: 0 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="hall-desc" className="form-textarea" rows={4} placeholder="Describe your hall — layout, vibe, what makes it special…"
                  {...register('description')} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Amenities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
              {AMENITIES_LIST.map((a) => (
                <div key={a} onClick={() => toggleAmenity(a)} className={`vendor-select-item${amenities.includes(a) ? ' selected' : ''}`}
                  style={{ padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}
                  role="checkbox" aria-checked={amenities.includes(a)} tabIndex={0}>
                  {amenities.includes(a) && <Check size={14} style={{ color: 'var(--brand)' }} />}
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/my-halls')}>Cancel</button>
            <button id="save-hall-btn" type="submit" className={`btn btn-primary btn-lg${saving ? ' btn-loading' : ''}`} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Submit for Approval' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  )
}
