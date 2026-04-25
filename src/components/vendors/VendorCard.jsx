import { useNavigate } from 'react-router-dom'
import { Check, MessageCircle } from 'lucide-react'
import { VENDOR_CATEGORIES, PRICE_TYPE_LABELS, buildWhatsAppLink } from '@/lib/constants'
import { formatCurrency, truncate } from '@/lib/helpers'

export function VendorCard({ vendor, onClick }) {
  const navigate = useNavigate()
  const handleClick = () => onClick ? onClick(vendor) : navigate(`/vendors/${vendor.id}`)

  return (
    <div className="vendor-card" onClick={handleClick} role="button" tabIndex={0}>
      <div className="vendor-card-header">
        <div className="vendor-cat-icon" style={{ fontSize: 28 }}>
          {vendor.logo_url ? <img src={vendor.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} /> : '🏢'}
        </div>
        <div style={{ flex: 1 }}>
          <div className="vendor-card-name">{vendor.business_name}</div>
          <div className="vendor-card-cat">{vendor.service_count || 0} service{(vendor.service_count || 0) !== 1 ? 's' : ''}</div>
        </div>
        {vendor.whatsapp && (
          <a href={buildWhatsAppLink(vendor.whatsapp)} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} className="btn btn-ghost btn-sm btn-icon" title="WhatsApp" style={{ color: '#25D366' }}>
            <MessageCircle size={16} />
          </a>
        )}
      </div>
      {vendor.description && <div className="vendor-card-desc">{truncate(vendor.description, 80)}</div>}
    </div>
  )
}

export function ServiceCard({ service, vendor, selectable = false, selected = false, onToggle }) {
  const cat = VENDOR_CATEGORIES.find((c) => c.value === service.category)
  const priceLabel = PRICE_TYPE_LABELS[service.price_type] || ''

  const handleClick = () => {
    if (selectable) onToggle?.({ ...service, vendor })
  }

  return (
    <div
      className={`vendor-select-item${selected ? ' selected' : ''}`}
      onClick={handleClick}
      role={selectable ? 'checkbox' : 'listitem'}
      aria-checked={selectable ? selected : undefined}
      tabIndex={0}
      style={!selectable ? { cursor: 'default' } : {}}
    >
      {selectable && <div className="vendor-select-check"><Check size={12} color="white" /></div>}
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
        <div className="vendor-cat-icon" style={{ width: 36, height: 36, fontSize: 18 }}>{cat?.icon || '✨'}</div>
        <div style={{ flex: 1 }}>
          <div className="vendor-card-name" style={{ fontSize: 'var(--text-sm)' }}>{service.name}</div>
          <div className="vendor-card-cat">{cat?.label || service.category}</div>
        </div>
      </div>
      {vendor && <div className="text-sm text-muted" style={{ marginBottom: 4 }}>by {vendor.business_name}</div>}
      <div className="vendor-card-price">
        {priceLabel === '~ negotiable' ? (
          <span style={{ color: 'var(--warning)' }}>Negotiable</span>
        ) : (
          <>{priceLabel} {formatCurrency(service.price)}{PRICE_TYPE_LABELS[service.price_type] && service.price_type !== 'starting_from' ? ` ${PRICE_TYPE_LABELS[service.price_type]}` : ''}</>
        )}
      </div>
      {service.description && <div className="vendor-card-desc" style={{ marginTop: 4 }}>{truncate(service.description, 60)}</div>}
    </div>
  )
}

export function VendorCategoryFilter({ value, onChange }) {
  return (
    <div className="cat-pills">
      <div className={`cat-pill${!value ? ' active' : ''}`} onClick={() => onChange(null)}>All</div>
      {VENDOR_CATEGORIES.map((c) => (
        <div key={c.value} className={`cat-pill${value === c.value ? ' active' : ''}`} onClick={() => onChange(c.value)}>
          {c.icon} {c.label}
        </div>
      ))}
    </div>
  )
}
