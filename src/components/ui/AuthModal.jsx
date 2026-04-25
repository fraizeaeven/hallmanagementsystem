import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { X, Eye, EyeOff, ArrowRight, Sparkles, Building2, ShoppingBag, MessageCircle, User, Calendar, Wrench, ShieldCheck, CheckCircle2, PenSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Common'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const INTENT_CONFIG = {
  booking:    { icon: Building2, label: 'Complete Booking',   color: '#3B82F6' },
  forum_post: { icon: PenSquare, label: 'Post Your Question', color: '#8B5CF6' },
  comment:    { icon: MessageCircle, label: 'Join the Discussion', color: '#0EA5E9' },
  general:    { icon: Sparkles, label: 'Get Started',         color: '#3B82F6' },
}

const ROLES = [
  { value: 'guest',      label: 'Planner', icon: Calendar, desc: 'Book halls & vendors' },
  { value: 'hall_owner', label: 'Owner',    icon: Building2, desc: 'List your halls' },
  { value: 'vendor',     label: 'Vendor',   icon: ShoppingBag, desc: 'Offer your services' },
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
  const Icon = cfg.icon

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeAuthModal} />
      
      <div className={`relative w-full max-w-[480px] bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 transform ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Top Gradient Highlight */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400" />
        
        <button 
          className="absolute right-6 top-6 z-10 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          onClick={closeAuthModal}
        >
          <X size={20} />
        </button>

        <div className="p-10">
          <header className="mb-10 text-center">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20`} style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
              {Icon && <Icon size={40} style={{ color: cfg.color }} />}
            </div>
            
            <h2 className="text-3xl font-black text-white mb-3">
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">{message}</p>
            
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">
              <ShieldCheck size={12} />
              {cfg.label}
            </div>
          </header>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl mb-8">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                tab === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                tab === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-6">
              <Input
                label="EMAIL ADDRESS"
                placeholder="you@email.com"
                variant="glass"
                error={errors.email?.message}
                {...register('email', { required: 'Email is required' })}
              />
              <div className="relative">
                <Input
                  label="PASSWORD"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  variant="glass"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-[3.25rem] text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button 
                variant="primary" 
                className="w-full h-14 rounded-2xl group" 
                disabled={busy} 
                type="submit"
              >
                {busy ? <Spinner size="sm" /> : <><span className="font-black">CONTINUE</span> <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onRegister)} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">WHO ARE YOU?</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map(r => {
                    const RoleIcon = r.icon
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                          selectedRole === r.value 
                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                        }`}
                      >
                        <RoleIcon size={20} className={selectedRole === r.value ? 'text-blue-400' : 'text-gray-500'} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Input
                label="FULL NAME"
                placeholder="Ahmad Firdaus"
                variant="glass"
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required' })}
              />
              <Input
                label="EMAIL ADDRESS"
                placeholder="you@email.com"
                variant="glass"
                error={errors.email?.message}
                {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
              />
              <div className="relative">
                <Input
                  label="SECURE PASSWORD"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  variant="glass"
                  error={errors.password?.message}
                  {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-[3.25rem] text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button 
                variant="primary" 
                className="w-full h-14 rounded-2xl" 
                disabled={busy} 
                type="submit"
              >
                {busy ? <Spinner size="sm" /> : <><span className="font-black">CREATE ACCOUNT</span> <CheckCircle2 size={18} /></>}
              </Button>
            </form>
          )}

          <div className="text-center mt-10">
            {tab === 'login' ? (
              <p className="text-sm text-gray-500">
                New to EventNest? <button onClick={() => setTab('register')} className="text-blue-400 font-bold hover:underline">Create an account</button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Already have an account? <button onClick={() => setTab('login')} className="text-blue-400 font-bold hover:underline">Sign in instead</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
