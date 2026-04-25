import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/helpers'
import { VENDOR_CATEGORIES } from '@/lib/constants'

export default function AdminVendorsPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    supabase.from('vendors').select('*, profiles!vendors_owner_id_fkey(full_name,email)').order('created_at', { ascending: false })
      .then(({ data }) => { setVendors(data || []); setLoading(false) })
  }, [])

  async function approve(id) {
    await supabase.from('vendors').update({ is_approved: true }).eq('id', id)
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, is_approved: true } : v))
    toast({ type: 'success', title: 'Vendor approved!' })
  }
  async function revoke(id) {
    await supabase.from('vendors').update({ is_approved: false }).eq('id', id)
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, is_approved: false } : v))
    toast({ type: 'info', title: 'Vendor approval revoked' })
  }

  const filtered = filter === 'pending' ? vendors.filter((v) => !v.is_approved)
    : filter === 'approved' ? vendors.filter((v) => v.is_approved) : vendors

  if (loading) return <AppShell title="Vendors"><PageLoader /></AppShell>

  return (
    <AppShell title="Vendor Listings">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Vendor Listings</div>
          <div className="page-subtitle">{vendors.length} vendors · {vendors.filter((v) => !v.is_approved).length} pending</div>
        </div>
      </div>
      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        {['all','pending','approved'].map((f) => <div key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</div>)}
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Business</th><th>Owner</th><th>Category</th><th>From</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((v) => {
              const cat = VENDOR_CATEGORIES.find((c) => c.value === v.category)
              return (
                <tr key={v.id}>
                  <td><div style={{ fontWeight: 600 }}>{v.business_name}</div></td>
                  <td><div>{v.profiles?.full_name}</div><div className="text-sm text-muted">{v.profiles?.email}</div></td>
                  <td><span>{cat?.icon} {cat?.label || v.category}</span></td>
                  <td>{formatCurrency(v.price_from)}</td>
                  <td>
                    {v.is_approved
                      ? <span className="badge badge-accent">✅ Approved</span>
                      : <span className="badge status-pending">⏳ Pending</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {!v.is_approved && <button className="btn btn-success btn-sm" onClick={() => approve(v.id)} id={`approve-vendor-${v.id}`}>Approve</button>}
                      {v.is_approved  && <button className="btn btn-danger btn-sm"  onClick={() => revoke(v.id)}>Revoke</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
