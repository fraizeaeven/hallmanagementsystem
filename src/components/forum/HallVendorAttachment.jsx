import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'

/**
 * Renders a hall or vendor attachment.
 * variant="chip"  — small inline chip (used in PostCard)
 * variant="card"  — full card (used in PostDetail)
 */
export default function HallVendorAttachment({ post, variant = 'card' }) {
  if (!post.hall_id && !post.vendor_id) return null

  const isHall   = !!post.hall_id
  const label    = isHall ? 'Hall' : 'Vendor'
  const icon     = isHall ? '🏛️' : '🛍️'
  const name     = isHall ? (post.hall?.name || 'Attached Hall') : (post.vendor?.business_name || 'Attached Vendor')
  const sub      = isHall
    ? post.hall?.city || post.hall?.address || ''
    : post.vendor?.contact_email || ''
  const href     = isHall ? `/halls/${post.hall_id}` : `/vendors/${post.vendor_id}`

  if (variant === 'chip') {
    return (
      <Link
        to={href}
        className="attachment-chip"
        onClick={(e) => e.stopPropagation()}
        title={`View ${label}: ${name}`}
        style={{ marginBottom: 'var(--s-2)', display: 'inline-flex' }}
      >
        <span className="attachment-chip-icon">{icon}</span>
        <span>{label}: {name}</span>
      </Link>
    )
  }

  return (
    <Link to={href} className="attachment-card" id="post-attachment-card">
      <div className="attachment-card-icon">{icon}</div>
      <div className="attachment-card-info">
        <div className="attachment-card-label">Attached {label}</div>
        <div className="attachment-card-name">{name}</div>
        {sub && <div className="attachment-card-sub">{sub}</div>}
      </div>
      <ExternalLink size={18} className="attachment-card-arrow" />
    </Link>
  )
}
