import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Building2, Users, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { KPICard, EmptyState, PageLoader } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('halls').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('halls').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([u, h, v, e, ph, pv, pe]) => {
      setStats({
        users: u.count || 0, halls: h.count || 0, vendors: v.count || 0,
        events: e.count || 0, pendingHalls: ph.count || 0,
        pendingVendors: pv.count || 0, pendingEvents: pe.count || 0,
      })
      setLoading(false)
    })
  }, [])

  if (loading) return <AppShell title="Admin Dashboard"><PageLoader /></AppShell>

  const quickLinks = [
    { label: 'All Bookings', path: '/admin/bookings', icon: '📋', count: stats.events },
    { label: 'Users', path: '/admin/users', icon: '👥', count: stats.users },
    { label: 'Hall Listings', path: '/admin/halls', icon: '🏢', count: stats.halls, pending: stats.pendingHalls },
    { label: 'Vendor Listings', path: '/admin/vendors', icon: '🛠️', count: stats.vendors, pending: stats.pendingVendors },
    { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
    { label: 'Audit Log', path: '/admin/audit', icon: '🔍' },
  ]

  return (
    <AppShell title="Admin Dashboard">
      <div className="section-gap">
        <div className="kpi-grid">
          <KPICard label="Users"          value={stats.users}         icon={Users}       variant="brand" />
          <KPICard label="Halls"          value={stats.halls}         icon={Building2}   variant="accent" />
          <KPICard label="Vendors"        value={stats.vendors}       icon={ShieldCheck} variant="success" />
          <KPICard label="Events"         value={stats.events}        icon={BarChart3}   variant="brand" />
        </div>

        {(stats.pendingHalls > 0 || stats.pendingVendors > 0 || stats.pendingEvents > 0) && (
          <div className="card" style={{ border: '1px solid hsl(38 92% 55% / 30%)', background: 'var(--warning-ghost)' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
              <div style={{ fontWeight: 700 }}>Pending Actions</div>
            </div>
            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
              {stats.pendingHalls > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/halls')}>
                  <Clock size={14} /> {stats.pendingHalls} hall{stats.pendingHalls !== 1 ? 's' : ''} awaiting approval
                </button>
              )}
              {stats.pendingVendors > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/vendors')}>
                  <Clock size={14} /> {stats.pendingVendors} vendor{stats.pendingVendors !== 1 ? 's' : ''} awaiting approval
                </button>
              )}
              {stats.pendingEvents > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/bookings')}>
                  <Clock size={14} /> {stats.pendingEvents} event{stats.pendingEvents !== 1 ? 's' : ''} pending
                </button>
              )}
            </div>
          </div>
        )}

        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">Quick Navigation</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {quickLinks.map((l) => (
            <div key={l.path} className="card interactive" onClick={() => navigate(l.path)}
              style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <div style={{ fontSize: 32, marginBottom: 'var(--space-3)' }}>{l.icon}</div>
              <div style={{ fontWeight: 600 }}>{l.label}</div>
              {l.count != null && <div className="text-sm text-muted">{l.count} total</div>}
              {l.pending > 0 && <div style={{ color: 'var(--warning)', fontSize: 'var(--text-sm)', marginTop: 4 }}>⏳ {l.pending} pending</div>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
