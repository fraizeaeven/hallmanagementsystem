import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AppShell } from '@/components/layout/AppShell'
import Avatar from '@/components/ui/Avatar'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'

const ROLE_LABELS = { guest: '🎉 Guest', hall_owner: '🏢 Hall Owner', vendor: '🛠️ Vendor', admin: '🧑‍💼 Admin' }

export default function ProfilePage() {
  const { profile, updateProfile, loading } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => { if (profile) reset(profile) }, [profile])

  const onSubmit = async (form) => {
    setSaving(true)
    const { error } = await updateProfile({ full_name: form.full_name, phone: form.phone })
    setSaving(false)
    if (error) toast({ type: 'error', title: 'Update failed', message: error.message })
    else toast({ type: 'success', title: 'Profile updated!' })
  }

  if (loading) return <AppShell title="Profile"><PageLoader /></AppShell>

  return (
    <AppShell title="Profile">
      <div style={{ maxWidth: 600 }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="page-header-left">
            <div className="page-title">My Profile</div>
            <div className="page-subtitle">Manage your account details</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="flex items-center gap-5">
            <Avatar name={profile?.full_name} size="2xl" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{profile?.full_name || '—'}</div>
              <div className="text-sm text-muted">{profile?.email}</div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span className="badge badge-brand">{ROLE_LABELS[profile?.role] || profile?.role}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-5)' }}>Account Information</div>
            <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Full Name <span>*</span></label>
                <input id="profile-name" type="text" className="form-input"
                  {...register('full_name', { required: 'Required' })} />
                {errors.full_name && <span className="form-error">{errors.full_name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={profile?.email || ''} disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <span className="form-hint">Email cannot be changed here.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input id="profile-phone" type="tel" className="form-input" placeholder="+60 12-345 6789"
                  {...register('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div className="form-input" style={{ display: 'flex', alignItems: 'center', opacity: 0.7, cursor: 'not-allowed' }}>
                  {ROLE_LABELS[profile?.role] || profile?.role}
                </div>
                <span className="form-hint">Role is assigned by admin.</span>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-6)' }}>
              <button id="save-profile-btn" type="submit" className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
