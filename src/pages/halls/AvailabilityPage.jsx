import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import AvailabilityCalendar from '@/components/halls/AvailabilityCalendar'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function AvailabilityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [halls, setHalls]       = useState([])
  const [selectedHall, setSelectedHall] = useState(null)
  const [blocked, setBlocked]   = useState([])
  const [booked, setBooked]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('halls').select('id,name').eq('owner_id', user.id).then(({ data }) => {
      setHalls(data || [])
      if (data?.length) { setSelectedHall(data[0].id); fetchDates(data[0].id) }
      else setLoading(false)
    })
  }, [user])

  async function fetchDates(hallId) {
    setLoading(true)
    const [{ data: blk }, { data: bkd }] = await Promise.all([
      supabase.from('hall_availability').select('blocked_date').eq('hall_id', hallId),
      supabase.from('events').select('event_date').eq('hall_id', hallId).in('status', ['confirmed','pending_payment','in_progress']),
    ])
    setBlocked((blk || []).map((b) => b.blocked_date))
    setBooked((bkd || []).map((b) => b.event_date))
    setLoading(false)
  }

  async function toggleBlock(date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isBlocked = blocked.includes(dateStr)
    if (isBlocked) {
      await supabase.from('hall_availability').delete().eq('hall_id', selectedHall).eq('blocked_date', dateStr)
      setBlocked((prev) => prev.filter((d) => d !== dateStr))
      toast({ type: 'info', title: 'Date unblocked' })
    } else {
      await supabase.from('hall_availability').insert({ hall_id: selectedHall, blocked_date: dateStr, reason: 'Manual block' })
      setBlocked((prev) => [...prev, dateStr])
      toast({ type: 'success', title: 'Date blocked' })
    }
  }

  return (
    <AppShell title="Manage Availability">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Availability</div>
          <div className="page-subtitle">Block or open dates for your halls</div>
        </div>
      </div>

      {halls.length > 1 && (
        <div className="filter-chips" style={{ marginBottom: 'var(--space-6)' }}>
          {halls.map((h) => (
            <div key={h.id} className={`filter-chip${selectedHall === h.id ? ' active' : ''}`}
              onClick={() => { setSelectedHall(h.id); fetchDates(h.id) }}>
              {h.name}
            </div>
          ))}
        </div>
      )}

      {halls.length === 0 ? (
        <EmptyState icon="🏢" title="No halls yet" description="Add a hall first to manage its availability." />
      ) : (
        <div style={{ maxWidth: 480 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
              {halls.find((h) => h.id === selectedHall)?.name}
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-5)' }}>
              Click an available date to block it. Click a blocked date to unblock it. Booked dates (orange) cannot be modified.
            </p>
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : (
              <AvailabilityCalendar
                blockedDates={blocked}
                bookedDates={booked}
                onSelect={toggleBlock}
              />
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
