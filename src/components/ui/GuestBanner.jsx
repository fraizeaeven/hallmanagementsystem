import React from 'react';
import { X } from 'lucide-react';
import '../../styles/_guestBanner.css';

export default function GuestBanner({ onSignIn, onDismiss, message }) {
  return (
    <div className="guest-banner" role="region" aria-label="Guest notice">
      <span>✍️</span>
      <span className="guest-banner-text">
        {message || "Browsing as guest — you can read all posts freely."}
      </span>
      <button className="guest-banner-btn" onClick={onSignIn}>
        Sign In
      </button>
      <button
        className="guest-banner-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
