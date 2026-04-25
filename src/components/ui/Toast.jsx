import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
  const EMOJI  = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

  return (
    <ToastContext.Provider value={{ toast: show }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`toast ${t.type}`} role="alert">
              <span className="toast-icon">{EMOJI[t.type]}</span>
              <div className="toast-content">
                {t.title && <div className="toast-title">{t.title}</div>}
                {t.message && <div className="toast-msg">{t.message}</div>}
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => remove(t.id)}>
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
