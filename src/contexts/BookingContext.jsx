import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const BookingContext = createContext(null)

const STORAGE_KEY = 'eventnest_booking'

const DEFAULTS = {
  // Search
  searchDate: '',
  searchPax: '',
  searchLocation: '',
  // Selected hall
  hall: null,
  // Selected date from calendar
  eventDate: '',
  eventPax: '',
  // Vendors / services
  selectedServices: [],
  // Event details
  eventTitle: '',
  eventType: 'wedding',
  setupTime: '08:00',
  startTime: '10:00',
  endTime: '22:00',
  teardownTime: '23:00',
  notes: '',
}

/** Load persisted booking from localStorage, merging with defaults for safety */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(() => loadFromStorage())

  // Persist every booking change to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(booking))
    } catch {
      // Quota exceeded or private mode — fail silently
    }
  }, [booking])

  const update = useCallback((patch) => {
    setBooking((prev) => ({ ...prev, ...patch }))
  }, [])

  const setSearch = (searchDate, searchPax, searchLocation) => {
    update({ searchDate, searchPax, searchLocation, eventDate: searchDate, eventPax: searchPax })
  }

  const selectHall = (hall) => update({ hall })

  const toggleService = (service) => {
    setBooking((prev) => {
      const exists = prev.selectedServices.find((s) => s.id === service.id)
      return {
        ...prev,
        selectedServices: exists
          ? prev.selectedServices.filter((s) => s.id !== service.id)
          : [...prev.selectedServices, service],
      }
    })
  }

  const hallCost   = parseFloat(booking.hall?.price_per_day) || 0
  const vendorCost = booking.selectedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
  const totalCost  = hallCost + vendorCost

  /** Full reset: clears state AND localStorage */
  const reset = useCallback(() => {
    setBooking({ ...DEFAULTS })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /** Re-hydrate from localStorage (e.g. after login) */
  const restoreFromStorage = useCallback(() => {
    setBooking(loadFromStorage())
  }, [])

  return (
    <BookingContext.Provider value={{
      booking,
      update,
      setSearch,
      selectHall,
      toggleService,
      hallCost,
      vendorCost,
      totalCost,
      reset,
      restoreFromStorage,
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
