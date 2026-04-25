export const ROLES = {
  GUEST: 'guest',
  HALL_OWNER: 'hall_owner',
  VENDOR: 'vendor',
  ADMIN: 'admin',
}

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const EVENT_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: 'Ring' },
  { value: 'gala', label: 'Gala Dinner', icon: 'Music' },
  { value: 'appreciation', label: 'Appreciation Night', icon: 'Trophy' },
  { value: 'corporate', label: 'Corporate Event', icon: 'Briefcase' },
  { value: 'birthday', label: 'Birthday', icon: 'Cake' },
  { value: 'other', label: 'Other', icon: 'PartyPopper' },
]

export const VENDOR_CATEGORIES = [
  { value: 'catering', label: 'Catering', icon: 'Utensils' },
  { value: 'decor', label: 'Decoration', icon: 'Palette' },
  { value: 'photography', label: 'Photography', icon: 'Camera' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Music' },
  { value: 'av', label: 'AV & Lighting', icon: 'Cpu' },
  { value: 'florist', label: 'Florist', icon: 'Flower' },
  { value: 'transport', label: 'Transport', icon: 'Truck' },
  { value: 'makeup', label: 'Makeup & Hair', icon: 'Sparkles' },
  { value: 'emcee', label: 'Emcee / MC', icon: 'Mic' },
  { value: 'other', label: 'Other', icon: 'Sparkles' },
]

export const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'starting_from', label: 'Starting From' },
  { value: 'per_pax', label: 'Per Person' },
  { value: 'per_hour', label: 'Per Hour' },
  { value: 'negotiable', label: 'Negotiable' },
]

export const PRICE_TYPE_LABELS = {
  fixed: '',
  starting_from: 'from',
  per_pax: '/pax',
  per_hour: '/hour',
  negotiable: '~ negotiable',
}

export const AMENITIES_LIST = [
  'Parking', 'WiFi', 'Stage', 'Air Conditioning', 'Sound System',
  'Projector', 'Dressing Room', 'Kitchen', 'Outdoor Garden', 'Prayer Room',
  'Valet Service', 'Backup Generator', 'Elevator', 'CCTV Security',
]

export const NOTIFICATION_TYPES = {
  BOOKING_NEW: 'booking_new',
  BOOKING_CONFIRMED: 'booking_confirmed',
  VENDOR_ADDED: 'vendor_added',
  STATUS_CHANGED: 'status_changed',
  REMINDER: 'reminder',
  SYSTEM: 'system',
}

export const WHATSAPP_BASE = 'https://wa.me/'

export const buildWhatsAppLink = (phone, message = '') => {
  const clean = phone?.replace(/[^0-9]/g, '') || ''
  const msg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `${WHATSAPP_BASE}${clean}${msg}`
}

// ─── FORUM ───────────────────────────────────────────────────
export const FORUM_CATEGORIES = [
  { value: 'looking_for_hall',  label: 'Looking for Hall',    icon: 'Landmark', color: '#6C5CE7' },
  { value: 'vendor_review',     label: 'Vendor Review',       icon: 'Star', color: '#FDCB6E' },
  { value: 'ask_experience',    label: 'Ask for Experience',  icon: 'HelpCircle', color: '#00B894' },
  { value: 'event_discussion',  label: 'Event Discussion',    icon: 'MessageSquare', color: '#74B9FF' },
  { value: 'recommendation',    label: 'Recommendation',      icon: 'ThumbsUp', color: '#FD7272' },
]

export const FORUM_CATEGORY_MAP = Object.fromEntries(
  FORUM_CATEGORIES.map(c => [c.value, c])
)

export const FORUM_SORT_OPTIONS = [
  { value: 'latest',    label: 'Latest' },
  { value: 'popular',   label: 'Most Popular' },
]
