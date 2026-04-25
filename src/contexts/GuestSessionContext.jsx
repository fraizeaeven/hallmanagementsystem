import { createContext, useContext, useState, useCallback } from 'react'

const GuestSessionContext = createContext(null)

const GUEST_ID_KEY    = 'eventnest_guest_id'
const DRAFT_POST_KEY  = 'eventnest_draft_post'

/** Returns a persistent guest ID (UUID-lite) stored in localStorage */
function getOrCreateGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = 'g-' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

export function GuestSessionProvider({ children }) {
  // Lazy init guestId
  const [guestId] = useState(() => getOrCreateGuestId())

  // ─── Draft Forum Post ─────────────────────────────────────────
  const saveDraftPost = useCallback((data) => {
    localStorage.setItem(DRAFT_POST_KEY, JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }))
  }, [])

  const getDraftPost = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_POST_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const clearDraftPost = useCallback(() => {
    localStorage.removeItem(DRAFT_POST_KEY)
  }, [])

  // ─── Pending intent (what triggered the login modal) ─────────
  // Stored so that after login we know what action to resume
  const savePendingIntent = useCallback((intent) => {
    sessionStorage.setItem('eventnest_pending_intent', intent)
  }, [])

  const getPendingIntent = useCallback(() => {
    return sessionStorage.getItem('eventnest_pending_intent')
  }, [])

  const clearPendingIntent = useCallback(() => {
    sessionStorage.removeItem('eventnest_pending_intent')
  }, [])

  return (
    <GuestSessionContext.Provider value={{
      guestId,
      saveDraftPost,
      getDraftPost,
      clearDraftPost,
      savePendingIntent,
      getPendingIntent,
      clearPendingIntent,
    }}>
      {children}
    </GuestSessionContext.Provider>
  )
}

export const useGuestSession = () => {
  const ctx = useContext(GuestSessionContext)
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider')
  return ctx
}
