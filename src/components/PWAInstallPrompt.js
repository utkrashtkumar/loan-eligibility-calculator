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
  const [debugPWA, setDebugPWA]             = useState(false);

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS]             = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  // ── Client-side safe initialization ────────────────────────────────────────
  useEffect(() => {
    setIsInstalled(detectIsInstalled());
    setIsIOS(detectIsIOS());
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // ── Debug mode check ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDebug = window.location.search.includes('debug_pwa=true');
      setDebugPWA(isDebug);
      if (isDebug) {
        setShowBanner(true);
      }
    }
  }, []);

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
    if (debugPWA) return;
    if (!isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_ios_dismissed');
    if (wasDismissed) return;
    const t = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(t);
  }, [isIOS, isInstalled, debugPWA]);

  // ── Android/Chrome: capture install prompt ────────────────────────────────
  useEffect(() => {
    if (debugPWA) return;
    if (isIOS || isInstalled) return;
    const wasDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (wasDismissed) return;

    // Check if the event was already captured by layout head script early on
    if (typeof window !== 'undefined' && window.deferredPWAEvent) {
      setDeferredPrompt(window.deferredPWAEvent);
      setTimeout(() => setShowBanner(true), 3000);
    }

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
  }, [isIOS, isInstalled, debugPWA]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (debugPWA && !deferredPrompt) {
      alert("Preview Mode: In a live environment, this button will trigger your device's native browser PWA installation dialog.");
      return;
    }
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
    if (!debugPWA) {
      localStorage.setItem(isIOS ? 'pwa_ios_dismissed' : 'pwa_banner_dismissed', '1');
    }
  };

  if (!debugPWA && (isInstalled || !showBanner)) return null;
  if (debugPWA && !showBanner) return null;

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
            background: 'var(--color-bg-glass-heavy)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--color-primary-light)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: 'var(--shadow-xl), 0 0 30px var(--color-primary-light)',
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
                boxShadow: '0 4px 12px var(--color-primary-light)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '15px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.2,
                }}
              >
                Install H2H Loans App
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '3px',
                }}
              >
                Fast • Works Offline • Free
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'var(--color-bg-tertiary)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
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
            {['Instant load', 'Works offline', 'Get alerts', 'Home screen'].map(
              (b) => (
                <span
                  key={b}
                  style={{
                    background: 'var(--color-primary-light)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    color: 'var(--color-text-primary)',
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
                background: 'var(--color-primary-light)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>To install on iPhone / iPad:</strong>
              <br />
              1. Tap the <strong>Share</strong> button{' '}
              <span style={{ fontSize: '16px' }}>⎋</span> in Safari
              <br />
              2. Scroll down and tap{' '}
              <strong>&quot;Add to Home Screen&quot;</strong>
              <br />
              3. Tap <strong>&quot;Add&quot;</strong> — done!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', width: '100%' }}>
              <button
                onClick={handleInstall}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: 'var(--shadow-md), 0 4px 15px var(--color-primary-light)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg), 0 6px 20px var(--color-primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md), 0 4px 15px var(--color-primary-light)';
                }}
              >
                Install App — It&apos;s Free
              </button>
              {isMobile && (
                <div
                  style={{
                    background: 'var(--color-primary-light)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)' }}>To install on Android / Chrome:</strong>
                  <br />
                  1. Tap the <strong>three dots menu</strong>{' '}
                  <span style={{ fontSize: '14px' }}>⋮</span> in Chrome
                  <br />
                  2. Tap <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>
                </div>
              )}
            </div>
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
