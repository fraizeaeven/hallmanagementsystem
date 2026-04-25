import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay, addMonths, subMonths } from 'date-fns'

export default function AvailabilityCalendar({ blockedDates = [], bookedDates = [], selected, onSelect, minDate = new Date() }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(minDate || new Date()))
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const startPad = getDay(startOfMonth(viewMonth))
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const isBlocked = (d) => blockedDates.some((bd) => isSameDay(new Date(bd), d))
  const isBooked  = (d) => bookedDates.some((bd) => isSameDay(new Date(bd), d))
  const isSelected = (d) => selected && isSameDay(selected, d)
  const isPastDay  = (d) => isPast(d) && !isToday(d)

  const getDayClass = (d) => {
    if (isSelected(d)) return 'cal-day selected'
    if (isBlocked(d))  return 'cal-day blocked'
    if (isBooked(d))   return 'cal-day booked'
    if (isPastDay(d))  return 'cal-day past'
    if (isToday(d))    return 'cal-day today'
    return 'cal-day'
  }

  const handleClick = (d) => {
    if (isBlocked(d) || isBooked(d) || isPastDay(d)) return
    onSelect?.(d)
  }

  return (
    <div>
      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
          <ChevronLeft size={16} />
        </button>
        <span className="cal-month">{format(viewMonth, 'MMMM yyyy')}</span>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="cal-header">
        {DAY_NAMES.map((d) => <div key={d} className="cal-day-name">{d}</div>)}
      </div>
      <div className="cal-grid">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} className="cal-day empty" />)}
        {days.map((d) => (
          <div key={d.toISOString()} className={getDayClass(d)} onClick={() => handleClick(d)} title={format(d, 'dd MMM')}>
            {format(d, 'd')}
          </div>
        ))}
      </div>
      <div className="flex gap-3" style={{ marginTop: 'var(--s-4)', flexWrap: 'wrap' }}>
        <div className="flex items-center gap-2 text-sm text-secondary"><div className="cal-day booked" style={{ width: 16, height: 16, fontSize: 12 }} /> Booked</div>
        <div className="flex items-center gap-2 text-sm text-secondary"><div className="cal-day blocked" style={{ width: 16, height: 16, fontSize: 12 }} /> Blocked</div>
        <div className="flex items-center gap-2 text-sm text-secondary"><div className="cal-day today" style={{ width: 16, height: 16, fontSize: 12 }} /> Today</div>
      </div>
    </div>
  )
}
