import { useNavigate, Link } from 'react-router-dom'
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar, 
  Star, 
  ShieldCheck, 
  Zap, 
  Heart, 
  MessageSquare, 
  Landmark, 
  PartyPopper, 
  HelpCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { useState } from 'react'
import GuestNavbar from '@/components/layout/GuestNavbar'

export default function Landing() {
  const navigate = useNavigate()
  const { setSearch } = useBooking()
  const [date, setDate] = useState('')
  const [pax, setPax] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(date, pax, location)
    navigate('/halls')
  }

  return (
    <div className="landing-root">
      <GuestNavbar />

      {/* HERO */}
      <section className="hero" style={{ paddingTop: 'var(--s-20)', paddingBottom: 'var(--s-16)' }}>
        <div className="hero-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)', padding: 'var(--s-1) var(--s-3)' }}>
            <Sparkles size={14} /> 
            <span>No account required to start</span>
          </div>
          <h1 className="hero-title" style={{ marginTop: 'var(--s-4)', marginBottom: 'var(--s-4)' }}>
            Find your perfect <em>event venue</em> in minutes.
          </h1>
          <p className="hero-subtitle" style={{ marginBottom: 'var(--s-8)', maxWidth: 640 }}>
            Browse halls, add vendors, and complete your booking — all before signing up. It's that easy.
          </p>

          {/* Search bar */}
          <form className="search-bar" onSubmit={handleSearch} id="hero-search" style={{ margin: '0 auto', maxWidth: 1000 }}>
            <div className="search-field">
              <span className="search-field-label">
                <Calendar size={14} /> 
                <span>Date</span>
              </span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} placeholder="Select date" />
            </div>
            <div className="search-field">
              <span className="search-field-label">
                <Users size={14} /> 
                <span>Guests</span>
              </span>
              <input type="number" value={pax} onChange={(e) => setPax(e.target.value)}
                placeholder="How many guests?" min="1" />
            </div>
            <div className="search-field">
              <span className="search-field-label">
                <MapPin size={14} /> 
                <span>Location</span>
              </span>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="City or area" />
            </div>
            <button type="submit" className="search-btn" id="check-availability-btn" style={{ gap: 'var(--s-2)' }}>
              <Search size={18} />
              Check Availability
            </button>
          </form>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 'var(--s-12)', padding: 'var(--s-6) 0' }}>
        {[
          { icon: <Landmark size={20} />, value: '200+', label: 'Verified Halls' },
          { icon: <Star size={20} />, value: '4.8', label: 'Avg Rating' },
          { icon: <PartyPopper size={20} />, value: '5,000+', label: 'Events Hosted' },
          { icon: <ShieldCheck size={20} />, value: '100%', label: 'Secure Booking' },
        ].map((item, idx) => (
          <div className="trust-item" key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            <div className="trust-icon" style={{ color: 'var(--brand-500)' }}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--s-1)' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* COMMUNITY FORUM SECTION */}
      <section style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)', padding: 'var(--s-20) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--s-8)', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--s-12)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-full)', padding: 'var(--s-1) var(--s-3)', fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 'var(--s-6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MessageSquare size={14} /> NEW FEATURE
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 'var(--s-6)', letterSpacing: '-0.03em' }}>
              Join our Event Planning Community
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8, marginBottom: 'var(--s-8)', fontSize: 'var(--text-lg)', maxWidth: 540 }}>
              Ask for hall recommendations, share vendor reviews, and get advice from real people who have planned events just like yours. No login required to browse.
            </p>
            <div style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
              <Link to="/forum" className="btn" id="landing-forum-btn" style={{ background: 'white', color: 'var(--brand-600)', fontWeight: 700, height: 52, borderRadius: 'var(--radius-lg)', padding: '0 var(--s-8)', display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                Browse Community <ArrowRight size={18} />
              </Link>
              <Link to="/forum/create" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', height: 52, borderRadius: 'var(--radius-lg)', padding: '0 var(--s-8)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                Start a Discussion
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 'var(--s-4)' }}>
            {[
              { icon: <Landmark size={20} />, label: 'Looking for Hall', desc: 'Melaka wedding hall for 200 pax — any recommendations?' },
              { icon: <Star size={20} />, label: 'Vendor Review', desc: 'Honest review of catering vendor for corporate lunch' },
              { icon: <HelpCircle size={20} />, label: 'Ask for Experience', desc: 'Anyone used Dewan XYZ before? How was the service?' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-xl)', padding: 'var(--s-5)', display: 'flex', alignItems: 'center', gap: 'var(--s-4)', transition: 'transform 0.2s', cursor: 'default' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--s-1)' }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--text-base)', color: 'white', lineHeight: 1.4, fontWeight: 500 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container" style={{ padding: 'var(--s-24) var(--s-8)', maxWidth: 1200, margin: '0 auto' }}>
        <div className="text-center" style={{ marginBottom: 'var(--s-16)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--brand-500)', marginBottom: 'var(--s-4)' }}>
            Process Flow
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 'var(--s-4)', letterSpacing: '-0.02em' }}>
            Book in 4 simple steps
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
            We've streamlined the venue discovery process. No registration needed until you're ready to secure your choice.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s-8)' }}>
          {[
            { step: '1', icon: <Search size={22} />, title: 'Search', desc: 'Enter your date, guest count, and location to find available halls.' },
            { step: '2', icon: <Landmark size={22} />, title: 'Select Hall', desc: 'Browse photos, check amenities, and pick the perfect venue.' },
            { step: '3', icon: <Zap size={22} />, title: 'Add Vendors', desc: 'Choose from catering, decoration, photography, and more.' },
            { step: '4', icon: <ShieldCheck size={22} />, title: 'Confirm', desc: 'Review your booking, register via one-page form, and finalize.' },
          ].map((item) => (
            <div key={item.step} className="card" style={{ textAlign: 'center', padding: 'var(--s-10)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--s-6)' }}>
                {item.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: 'var(--s-3)' }}>{item.title}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--gray-900)', padding: 'var(--s-24) var(--s-8)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, color: 'white', marginBottom: 'var(--s-6)', letterSpacing: '-0.02em' }}>
            Ready to find your venue?
          </h2>
          <p style={{ color: 'var(--gray-400)', marginBottom: 'var(--s-10)', fontSize: 'var(--text-lg)', lineHeight: 1.7 }}>
            Join thousands of event planners who trust EventNest for their venue selection and vendor management.
          </p>
          <button className="btn btn-primary btn-xl" style={{ fontSize: 'var(--text-base)', padding: '0 var(--s-12)', height: 60, borderRadius: 'var(--radius-lg)' }} onClick={() => navigate('/halls')} id="cta-browse">
            Browse Halls Now <ArrowRight size={20} style={{ marginLeft: 'var(--s-2)' }} />
          </button>
        </div>
        {/* Subtle background decoration */}
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'radial-gradient(circle, rgba(108, 92, 231, 0.1) 0%, transparent 70%)', transform: 'rotate(-45deg)' }}></div>
      </section>

      <footer className="footer" style={{ borderTop: '1px solid var(--gray-100)', padding: 'var(--s-8) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--s-8)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
          © 2026 EventNest. All rights reserved. Precision-crafted for seamless event planning.
        </div>
      </footer>
    </div>
  )
}
