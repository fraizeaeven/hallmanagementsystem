import { Routes, Route, Navigate } from 'react-router-dom'

// Public flow pages (book first, register later)
import Landing from '@/pages/Landing'
import HallsPage from '@/pages/halls/HallsPage'
import HallDetailPage from '@/pages/halls/HallDetailPage'
import VendorSelectionPage from '@/pages/booking/VendorSelectionPage'
import EventSummaryPage from '@/pages/booking/EventSummaryPage'
import RegisterPage from '@/pages/booking/RegisterPage'
import ConfirmationPage from '@/pages/booking/ConfirmationPage'

// Forum (public community)
import ForumPage from '@/pages/forum/ForumPage'
import PostDetailPage from '@/pages/forum/PostDetailPage'
import CreatePostPage from '@/pages/forum/CreatePostPage'

// Auth
import Auth from '@/pages/Auth'

export default function App() {
  return (
    <Routes>
      {/* Public booking flow */}
      <Route path="/" element={<Landing />} />
      <Route path="/halls" element={<HallsPage />} />
      <Route path="/halls/:id" element={<HallDetailPage />} />
      <Route path="/booking/vendors" element={<VendorSelectionPage />} />
      <Route path="/booking/summary" element={<EventSummaryPage />} />
      <Route path="/booking/register" element={<RegisterPage />} />
      <Route path="/booking/confirmed" element={<ConfirmationPage />} />

      {/* Auth fallback */}
      <Route path="/auth" element={<Auth />} />

      {/* Forum — public community */}
      <Route path="/forum"              element={<ForumPage />} />
      <Route path="/forum/post/:slug"   element={<PostDetailPage />} />
      <Route path="/forum/create"       element={<CreatePostPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
