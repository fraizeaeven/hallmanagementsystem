import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Store, CalendarDays, Bell,
  User, LogOut, Settings, ShieldCheck, Users, BarChart3,
  ClipboardList, ChevronRight, Menu, X, Briefcase, Star, MessageSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { ROLES } from '@/lib/constants'
import { getInitials, timeAgo } from '@/lib/helpers'
import Avatar from '@/components/ui/Avatar'

const NAV_CONFIG = {
  [ROLES.GUEST]: [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Browse Halls',   icon: Building2,       to: '/halls' },
    { label: 'Browse Vendors', icon: Store,           to: '/vendors' },
    { label: 'My Events',      icon: CalendarDays,    to: '/events' },
    { label: 'Community',      icon: MessageSquare,   to: '/forum' },
  ],
  [ROLES.HALL_OWNER]: [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Halls',       icon: Building2,       to: '/my-halls' },
    { label: 'Bookings',       icon: ClipboardList,   to: '/bookings' },
    { label: 'Availability',   icon: CalendarDays,    to: '/availability' },
    { label: 'Vendor Collabs', icon: Star,            to: '/collabs' },
    { label: 'Community',      icon: MessageSquare,   to: '/forum' },
  ],
  [ROLES.VENDOR]: [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
    { label: 'My Services',    icon: Briefcase,       to: '/my-services' },
    { label: 'Jobs',           icon: ClipboardList,   to: '/jobs' },
    { label: 'Community',      icon: MessageSquare,   to: '/forum' },
  ],
  [ROLES.ADMIN]: [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard' },
    { label: 'All Bookings',   icon: ClipboardList,   to: '/admin/bookings' },
    { label: 'Users',          icon: Users,           to: '/admin/users' },
    { label: 'Halls',          icon: Building2,       to: '/admin/halls' },
    { label: 'Vendors',        icon: Store,           to: '/admin/vendors' },
    { label: 'Analytics',      icon: BarChart3,       to: '/admin/analytics' },
    { label: 'Audit Log',      icon: ShieldCheck,     to: '/admin/audit' },
    { label: 'Community',      icon: MessageSquare,   to: '/forum' },
  ],
}

export function Sidebar({ mobileOpen, onClose }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || ROLES.GUEST
  const navItems = NAV_CONFIG[role] || NAV_CONFIG[ROLES.GUEST]

  const handleSignOut = async () => { await signOut(); navigate('/auth') }

  return (
    <>
      {mobileOpen && <div className="modal-backdrop" style={{ zIndex: 99 }} onClick={onClose} />}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏛️</div>
          <span className="sidebar-logo-text">EventNest</span>
          <button className="btn btn-ghost btn-sm btn-icon" style={{ marginLeft: 'auto', display: 'none' }} onClick={onClose} id="close-sidebar">
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-section" style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}
              end={item.to === '/dashboard'}
            >
              <item.icon size={18} className="sidebar-nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`} onClick={onClose}>
            <User size={18} className="sidebar-nav-icon" />
            Profile
          </NavLink>
          <button className="sidebar-nav-item" onClick={handleSignOut} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} className="sidebar-nav-icon" />
            Sign Out
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={profile?.full_name} size="md" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name || 'User'}</div>
              <div className="sidebar-user-role">{role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export function Topbar({ title, onMenuClick }) {
  const { profile } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = (n) => {
    markRead(n.id)
    if (n.event_id) navigate(`/events/${n.event_id}`)
    setNotifOpen(false)
  }

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onMenuClick} style={{ display: 'none' }} id="menu-toggle">
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-actions">
        <div className="notif-bell" ref={notifRef}>
          <button className="btn btn-ghost btn-icon" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state-icon">🔔</div>
                    <div className="empty-state-desc">No notifications yet</div>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`} onClick={() => handleNotifClick(n)}>
                      {!n.is_read && <div className="notif-dot" />}
                      <div style={{ flex: 1 }}>
                        <div className="notif-item-title">{n.title}</div>
                        {n.body && <div className="notif-item-body">{n.body}</div>}
                        <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <NavLink to="/profile">
          <Avatar name={profile?.full_name} size="md" />
        </NavLink>
      </div>
    </header>
  )
}

export function AppShell({ children, title = 'EventNest' }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="app-main">
        <Topbar title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
