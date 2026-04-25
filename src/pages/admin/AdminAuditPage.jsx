import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader, EmptyState } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/helpers'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('audit_log').select('*, profiles(full_name,email)').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  if (loading) return <AppShell title="Audit Log"><PageLoader /></AppShell>

  return (
    <AppShell title="Audit Log">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Audit Log</div>
          <div className="page-subtitle">System event trail — last {logs.length} entries</div>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon="🔍" title="No audit entries yet" description="System actions will appear here." />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>{timeAgo(l.created_at)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{l.profiles?.full_name || 'System'}</div>
                    <div className="text-sm text-muted">{l.profiles?.email}</div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', background: 'var(--bg-overlay)', padding: '2px 8px', borderRadius: 4 }}>{l.action}</span></td>
                  <td className="text-sm text-muted">{l.entity_type}</td>
                  <td className="text-sm text-muted">{l.details ? JSON.stringify(l.details).slice(0, 60) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  )
}
