import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Plus, User, LogOut, Building2, LayoutDashboard } from 'lucide-react'
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
    <div className="forum-root">
      <nav className="forum-nav">
        <div className="forum-nav-inner">
          {/* Logo */}
          <Link to="/" className="forum-nav-logo">
            <div className="forum-nav-logo-icon">
              <Building2 size={16} />
            </div>
            <span>EventNest</span>
          </Link>
          <span className="forum-nav-sep">/</span>
          <Link to="/forum" className="forum-nav-crumb" style={{ textDecoration: 'none' }}>
            Community
          </Link>

          {/* Search */}
          <div className="forum-nav-search" style={{ marginLeft: 'var(--s-5)' }}>
            <Search size={15} className="forum-nav-search-icon" />
            <input
              id="forum-search"
              className="forum-nav-search-input"
              type="text"
              placeholder="Search discussions…"
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="forum-nav-actions">
            {user ? (
              <>
                <Link to="/forum/create" className="btn btn-primary btn-sm">
                  <Plus size={16} /> New Post
                </Link>
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    id="forum-user-menu-btn"
                  >
                    <Avatar name={profile?.full_name} size="sm" />
                  </button>
                  {menuOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)',
                      minWidth: 200, zIndex: 200, overflow: 'hidden',
                    }}>
                      <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>{profile?.full_name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{profile?.email}</div>
                      </div>
                      <button
                        onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', padding: 'var(--s-3) var(--s-5)', fontSize: 'var(--text-sm)', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </button>
                      <button
                        onClick={handleSignOut}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', padding: 'var(--s-3) var(--s-5)', fontSize: 'var(--text-sm)', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" className="btn-sm" onClick={handleSignIn}>Sign In</Button>
                <Link to="/forum/create" className="btn btn-primary btn-sm">
                  <Plus size={16} /> Post
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer className="footer" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s-3)', padding: '0 var(--s-6)' }}>
          <span>© {new Date().getFullYear()} EventNest Community</span>
          <div style={{ display: 'flex', gap: 'var(--s-5)' }}>
            <Link to="/halls" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Browse Halls</Link>
            <Link to="/vendors" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Browse Vendors</Link>
            <button onClick={handleSignIn} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
