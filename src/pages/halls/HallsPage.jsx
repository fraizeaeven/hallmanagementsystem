import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Users, 
  Star, 
  Search, 
  Calendar, 
  Landmark, 
  Building2,
  Heart,
  ChevronRight
} from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/helpers'
import GuestNavbar from '@/components/layout/GuestNavbar'

// Mock data for when Supabase isn't connected
const MOCK_HALLS = [
  { id: '1', name: 'Grand Ballroom KL', city: 'Kuala Lumpur', address: 'Jalan Sultan Ismail', capacity: 500, price_per_day: 15000, amenities: ['Parking','WiFi','Stage','Air Conditioning','Sound System'], images: [], is_approved: true, is_active: true, rating: 4.9, reviews: 128 },
  { id: '2', name: 'The Majestic Hall', city: 'Petaling Jaya', address: 'Jalan SS2', capacity: 300, price_per_day: 8500, amenities: ['Parking','WiFi','Projector','Kitchen'], images: [], is_approved: true, is_active: true, rating: 4.7, reviews: 84 },
  { id: '3', name: 'Emerald Garden Venue', city: 'Shah Alam', address: 'Seksyen 7', capacity: 200, price_per_day: 6000, amenities: ['Outdoor Garden','Parking','Air Conditioning'], images: [], is_approved: true, is_active: true, rating: 4.8, reviews: 56 },
  { id: '4', name: 'Skyline Convention Centre', city: 'Kuala Lumpur', address: 'KLCC', capacity: 800, price_per_day: 25000, amenities: ['Parking','WiFi','Stage','Sound System','Projector','Elevator'], images: [], is_approved: true, is_active: true, rating: 4.6, reviews: 201 },
  { id: '5', name: 'Lakeside Pavilion', city: 'Putrajaya', address: 'Presint 1', capacity: 150, price_per_day: 4500, amenities: ['Outdoor Garden','Parking','WiFi'], images: [], is_approved: true, is_active: true, rating: 4.9, reviews: 43 },
  { id: '6', name: 'Heritage Mansion', city: 'Melaka', address: 'Jonker Walk', capacity: 250, price_per_day: 7000, amenities: ['Parking','Air Conditioning','Dressing Room','Kitchen'], images: [], is_approved: true, is_active: true, rating: 4.5, reviews: 67 },
]

const CITIES = ['All', 'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Putrajaya', 'Melaka']

export default function HallsPage() {
  const navigate = useNavigate()
  const { booking, selectHall } = useBooking()
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(booking.searchLocation || '')
  const [cityFilter, setCityFilter] = useState('All')
  const [capacityMin, setCapacityMin] = useState(booking.searchPax || '')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('halls').select('*').eq('is_active', true).eq('is_approved', true)
      if (data?.length) {
        setHalls(data.map((h, i) => ({ ...h, rating: (4.5 + Math.random() * 0.5).toFixed(1), reviews: 20 + Math.floor(Math.random() * 150) })))
      } else {
        setHalls(MOCK_HALLS)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = halls.filter((h) => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase())
    const matchCity = cityFilter === 'All' || h.city === cityFilter
    const matchCap = !capacityMin || h.capacity >= parseInt(capacityMin)
    return matchSearch && matchCity && matchCap
  })

  const handleSelect = (hall) => {
    selectHall(hall)
    navigate(`/halls/${hall.id}`)
  }

  return (
    <div className="halls-page-root">
      <GuestNavbar />

      <div className="container" style={{ paddingTop: 'var(--s-24)', paddingBottom: 'var(--s-16)', maxWidth: 1280, margin: '0 auto' }}>
        <div className="page-header" style={{ marginBottom: 'var(--s-10)' }}>
          <h1 className="page-title" style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, marginBottom: 'var(--s-2)' }}>Browse Halls</h1>
          <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
            {booking.searchDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)' }}>
                <Calendar size={14} /> {booking.searchDate}
              </span>
            )}
            {booking.searchPax && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)' }}>
                <Users size={14} /> {booking.searchPax} guests
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span>{filtered.length} venue{filtered.length !== 1 ? 's' : ''} available</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)', marginBottom: 'var(--s-12)' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-500)' }} />
            <input className="input input-lg" style={{ paddingLeft: 48, height: 56, borderRadius: 'var(--radius-xl)' }} placeholder="Search by name or city..."
              value={search} onChange={(e) => setSearch(e.target.value)} id="hall-search" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
            {CITIES.map((c) => (
              <div key={c} className={`filter-chip${cityFilter === c ? ' active' : ''}`} style={{ padding: 'var(--s-2) var(--s-4)', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--gray-200)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 600, transition: 'all 0.2s' }} onClick={() => setCityFilter(c)}>{c}</div>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="page-loader" style={{ padding: 'var(--s-20)' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--s-20)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)', marginBottom: 'var(--s-6)' }}>
              <Landmark size={40} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', marginBottom: 'var(--s-2)' }}>No halls found</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: 400 }}>We couldn't find any venues matching your criteria. Try adjusting your filters or location.</p>
          </div>
        ) : (
          <div className="halls-grid animate-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--s-8)' }}>
            {filtered.map((h) => (
              <div key={h.id} className="hall-card" onClick={() => handleSelect(h)} id={`hall-${h.id}`} style={{ cursor: 'pointer', overflow: 'hidden', transition: 'all 0.3s' }}>
                <div style={{ position: 'relative', height: 240 }}>
                  <div className="hall-card-img-placeholder" style={{ background: 'var(--gray-50)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-300)' }}>
                    <Building2 size={48} strokeWidth={1.5} />
                  </div>
                  <div className="hall-card-badge" style={{ position: 'absolute', top: 'var(--s-4)', left: 'var(--s-4)', background: 'var(--brand-600)', color: 'white', padding: 'var(--s-1) var(--s-3)', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: 'var(--shadow-sm)' }}>Featured</div>
                  <button className="hall-card-fav" style={{ position: 'absolute', top: 'var(--s-4)', right: 'var(--s-4)', width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.8)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }} onClick={(e) => { e.stopPropagation() }}>
                    <Heart size={18} color="var(--text-secondary)" />
                  </button>
                </div>
                <div className="hall-card-body" style={{ padding: 'var(--s-6)' }}>
                  <div className="hall-card-name" style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--s-1)' }}>{h.name}</div>
                  <div className="hall-card-location" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-4)' }}>
                    <MapPin size={14} /> {h.city}
                  </div>
                  <div className="hall-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginBottom: 'var(--s-6)' }}>
                    <div className="hall-card-rating" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', fontWeight: 700 }}>
                      <Star size={14} fill="var(--warning, #f59e0b)" color="var(--warning, #f59e0b)" /> {h.rating} 
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 'var(--s-1)' }}>({h.reviews})</span>
                    </div>
                    <span style={{ color: 'var(--gray-200)' }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <Users size={14} /> Up to {h.capacity}
                    </div>
                  </div>
                  <div className="hall-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--gray-100)', paddingTop: 'var(--s-4)' }}>
                    <div className="hall-card-price" style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--brand-600)' }}>
                      {formatCurrency(h.price_per_day)} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-muted)' }}>/ day</span>
                    </div>
                    <ChevronRight size={20} color="var(--gray-300)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
