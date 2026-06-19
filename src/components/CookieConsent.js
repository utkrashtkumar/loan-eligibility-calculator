'use client';

import { useState, useEffect } from 'react';

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check if consent has already been given (cookie or localStorage)
    const consent = localStorage.getItem('cookie_consent') || getCookie('cookie_consent');
    setTimeout(() => {
      setMounted(true);
      if (!consent) {
        setVisible(true);
      }
    }, 0);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setCookie('cookie_consent', 'accepted', 365); // 1 year
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setCookie('cookie_consent', 'declined', 365); // 1 year
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(900px, 92vw)',
        background: 'var(--color-bg-glass-heavy)',
        border: 'var(--border-light)',
        borderRadius: 'var(--border-radius-lg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        boxShadow: 'var(--shadow-lg), 0 10px 30px rgba(0, 0, 0, 0.25)',
        zIndex: 99999,
        animation: 'fadeInScale 0.4s ease-out',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ flex: '1', minWidth: '280px' }}>
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🍪 Cookie Preference
        </h4>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
          We use cookies to enhance your experience, analyze site traffic, and optimize loan eligibility matching. By clicking &quot;Accept Cookies&quot;, you consent to our use of cookies.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'nowrap' }}>
        <button
          onClick={handleDecline}
          className="btn btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: 'var(--text-xs)',
            borderRadius: '6px',
            cursor: 'pointer',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--color-text-secondary)'
          }}
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="btn btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: 'var(--text-xs)',
            borderRadius: '6px',
            cursor: 'pointer',
            background: 'var(--gradient-primary)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            boxShadow: 'var(--shadow-glow-purple)'
          }}
        >
          Accept Cookies
        </button>
      </div>
    </div>
  );
}
