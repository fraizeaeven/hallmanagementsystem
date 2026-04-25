export function Badge({ children, className = '' }) {
  return <span className={`badge ${className}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = {
    draft:           { label: 'Draft',           cls: 'status-draft' },
    pending_payment: { label: 'Pending Payment', cls: 'status-pending' },
    confirmed:       { label: 'Confirmed',       cls: 'status-confirmed' },
    in_progress:     { label: 'In Progress',     cls: 'status-inprogress' },
    completed:       { label: 'Completed',       cls: 'status-completed' },
    cancelled:       { label: 'Cancelled',       cls: 'status-cancelled' },
    pending:         { label: 'Pending',         cls: 'status-pending' },
    rejected:        { label: 'Rejected',        cls: 'status-cancelled' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
