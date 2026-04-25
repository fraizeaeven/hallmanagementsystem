import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Common'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

const ROLES = [
  { value: 'guest',      label: 'Guest',      icon: '🎉', desc: 'Find & book halls + vendors' },
  { value: 'hall_owner', label: 'Hall Owner',  icon: '🏢', desc: 'List & manage your halls' },
  { value: 'vendor',     label: 'Vendor',      icon: '🛠️', desc: 'List services & get jobs' },
]

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { signIn, signUp, user, profile, loading } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState(params.get('tab') === 'register' ? 'register' : 'login')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedRole, setSelectedRole] = useState('guest')

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (!loading && user && profile) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, profile, loading, navigate])

  const onLogin = async ({ email, password }) => {
    setBusy(true)
    const { error } = await signIn({ email, password })
    setBusy(false)
    if (error) toast({ type: 'error', title: 'Login failed', message: error.message })
    else navigate('/dashboard')
  }

  const onRegister = async ({ email, password, fullName }) => {
    setBusy(true)
    const { error } = await signUp({ email, password, fullName, role: selectedRole })
    setBusy(false)
    if (error) {
      toast({ type: 'error', title: 'Registration failed', message: error.message })
    } else {
      toast({ type: 'success', title: 'Account created!', message: 'Check your email to verify your account, then log in.' })
      reset()
      setTab('login')
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
          <div style={{ fontSize: 60, marginBottom: 'var(--space-2)' }}>🏛️</div>
          <div className="auth-logo">EventNest</div>
          <p className="auth-tagline">One booking. Every vendor. Full visibility for hall owners, guests, vendors, and admins.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)', width: '100%', maxWidth: 320 }}>
            {[
              { icon: '✅', text: 'Hall + vendor booking in one flow' },
              { icon: '📦', text: 'Shared Event Package for all roles' },
              { icon: '🔔', text: 'Real-time notifications & updates' },
              { icon: '💰', text: 'Transparent cost breakdown' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <span>{item.icon}</span>{item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-5)' }} onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to home
          </button>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--space-6)' }}>
            {tab === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </h2>

          {/* Tabs */}
          <div className="auth-tab">
            <button className={`auth-tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); reset() }}>Sign In</button>
            <button className={`auth-tab-btn${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); reset() }}>Register</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleSubmit(onLogin)} noValidate>
              <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input id="login-email" type="email" className="form-input" placeholder="you@example.com"
                    {...register('email', { required: 'Email is required' })} />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span>*</span></label>
                  <div className="relative">
                    <input id="login-password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                      style={{ paddingRight: 44 }} {...register('password', { required: 'Password is required' })} />
                    <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                      onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password.message}</span>}
                </div>
                <button type="submit" className={`btn btn-primary w-full btn-lg${busy ? ' btn-loading' : ''}`} disabled={busy} id="login-submit">
                  {busy ? <Spinner size="sm" /> : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onRegister)} noValidate>
              <div className="section-gap" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">I am a… <span>*</span></label>
                  <div className="role-selector">
                    {ROLES.map((r) => (
                      <div key={r.value} className={`role-option${selectedRole === r.value ? ' selected' : ''}`}
                        onClick={() => setSelectedRole(r.value)} role="radio" aria-checked={selectedRole === r.value} tabIndex={0}
                        id={`role-${r.value}`}>
                        <div className="role-option-icon">{r.icon}</div>
                        <div>{r.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input id="reg-fullname" type="text" className="form-input" placeholder="Ahmad Firdaus"
                    {...register('fullName', { required: 'Full name is required' })} />
                  {errors.fullName && <span className="form-error">{errors.fullName.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                    {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span>*</span></label>
                  <div className="relative">
                    <input id="reg-password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min 6 characters"
                      style={{ paddingRight: 44 }} {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                    <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}
                      onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password.message}</span>}
                </div>
                <button type="submit" className={`btn btn-primary w-full btn-lg${busy ? ' btn-loading' : ''}`} disabled={busy} id="register-submit">
                  {busy ? <Spinner size="sm" /> : 'Create Account →'}
                </button>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                  By registering you agree to our Terms of Service. Admin role is assigned manually.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
