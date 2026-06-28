'use client';

import { useState, useEffect } from 'react';

// ── Helpers (safe to call at module level, never during SSR) ─────────────────
function detectIsInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function detectIsIOS() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
}

/**
 * PWAInstallPrompt — renders an animated "Install App" bottom banner.
 * Hooks into the browser's `beforeinstallprompt` event.
 * Also registers the service worker on mount.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner]         = useState(false);

  // All detection via lazy initializers — no setState inside effects
  const [isInstalled, setIsInstalled] = useState(detectIsInstalled);
  const [isIOS]                       = useState(detectIsIOS);

  // ── Register service worker ────────────────────────────────────────────────
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[PWA] SW registered:', reg.scope))
        .catch((err) => console.error('[PWA] SW failed:', err));
    }
  }, []);

  // ── iOS banner: show after 3 s if not dismissed ───────────────────────────
  useEffect(() => {
    if (!isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_ios_dismissed');
    if (wasDismissed) return;
    const t = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(t);
  }, [isIOS, isInstalled]);

  // ── Android/Chrome: capture install prompt ────────────────────────────────
  useEffect(() => {
    if (isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isInstalled]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(isIOS ? 'pwa_ios_dismissed' : 'pwa_banner_dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* ── Animated Install Banner ─────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          padding: '0 16px 16px',
          animation: 'pwa-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow:
              '0 -4px 40px rgba(99,102,241,0.25), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192x192.png"
              alt="H2H Loans App"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#ffffff',
                  lineHeight: 1.2,
                }}
              >
                Install H2H Loans App
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: '3px',
                }}
              >
                Fast • Works Offline • Free
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Dismiss install banner"
            >
              ✕
            </button>
          </div>

          {/* Benefits pills */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            {['⚡ Instant load', '📴 Works offline', '🔔 Get alerts', '📱 Home screen'].map(
              (b) => (
                <span
                  key={b}
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {b}
                </span>
              )
            )}
          </div>

          {/* iOS guide or Install button */}
          {isIOS ? (
            <div
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: '#a5b4fc' }}>To install on iPhone / iPad:</strong>
              <br />
              1. Tap the <strong>Share</strong> button{' '}
              <span style={{ fontSize: '16px' }}>⎋</span> in Safari
              <br />
              2. Scroll down and tap{' '}
              <strong>&quot;Add to Home Screen&quot;</strong>
              <br />
              3. Tap <strong>&quot;Add&quot;</strong> — done! 🎉
            </div>
          ) : (
            <button
              onClick={handleInstall}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)';
              }}
            >
              📲 Install App — It&apos;s Free
            </button>
          )}
        </div>
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(100px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
