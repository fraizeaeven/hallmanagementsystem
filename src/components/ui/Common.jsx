export function Spinner({ size = '' }) {
  return <div className={`spinner${size ? ` ${size}` : ''}`} />
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action}
    </div>
  )
}

export function KPICard({ label, value, sub, icon: Icon, variant = 'brand' }) {
  return (
    <div className={`kpi-card ${variant}`}>
      {Icon && (
        <div className="kpi-icon" style={{ color: `var(--${variant === 'brand' ? 'brand-light' : variant})` }}>
          <Icon size={22} />
        </div>
      )}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
