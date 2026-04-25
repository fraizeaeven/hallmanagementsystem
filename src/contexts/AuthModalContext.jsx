import { createContext, useContext, useState, useCallback } from 'react'

/**
 * AuthModalContext — thin global API to open / close the auth conversion modal
 * from anywhere in the tree without prop-drilling.
 *
 * Usage:
 *   const { openAuthModal } = useAuthModal()
 *   openAuthModal({
 *     intent: 'booking' | 'forum_post' | 'comment' | 'general',
 *     message: 'custom override message',   // optional
 *     onSuccess: (user) => { ... },         // called after successful login
 *   })
 */

const AuthModalContext = createContext(null)

const INTENT_MESSAGES = {
  booking:    'Create a free account to confirm your booking and proceed to payment.',
  forum_post: 'Sign in to publish your question to the community.',
  comment:    'Sign in to join the conversation and post a comment.',
  general:    'Create an account or sign in to continue.',
}

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen]     = useState(false)
  const [intent, setIntent]     = useState('general')
  const [message, setMessage]   = useState('')
  const [onSuccess, setOnSuccess] = useState(null)

  const openAuthModal = useCallback(({ intent = 'general', message = '', onSuccess } = {}) => {
    setIntent(intent)
    setMessage(message || INTENT_MESSAGES[intent] || INTENT_MESSAGES.general)
    // Wrap in a fn to avoid React treating it as a state updater fn
    setOnSuccess(() => onSuccess || null)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
    // Give the close animation time before clearing state
    setTimeout(() => {
      setIntent('general')
      setMessage('')
      setOnSuccess(null)
    }, 300)
  }, [])

  const triggerSuccess = useCallback((user) => {
    if (typeof onSuccess === 'function') {
      onSuccess(user)
    }
    closeAuthModal()
  }, [onSuccess, closeAuthModal])

  return (
    <AuthModalContext.Provider value={{
      isOpen,
      intent,
      message,
      openAuthModal,
      closeAuthModal,
      triggerSuccess,
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
