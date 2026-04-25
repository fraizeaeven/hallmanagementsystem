import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { VendorCard, ServiceCard, VendorCategoryFilter } from '@/components/vendors/VendorCard'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'

export default function VendorsPage() {
  const [vendors, setVendors]   = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [cat, setCat]           = useState(null)
  const [view, setView]         = useState('services')  // 'vendors' or 'services'

  useEffect(() => {
    Promise.all([
      supabase.from('vendors').select('*').eq('is_active', true).eq('is_approved', true),
      supabase.from('vendor_services').select('*, vendors!inner(id, business_name, whatsapp, is_active, is_approved)').eq('is_active', true).eq('vendors.is_active', true).eq('vendors.is_approved', true),
    ]).then(([{ data: v }, { data: s }]) => {
      // Add service count to vendors
      const vMap = {}
      s?.forEach((svc) => { const vid = svc.vendor_id; vMap[vid] = (vMap[vid] || 0) + 1 })
      setVendors((v || []).map((vendor) => ({ ...vendor, service_count: vMap[vendor.id] || 0 })))
      setServices(s || [])
      setLoading(false)
    })
  }, [])

  const filteredServices = services.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.vendors?.business_name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    const matchCat = !cat || s.category === cat
    return matchSearch && matchCat
  })

  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase()
    return !q || v.business_name?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q)
  })

  if (loading) return <AppShell title="Browse Vendors"><PageLoader /></AppShell>

  return (
    <AppShell title="Browse Vendors">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Browse Vendors</div>
          <div className="page-subtitle">{vendors.length} vendors · {services.length} services available</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
        <button className={`tab-btn${view === 'services' ? ' active' : ''}`} onClick={() => setView('services')}>🛠️ Browse Services</button>
        <button className={`tab-btn${view === 'vendors' ? ' active' : ''}`} onClick={() => setView('vendors')}>🏢 Browse Vendors</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input id="vendor-search" type="text" className="form-input search-input" placeholder="Search…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {view === 'services' && (
        <>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <VendorCategoryFilter value={cat} onChange={setCat} />
          </div>
          {filteredServices.length === 0 ? (
            <EmptyState icon="✨" title="No services found" description="Try a different category or search." />
          ) : (
            <div className="vendor-select-grid">
              {filteredServices.map((s) => <ServiceCard key={s.id} service={s} vendor={s.vendors} />)}
            </div>
          )}
        </>
      )}

      {view === 'vendors' && (
        filteredVendors.length === 0 ? (
          <EmptyState icon="🏢" title="No vendors found" />
        ) : (
          <div className="vendor-grid">
            {filteredVendors.map((v) => <VendorCard key={v.id} vendor={v} />)}
          </div>
        )
      )}
    </AppShell>
  )
}
