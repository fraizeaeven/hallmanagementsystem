import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, CalendarDays, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { KPICard, EmptyState, PageLoader } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatCurrency } from '@/lib/helpers'
import { VENDOR_CATEGORIES, buildWhatsAppLink } from '@/lib/constants'

export default function VendorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor]     = useState(null)
  const [services, setServices] = useState([])
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { if (user) fetchData() }, [user])

  async function fetchData() {
    const { data: v } = await supabase.from('vendors').select('*').eq('owner_id', user.id).single()
    if (!v) { setLoading(false); return }
    setVendor(v)

    const [{ data: svcs }, { data: evData }] = await Promise.all([
      supabase.from('vendor_services').select('*').eq('vendor_id', v.id),
      supabase.from('event_services').select('*, events(*, halls(name,address,city))').eq('vendor_id', v.id).order('added_at', { ascending: false }).limit(20),
    ])
    setServices(svcs || [])
    setJobs(evData || [])
    setLoading(false)
  }

  const confirmed = jobs.filter((j) => j.status === 'confirmed')
  const pending = jobs.filter((j) => j.status === 'pending')

  if (loading) return <AppShell title="Dashboard"><PageLoader /></AppShell>

  if (!vendor) return (
    <AppShell title="Dashboard">
      <EmptyState icon="🛠️" title="No vendor profile yet" description="Create your business profile to start getting booked."
        action={<button className="btn btn-primary btn-lg" onClick={() => navigate('/my-services')} id="create-listing-btn">Create Vendor Profile →</button>} />
    </AppShell>
  )

  return (
    <AppShell title="Dashboard">
      <div className="section-gap">
        {/* Vendor profile card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-card))' }}>
          <div className="flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--brand-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>{vendor.business_name}</div>
              <div className="text-sm text-muted">{services.length} service{services.length !== 1 ? 's' : ''} · {vendor.is_approved ? '✅ Approved' : '⏳ Pending'}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/my-services')} id="edit-services-btn">Manage Services</button>
          </div>
        </div>

        <div className="kpi-grid">
          <KPICard label="Total Jobs"     value={jobs.length}      icon={Briefcase}    variant="brand" />
          <KPICard label="Confirmed"      value={confirmed.length} icon={CheckCircle2} variant="success" />
          <KPICard label="Pending"        value={pending.length}   icon={Clock}        variant="warning" />
          <KPICard label="Total Earned"   value={formatCurrency(confirmed.reduce((s, j) => s + (+j.price || 0), 0))} icon={CalendarDays} variant="accent" />
        </div>

        {/* Jobs table */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-title">My Jobs</div>
            <div className="page-subtitle">Events you've been assigned to</div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState icon="📋" title="No jobs yet" description="Jobs will appear here once guests add your services to their events." />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Event</th><th>Hall</th><th>Date</th><th>Status</th><th>Fee</th><th></th></tr></thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${j.event_id}`)}>
                    <td><div style={{ fontWeight: 600 }}>{j.events?.title || '—'}</div><div className="text-sm text-muted">{j.events?.event_type}</div></td>
                    <td><div>{j.events?.halls?.name || '—'}</div><div className="text-sm text-muted">{j.events?.halls?.city}</div></td>
                    <td>{formatDate(j.events?.event_date)}</td>
                    <td><StatusBadge status={j.status} /></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(j.price)}</td>
                    <td style={{ color: 'var(--brand-light)', fontSize: 'var(--text-sm)' }}>View →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
