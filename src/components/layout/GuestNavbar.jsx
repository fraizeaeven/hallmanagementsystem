import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, NavLink } from 'react-router-dom'
import { Search, Plus, User, LogOut, Menu, X, Sparkles, LayoutDashboard, Landmark } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import '@/styles/_navbar.css'

export default function GuestNavbar() {
  const { user, profile, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const handleSignIn = () => {
    openAuthModal({ intent: 'general' })
  }

  return (
    <nav className={`guest-navbar ${scrolled ? 'guest-navbar--scrolled' : ''}`}>
      <div className="guest-navbar-container">
        {/* Logo */}
        <Link to="/" className="guest-navbar-logo">
          <div className="guest-navbar-logo-icon"><Landmark size={20} /></div>
          <span className="fw-bold">EventNest</span>
        </Link>

        {/* Links - Desktop */}
        <div className="guest-navbar-links">
          <NavLink to="/halls" className={({ isActive }) => `guest-navbar-link ${isActive ? 'active' : ''}`}>Halls</NavLink>
          <NavLink to="/vendors" className={({ isActive }) => `guest-navbar-link ${isActive ? 'active' : ''}`}>Vendors</NavLink>
          <NavLink to="/forum" className={({ isActive }) => `guest-navbar-link ${isActive ? 'active' : ''}`}>Community</NavLink>
        </div>

        {/* Actions */}
        <div className="guest-navbar-actions">
          {user ? (
            <div className="user-menu-wrapper" ref={menuRef}>
              <button 
                className="user-menu-trigger" 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <Avatar name={profile?.full_name} size="sm" />
                <span className="user-menu-nameDesktop">{profile?.full_name?.split(' ')[0]}</span>
              </button>
              
              {menuOpen && (
                <Card className="user-dropdown animate-scale-in">
                  <div className="user-dropdown-header">
                    <div className="fw-bold">{profile?.full_name}</div>
                    <div className="color-secondary" style={{ fontSize: 11 }}>{profile?.email}</div>
                  </div>
                  <div className="user-dropdown-items">
                    <Link to="/dashboard" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link to="/profile" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                      <User size={15} /> Profile
                    </Link>
                    <button className="user-dropdown-item color-danger" onClick={handleSignOut}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={handleSignIn} className="navbar-signin-btn">
                Sign In
              </Button>
              <Button variant="primary" onClick={() => navigate('/halls')} className="navbar-start-btn">
                <Sparkles size={14} /> Get Started
              </Button>
            </>
          )}

          {/* Mobile toggle */}
          <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && !user && (
        <div className="mobile-menu animate-slide-down">
          <div className="mobile-menu-links">
            <Link to="/halls" onClick={() => setMenuOpen(false)}>Browse Halls</Link>
            <Link to="/vendors" onClick={() => setMenuOpen(false)}>Browse Vendors</Link>
            <Link to="/forum" onClick={() => setMenuOpen(false)}>Community Forum</Link>
            <hr className="mobile-menu-divider" />
            <button onClick={handleSignIn} className="mobile-menu-signin">Sign In</button>
          </div>
        </div>
      )}
    </nav>
  )
}
