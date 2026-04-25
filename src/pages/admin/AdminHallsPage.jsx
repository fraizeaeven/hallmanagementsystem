import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/helpers'

export default function AdminHallsPage() {
  const { toast } = useToast()
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('halls').select('*, profiles!halls_owner_id_fkey(full_name,email)').order('created_at', { ascending: false })
      .then(({ data }) => { setHalls(data || []); setLoading(false) })
  }, [])

  async function approve(id) {
    await supabase.from('halls').update({ is_approved: true }).eq('id', id)
    setHalls((prev) => prev.map((h) => h.id === id ? { ...h, is_approved: true } : h))
    toast({ type: 'success', title: 'Hall approved!' })
  }
  async function reject(id) {
    await supabase.from('halls').update({ is_approved: false, is_active: false }).eq('id', id)
    setHalls((prev) => prev.map((h) => h.id === id ? { ...h, is_approved: false, is_active: false } : h))
    toast({ type: 'info', title: 'Hall rejected' })
  }

  const filtered = filter === 'pending' ? halls.filter((h) => !h.is_approved)
    : filter === 'approved' ? halls.filter((h) => h.is_approved) : halls

  if (loading) return <AppShell title="Halls"><PageLoader /></AppShell>

  return (
    <AppShell title="Hall Listings">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Hall Listings</div>
          <div className="page-subtitle">{halls.length} halls · {halls.filter((h) => !h.is_approved).length} pending</div>
        </div>
      </div>
      <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
        {['all','pending','approved'].map((f) => <div key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</div>)}
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Hall</th><th>Owner</th><th>City</th><th>Capacity</th><th>Price/Day</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.id}>
                <td><div style={{ fontWeight: 600 }}>{h.name}</div></td>
                <td><div>{h.profiles?.full_name}</div><div className="text-sm text-muted">{h.profiles?.email}</div></td>
                <td>{h.city}</td>
                <td>{h.capacity} pax</td>
                <td>{formatCurrency(h.price_per_day)}</td>
                <td>
                  {h.is_approved
                    ? <span className="badge badge-accent">✅ Approved</span>
                    : <span className="badge status-pending">⏳ Pending</span>}
                </td>
                <td>
                  <div className="flex gap-2">
                    {!h.is_approved && <button className="btn btn-success btn-sm" onClick={() => approve(h.id)} id={`approve-hall-${h.id}`}>Approve</button>}
                    {h.is_approved && <button className="btn btn-danger btn-sm" onClick={() => reject(h.id)}>Revoke</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}
