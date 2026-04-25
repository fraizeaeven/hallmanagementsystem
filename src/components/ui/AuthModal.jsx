import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { X, Eye, EyeOff, ArrowRight, Sparkles, Building2, ShoppingBag, MessageCircle, Calendar, ShieldCheck, CheckCircle2, PenSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Common'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const INTENT_CONFIG = {
  booking:    { Icon: Building2,     label: 'Complete Booking',     color: 'var(--brand)' },
  forum_post: { Icon: PenSquare,     label: 'Post Your Question',  color: 'var(--brand)' },
  comment:    { Icon: MessageCircle, label: 'Join the Discussion', color: 'var(--sky-500)' },
  general:    { Icon: Sparkles,      label: 'Get Started',         color: 'var(--brand)' },
}

const ROLES = [
  { value: 'guest',      label: 'Planner',  Icon: Calendar,    desc: 'Book halls & vendors' },
  { value: 'hall_owner', label: 'Owner',     Icon: Building2,   desc: 'List your halls' },
  { value: 'vendor',     label: 'Vendor',    Icon: ShoppingBag, desc: 'Offer your services' },
]

export default function AuthModal() {
  const { isOpen, intent, message, closeAuthModal, triggerSuccess } = useAuthModal()
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedRole, setSelectedRole] = useState('guest')
  const [mounted, setMounted] = useState(false)
  const firstInputRef = useRef(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstInputRef.current?.focus(), 150)
    } else {
      const timer = setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => { reset() }, [tab, reset])

  const onLogin = async ({ email, password }) => {
    setBusy(true)
    const { data, error } = await signIn({ email, password })
    setBusy(false)
    if (error) {
      toast({ type: 'error', title: 'Login failed', message: error.message })
    } else {
      toast({ type: 'success', title: 'Welcome back!', message: 'You\'re now signed in.' })
      triggerSuccess(data?.user)
    }
  }

  const onRegister = async ({ email, password, fullName }) => {
    setBusy(true)
    const { data, error } = await signUp({ email, password, fullName, role: selectedRole })
    setBusy(false)
    if (error) {
      toast({ type: 'error', title: 'Registration failed', message: error.message })
    } else {
      toast({ type: 'success', title: 'Account created!', message: 'Signing you in…' })
      const { data: loginData, error: loginErr } = await signIn({ email, password })
      if (!loginErr && loginData?.user) {
        triggerSuccess(loginData.user)
      } else {
        toast({ type: 'info', title: 'Check your email', message: 'Verify your account, then sign in.' })
        closeAuthModal()
      }
    }
  }

  if (!mounted && !isOpen) return null

  const cfg = INTENT_CONFIG[intent] || INTENT_CONFIG.general
  const IntentIcon = cfg.Icon

  return (
    <div
      className={`auth-modal-overlay ${isOpen ? 'auth-modal-overlay--visible' : ''}`}
      onClick={(e) => e.target.classList.contains('auth-modal-overlay') && closeAuthModal()}
      role="dialog"
      aria-modal="true"
    >
      <div className="auth-modal">
        {/* Accent bar */}
        <div className="auth-modal-accent" style={{ background: `linear-gradient(90deg, ${cfg.color}, var(--brand-light))` }} />

        <button className="auth-modal-close" onClick={closeAuthModal}>
          <X size={18} />
        </button>

        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-intent-icon">
            <IntentIcon size={32} style={{ color: cfg.color }} />
          </div>
          <h2 className="auth-modal-title">
            {tab === 'login' ? 'Welcome Back' : 'Join EventNest'}
          </h2>
          <p className="auth-modal-message">{message}</p>
          <div className="auth-modal-intent-badge" style={{ background: 'var(--brand-50)', color: 'var(--brand)' }}>
            <ShieldCheck size={12} /> {cfg.label}
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-modal-tabs">
          <button className={`auth-modal-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Sign In
          </button>
          <button className={`auth-modal-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {/* Body */}
        <div className="auth-modal-body">
          {tab === 'login' ? (
            <form onSubmit={handleSubmit(onLogin)} className="auth-modal-fields">
              <Input
                label="Email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <div style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button variant="primary" block size="xl" disabled={busy} type="submit" className="mt-4">
                {busy ? <Spinner size="sm" /> : <><ArrowRight size={18} /> Sign In</>}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onRegister)} className="auth-modal-fields">
              <div className="input-group">
                <label className="input-label" style={{ marginBottom: 'var(--s-3)', display: 'block' }}>I want to...</label>
                <div className="auth-modal-roles">
                  {ROLES.map(r => {
                    const RIcon = r.Icon
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`auth-modal-role-btn ${selectedRole === r.value ? 'active' : ''}`}
                      >
                        <RIcon size={18} style={{ color: selectedRole === r.value ? 'var(--brand)' : 'var(--text-muted)' }} />
                        <span className="auth-modal-role-label">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Input
                label="Full Name"
                placeholder="Ahmad Firdaus"
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
              />
              <div style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button variant="primary" block size="xl" disabled={busy} type="submit" className="mt-4">
                {busy ? <Spinner size="sm" /> : <><Sparkles size={18} /> Join & Continue</>}
              </Button>
            </form>
          )}

          <div className="auth-modal-switch">
            {tab === 'login' ? (
              <p>Don't have an account? <button className="auth-modal-switch-link" onClick={() => setTab('register')}>Register for free</button></p>
            ) : (
              <p>Already have an account? <button className="auth-modal-switch-link" onClick={() => setTab('login')}>Sign in here</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
