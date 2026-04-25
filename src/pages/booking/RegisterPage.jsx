import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Check, Eye, EyeOff } from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/helpers'

const STEPS = [
  { label: 'Hall', done: true },
  { label: 'Vendors', done: true },
  { label: 'Review', done: true },
  { label: 'Register', active: true },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { booking, totalCost } = useBooking()
  const { signUp, signIn } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('register') // 'register' or 'login'

  if (!booking.hall) {
    // Demo mode — still show the form with placeholder data
  }

  const onRegister = async (form) => {
    setSaving(true); setError('')
    const { error: err } = await signUp({
      email: form.email, password: form.password,
      fullName: form.fullName, role: 'guest',
    })
    if (err) { setError(err.message); setSaving(false); return }
    // After signup, proceed to confirmation
    navigate('/booking/confirmed')
    setSaving(false)
  }

  const onLogin = async (form) => {
    setSaving(true); setError('')
    const { error: err } = await signIn({ email: form.email, password: form.password })
    if (err) { setError(err.message); setSaving(false); return }
    navigate('/booking/confirmed')
    setSaving(false)
  }

  const previewHall = booking.hall?.name || 'Grand Ballroom KL'
  const previewDate = booking.eventDate || 'Date TBD'
  const previewCost = totalCost || 15000

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

      <div className="register-page">
        <div className="register-card animate-in">
          <div className="register-card-accent" />
          <div className="register-card-body">
            {/* Booking preview */}
            <div className="register-booking-preview">
              <div className="register-booking-label">Your booking</div>
              <div className="register-booking-value">
                {previewHall} · {typeof previewDate === 'string' && previewDate !== 'Date TBD' ? formatDate(previewDate) : previewDate} · {formatCurrency(previewCost)}
              </div>
            </div>

            <h2 className="register-title">
              {mode === 'register' ? 'Almost there!' : 'Welcome back'}
            </h2>
            <p className="register-subtitle">
              {mode === 'register'
                ? 'Create a free account to save your booking.'
                : 'Sign in to confirm your booking.'
              }
            </p>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: 0, background: 'var(--gray-100)', padding: 4, borderRadius: 'var(--r-lg)', marginBottom: 'var(--s-6)' }}>
              <button style={{ flex: 1, height: 38, borderRadius: 'var(--r)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: mode === 'register' ? 'var(--shadow-xs)' : 'none', transition: 'all 200ms' }} onClick={() => setMode('register')}>Register</button>
              <button style={{ flex: 1, height: 38, borderRadius: 'var(--r)', fontSize: 'var(--text-sm)', fontWeight: 600, border: 'none', background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: mode === 'login' ? 'var(--shadow-xs)' : 'none', transition: 'all 200ms' }} onClick={() => setMode('login')}>Sign In</button>
            </div>

            {error && (
              <div style={{ padding: 'var(--s-3) var(--s-4)', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r)', color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-4)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(mode === 'register' ? onRegister : onLogin)} id="register-form">
              <div className="stack" style={{ gap: 'var(--s-4)' }}>
                {mode === 'register' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Full Name <span>*</span></label>
                      <input className={`input${errors.fullName ? ' input-error' : ''}`} type="text" placeholder="Your full name"
                        {...register('fullName', { required: 'Required' })} id="reg-name" />
                      {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Phone</label>
                      <input className="input" type="text" placeholder="+60123456789" {...register('phone')} id="reg-phone" />
                    </div>
                  </>
                )}
                <div className="input-group">
                  <label className="input-label">Email <span>*</span></label>
                  <input className={`input${errors.email ? ' input-error' : ''}`} type="email" placeholder="you@example.com"
                    {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} id="reg-email" />
                  {errors.email && <span className="error-text">{errors.email.message}</span>}
                </div>
                <div className="input-group">
                  <label className="input-label">Password <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input className={`input${errors.password ? ' input-error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                      {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} id="reg-pw" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password.message}</span>}
                </div>
                <button type="submit" className={`btn btn-primary btn-xl btn-block${saving ? ' btn-loading' : ''}`} disabled={saving} id="submit-register">
                  {saving ? 'Processing…' : mode === 'register' ? 'Create Account & Confirm' : 'Sign In & Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
