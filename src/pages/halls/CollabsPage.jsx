import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { buildWhatsAppLink } from '@/lib/constants'

export default function CollabsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [halls, setHalls]       = useState([])
  const [selectedHall, setSelectedHall] = useState(null)
  const [collabs, setCollabs]   = useState([])
  const [allVendors, setAllVendors] = useState([])
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('halls').select('id,name').eq('owner_id', user.id).then(({ data }) => {
      setHalls(data || [])
      if (data?.length) { setSelectedHall(data[0].id); fetchCollabs(data[0].id) }
      else setLoading(false)
    })
  }, [user])

  async function fetchCollabs(hallId) {
    setLoading(true)
    const { data } = await supabase.from('hall_vendor_collabs').select('*, vendors(id,business_name,whatsapp,description,contact_email)').eq('hall_id', hallId)
    setCollabs(data || [])
    setLoading(false)
  }

  async function openAddModal() {
    const { data } = await supabase.from('vendors').select('id,business_name,description,whatsapp').eq('is_active', true).eq('is_approved', true)
    setAllVendors(data || [])
    setShowAdd(true)
  }

  async function addCollab(vendorId) {
    const existing = collabs.find((c) => c.vendor_id === vendorId)
    if (existing) { toast({ type: 'info', title: 'Already added' }); return }
    const { error } = await supabase.from('hall_vendor_collabs').insert({ hall_id: selectedHall, vendor_id: vendorId })
    if (!error) { toast({ type: 'success', title: 'Vendor added!' }); fetchCollabs(selectedHall) }
    else toast({ type: 'error', title: 'Error', message: error.message })
  }

  async function removeCollab(id) {
    if (!confirm('Remove this vendor collaboration?')) return
    await supabase.from('hall_vendor_collabs').delete().eq('id', id)
    toast({ type: 'info', title: 'Vendor removed' })
    fetchCollabs(selectedHall)
  }

  const filteredVendors = allVendors.filter((v) => {
    const q = search.toLowerCase()
    return !q || v.business_name?.toLowerCase().includes(q)
  })
  const collabIds = new Set(collabs.map((c) => c.vendor_id))

  return (
    <AppShell title="Vendor Collaborations">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Vendor Collaborations</div>
          <div className="page-subtitle">Manage vendor partnerships for your halls. Guests will see recommended vendors during booking.</div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} id="add-collab-btn" disabled={!selectedHall}>
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {halls.length > 1 && (
        <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
          {halls.map((h) => (
            <div key={h.id} className={`filter-chip${selectedHall === h.id ? ' active' : ''}`}
              onClick={() => { setSelectedHall(h.id); fetchCollabs(h.id) }}>{h.name}</div>
          ))}
        </div>
      )}

      {loading ? <PageLoader /> : collabs.length === 0 ? (
        <EmptyState icon="🤝" title="No vendor collaborations yet" description="Add vendors you partner with so guests see them as recommended."
          action={<button className="btn btn-primary btn-lg" onClick={openAddModal}>Add Vendor →</button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {collabs.map((c) => (
            <div key={c.id} className="card" style={{ cursor: 'default' }}>
              <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ fontWeight: 700 }}>{c.vendors?.business_name || '—'}</div>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeCollab(c.id)} title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
              {c.vendors?.whatsapp && (
                <a href={buildWhatsAppLink(c.vendors.whatsapp)} target="_blank" rel="noopener noreferrer"
                  className="text-sm" style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-2)' }}>
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
              {c.vendors?.contact_email && <div className="text-sm text-muted">{c.vendors.contact_email}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Add vendor modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Vendor Collaboration">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="form-input search-input" placeholder="Search vendors…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: 400, overflowY: 'auto' }}>
          {filteredVendors.map((v) => (
            <div key={v.id} className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'var(--bg-overlay)', borderRadius: 'var(--radius)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{v.business_name}</div>
                {v.description && <div className="text-sm text-muted" style={{ maxWidth: 260 }}>{v.description.slice(0, 60)}{v.description.length > 60 ? '…' : ''}</div>}
              </div>
              {collabIds.has(v.id)
                ? <span className="badge badge-accent">✅ Added</span>
                : <button className="btn btn-primary btn-sm" onClick={() => addCollab(v.id)}>+ Add</button>
              }
            </div>
          ))}
          {filteredVendors.length === 0 && <div className="text-sm text-muted">No vendors found.</div>}
        </div>
      </Modal>
    </AppShell>
  )
}
