import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { BookingProvider } from './contexts/BookingContext'
import { GuestSessionProvider } from './contexts/GuestSessionContext'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/ui/ThemeToggle'
import AuthModal from './components/ui/AuthModal'
import './styles/index.css'
import './styles/forum.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <GuestSessionProvider>
              <AuthModalProvider>
                <ToastProvider>
                  <App />
                  <ThemeToggle />
                  {/* Global conversion modal — rendered once at root */}
                  <AuthModal />
                </ToastProvider>
              </AuthModalProvider>
            </GuestSessionProvider>
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
