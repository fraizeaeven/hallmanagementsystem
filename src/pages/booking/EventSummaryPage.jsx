import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, MapPin, Calendar, Users, Lock, Edit2, Landmark, ShieldCheck, CreditCard, Zap } from 'lucide-react'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { VENDOR_CATEGORIES } from '@/lib/constants'
import DynamicIcon from '@/components/ui/DynamicIcon'
import Button from '@/components/ui/Button'
import GuestNavbar from '@/components/layout/GuestNavbar'

const STEPS = [
  { label: 'Hall', done: true },
  { label: 'Vendors', done: true },
  { label: 'Review', active: true },
  { label: 'Confirm' },
]

export default function EventSummaryPage() {
  const navigate = useNavigate()
  const { booking, hallCost, vendorCost, totalCost } = useBooking()
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    if (!booking.hall) navigate('/halls')
  }, [booking.hall, navigate])

  if (!booking.hall) return null

  const handleConfirm = () => {
    if (user) {
      navigate('/booking/confirmed')
    } else {
      openAuthModal({
        intent: 'booking',
        onSuccess: () => navigate('/booking/confirmed'),
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#020108] text-white">
      <GuestNavbar />

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-[1280px]">
        {/* Stepper */}
        <div className="flex justify-center items-center gap-4 mb-20">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  s.done ? 'bg-blue-600 border-blue-600' : 
                  s.active ? 'bg-white/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                  'bg-white/5 border-white/10 text-gray-500'
                }`}>
                  {s.done ? <CheckCircle2 size={18} /> : (i + 1)}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${s.active ? 'text-blue-400' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-px ${s.done ? 'bg-blue-600' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/booking/vendors')} className="mb-10 text-gray-400 hover:text-white">
            <ArrowLeft size={16} className="mr-2" /> REVISE SELECTION
          </Button>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -z-10"></div>
            
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">REVIEW YOUR <span className="text-blue-500">EVENT.</span></h1>
              <p className="text-gray-400 text-lg">Finalize the details of your reservation below.</p>
            </header>

            <div className="space-y-8">
              {/* Venue Summary */}
              <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                      <Landmark size={20} />
                    </div>
                    <h3 className="font-bold text-xl uppercase tracking-tighter">VENUE DETAILS</h3>
                  </div>
                  <button onClick={() => navigate(`/halls/${booking.hall?.id}`)} className="text-xs font-black text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
                    Edit
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-48 aspect-video rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Landmark size={40} className="text-white/20" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold mb-2">{booking.hall?.name}</h4>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
                      <MapPin size={14} className="text-blue-500" /> {booking.hall?.address}, {booking.hall?.city}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">DATE</div>
                        <div className="flex items-center gap-2 font-bold">
                          <Calendar size={14} className="text-blue-400" /> {formatDate(booking.eventDate)}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">CAPACITY</div>
                        <div className="flex items-center gap-2 font-bold">
                          <Users size={14} className="text-blue-400" /> {booking.eventPax || '—'} GUESTS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendors Summary */}
              <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                      <Zap size={20} />
                    </div>
                    <h3 className="font-bold text-xl uppercase tracking-tighter">SELECTED SERVICES</h3>
                  </div>
                  <button onClick={() => navigate('/booking/vendors')} className="text-xs font-black text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest">
                    Edit
                  </button>
                </div>

                <div className="space-y-3">
                  {booking.selectedServices.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">No complementary services added.</p>
                  ) : (
                    booking.selectedServices.map((s) => {
                      const cat = VENDOR_CATEGORIES.find((c) => c.value === s.category)
                      return (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-purple-500/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-purple-400">
                              <DynamicIcon name={cat?.icon} size={20} />
                            </div>
                            <div>
                              <div className="font-bold">{s.name}</div>
                              <div className="text-xs text-gray-500">by {s.vendors?.business_name || '—'}</div>
                            </div>
                          </div>
                          <div className="font-black text-white">{formatCurrency(s.price)}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Price Calculation (Hidden internal values, showing total) */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-8 mt-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="text-center md:text-left">
                      <div className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-2">EXPECTED INVESTMENT</div>
                      <div className="text-5xl font-black tracking-tighter text-white">
                        {formatCurrency(totalCost)}
                      </div>
                   </div>
                   <div className="flex flex-col gap-3 w-full md:w-auto">
                    <Button
                      variant="primary"
                      size="xl"
                      className="shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all font-black text-lg"
                      onClick={handleConfirm}
                    >
                      {user ? 'CONFIRM RESERVATION' : 'LOG IN & SECURE DATE'}
                    </Button>
                    {!user && (
                      <div className="flex items-center justify-center gap-2 text-yellow-500/70 text-[10px] font-black uppercase tracking-widest">
                        <Lock size={12} /> SESSION TEMPORARILY SAVED
                      </div>
                    )}
                   </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-black uppercase tracking-widest">
                <ShieldCheck size={16} className="text-blue-500/50" /> 100% SECURE
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-xs font-black uppercase tracking-widest">
                <CheckCircle2 size={16} className="text-blue-500/50" /> INSTANT VERIFICATION
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-xs font-black uppercase tracking-widest">
                <CreditCard size={16} className="text-blue-500/50" /> ZERO HIDDEN FEES
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
