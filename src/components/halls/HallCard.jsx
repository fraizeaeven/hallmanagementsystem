import { useNavigate } from 'react-router-dom'
import { MapPin, Users, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'

export function HallCard({ hall }) {
  const navigate = useNavigate()
  const imgs = Array.isArray(hall.images) ? hall.images : []

  return (
    <div className="hall-card" onClick={() => navigate(`/halls/${hall.id}`)} role="button" tabIndex={0}>
      <div className="hall-card-image">
        {imgs[0]
          ? <img src={imgs[0]} alt={hall.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="hall-card-image-placeholder">🏛️</div>
        }
      </div>
      <div className="hall-card-body">
        <div className="hall-card-name">{hall.name}</div>
        <div className="hall-card-location">
          <MapPin size={13} /> {hall.city || hall.address || 'Location TBD'}
        </div>
        <div className="hall-card-meta">
          <span className="hall-card-capacity"><Users size={13} /> {hall.capacity?.toLocaleString() || '—'} pax</span>
          <span className="hall-card-price">{formatCurrency(hall.price_per_day)}<span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'var(--text-xs)' }}>/day</span></span>
        </div>
        {Array.isArray(hall.amenities) && hall.amenities.length > 0 && (
          <div className="amenity-chips" style={{ marginTop: 'var(--space-3)' }}>
            {hall.amenities.slice(0, 3).map((a) => (
              <span key={a} className="amenity-chip">✓ {a}</span>
            ))}
            {hall.amenities.length > 3 && <span className="amenity-chip">+{hall.amenities.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export function HallGallery({ images = [], hallName = '' }) {
  const placeholders = ['🏛️', '🎭', '✨']
  if (images.length === 0) {
    return (
      <div className="gallery-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`gallery-placeholder${i === 0 ? ' gallery-main' : ''}`}>{placeholders[i]}</div>
        ))}
      </div>
    )
  }
  return (
    <div className="gallery-grid">
      <div className="gallery-main">
        <img src={images[0]} alt={`${hallName} 1`} className="gallery-img" />
      </div>
      {images.slice(1, 3).map((src, i) => (
        <img key={i} src={src} alt={`${hallName} ${i + 2}`} className="gallery-img" />
      ))}
    </div>
  )
}
