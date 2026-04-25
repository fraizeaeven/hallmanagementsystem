import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Plus, User, LogOut, ChevronRight, Building2, LayoutDashboard, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { useState, useRef, useEffect } from 'react'
import '@/styles/forum.css'

export default function ForumLayout({ children, onSearch, searchValue = '' }) {
  const { user, profile, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/forum')
  }

  const handleSignIn = () => {
    openAuthModal({ intent: 'general' })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-8">
          
          {/* Logo & Breadcrumbs */}
          <div className="flex items-center gap-4 min-w-max">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Building2 size={22} className="text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">EVENTNEST</span>
            </Link>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <Link to="/forum" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">
              COMMUNITY
            </Link>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="forum-search"
              className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
              type="text"
              placeholder="Search conversations, ideas, or questions…"
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-5">
            {user ? (
              <>
                <Link to="/forum/create" className="hidden sm:block">
                  <Button variant="primary" className="h-11 px-6 rounded-2xl gap-2 font-black text-xs tracking-widest">
                    <Plus size={18} /> NEW DISCOURSE
                  </Button>
                </Link>
                
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <Avatar name={profile?.full_name} size="sm" className="ring-2 ring-white/10" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 top-full mt-4 w-64 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-2 z-[100] transition-all duration-300 transform origin-top-right ${
                    menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                  }`}>
                    <div className="px-5 py-4 border-b border-white/5">
                      <div className="font-black text-white text-sm truncate">{profile?.full_name}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-1">{profile?.role || 'MEMBER'}</div>
                    </div>
                    
                    <div className="py-2">
                      <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                        <LayoutDashboard size={18} /> Dashboard
                      </button>
                      <button onClick={() => setMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                        <Settings size={18} /> Settings
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t border-white/5 mt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="text-gray-400 hover:text-white font-bold px-5" onClick={handleSignIn}>
                  SIGN IN
                </Button>
                <Link to="/forum/create">
                  <Button variant="primary" className="h-11 px-6 rounded-2xl font-black text-xs tracking-widest">
                    GET STARTED
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-160px)]">
        {children}
      </main>

      <footer className="bg-zinc-950 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter">EVENTNEST COMMUNITY</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">© {new Date().getFullYear()} EventNest Inc. Promoting shared event excellence.</p>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">PLATFORM</span>
              <div className="flex gap-6">
                <Link to="/halls" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Halls</Link>
                <Link to="/vendors" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Vendors</Link>
                <Link to="/forum" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Forum</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
