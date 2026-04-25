import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState, PageLoader } from '@/components/ui/Common'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/helpers'

export default function MyHallsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('halls').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setHalls(data || []); setLoading(false) })
  }, [user])

  if (loading) return <AppShell title="My Halls"><PageLoader /></AppShell>

  return (
    <AppShell title="My Halls">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">My Halls</div>
          <div className="page-subtitle">{halls.length} hall{halls.length !== 1 ? 's' : ''} listed</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/my-halls/new')} id="add-hall-btn">
          <Plus size={16} /> Add Hall
        </button>
      </div>

      {halls.length === 0 ? (
        <EmptyState icon="🏢" title="No halls listed yet" description="List your first hall and start receiving bookings."
          action={<button className="btn btn-primary btn-lg" onClick={() => navigate('/my-halls/new')}>Add Hall →</button>} />
      ) : (
        <div className="hall-grid">
          {halls.map((h) => (
            <div key={h.id} className="card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="flex items-center justify-between">
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>{h.name}</div>
                  <div className="flex gap-2">
                    {h.is_approved
                      ? <span className="badge badge-accent">✅ Approved</span>
                      : <span className="badge status-pending">⏳ Pending</span>}
                  </div>
                </div>
                <div className="text-sm text-secondary">{h.city} · {h.capacity} pax · {formatCurrency(h.price_per_day)}/day</div>
                {h.description && <div className="text-sm text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{h.description}</div>}
                <div className="flex gap-3" style={{ marginTop: 'var(--space-2)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/my-halls/${h.id}/edit`)} id={`edit-hall-${h.id}`}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/availability`)} id={`availability-hall-${h.id}`}>
                    📅 Manage Availability
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
