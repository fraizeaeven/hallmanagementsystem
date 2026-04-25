import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, MapPin } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ServiceCard } from '@/components/vendors/VendorCard'
import { PageLoader } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'
import { buildWhatsAppLink } from '@/lib/constants'

export default function VendorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor]     = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('vendors').select('*, profiles!vendors_owner_id_fkey(full_name)').eq('id', id).single(),
      supabase.from('vendor_services').select('*').eq('vendor_id', id).eq('is_active', true).order('created_at', { ascending: false }),
    ]).then(([{ data: v }, { data: s }]) => {
      setVendor(v); setServices(s || []); setLoading(false)
    })
  }, [id])

  if (loading) return <AppShell title="Vendor Detail"><PageLoader /></AppShell>
  if (!vendor) return <AppShell title="Vendor Detail"><div className="empty-state"><div className="empty-state-title">Vendor not found</div></div></AppShell>

  return (
    <AppShell title={vendor.business_name}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-5)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="event-package">
        <div className="section-gap">
          {/* Profile */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-raised), var(--bg-card))' }}>
            <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--brand-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏢</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)' }}>{vendor.business_name}</div>
                <div className="text-sm text-muted">Managed by {vendor.profiles?.full_name || '—'}</div>
              </div>
            </div>
            {vendor.description && <p className="text-sm text-secondary" style={{ lineHeight: 1.8, marginBottom: 'var(--space-4)' }}>{vendor.description}</p>}
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              {vendor.whatsapp && (
                <a href={buildWhatsAppLink(vendor.whatsapp, `Hi, I'd like to inquire about your services.`)}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-success" style={{ background: '#25D366', border: 'none' }}>
                  <MessageCircle size={16} /> WhatsApp {vendor.whatsapp}
                </a>
              )}
              {vendor.contact_email && <span className="text-sm text-muted">📧 {vendor.contact_email}</span>}
              {vendor.contact_phone && <span className="text-sm text-muted">📞 {vendor.contact_phone}</span>}
            </div>
          </div>

          {/* Services */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-title">Services ({services.length})</div>
            </div>
          </div>
          {services.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No services listed yet</div></div>
          ) : (
            <div className="vendor-select-grid">
              {services.map((s) => <ServiceCard key={s.id} service={s} vendor={vendor} />)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="booking-sidebar-card" style={{ position: 'sticky', top: 80 }}>
            <div className="booking-sidebar-title">Contact Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              {vendor.whatsapp && (
                <a href={buildWhatsAppLink(vendor.whatsapp)} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <MessageCircle size={16} /> {vendor.whatsapp}
                </a>
              )}
              {vendor.contact_email && <div className="text-sm text-secondary">📧 {vendor.contact_email}</div>}
              {vendor.contact_phone && <div className="text-sm text-secondary">📞 {vendor.contact_phone}</div>}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
