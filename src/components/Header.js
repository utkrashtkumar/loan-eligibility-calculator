'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Client Application Redirect Confirmation Modal (Global return popup)
  const [pendingApplication, setPendingApplication] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    const checkPendingApplication = () => {
      const stored = localStorage.getItem('pending_bank_application');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPendingApplication(parsed);
        } catch (e) {
          console.error('Error parsing pending bank application:', e);
        }
      }
    };

    checkPendingApplication();
    window.addEventListener('focus', checkPendingApplication);
    return () => {
      window.removeEventListener('focus', checkPendingApplication);
    };
  }, []);

  const handleConfirmApplied = async () => {
    if (!pendingApplication || !user) return;
    setSubmittingStatus(true);
    try {
      const uniqueAppId = `H2H-APP-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error } = await supabase.from('applications').insert({
        agent_id: user.id,
        client_name: pendingApplication.clientName,
        client_mobile: pendingApplication.clientMobile,
        bank_name: pendingApplication.bankName,
        loan_amount: Number(pendingApplication.loanAmount),
        loan_type: pendingApplication.loanType,
        commission_rate: 2.00,
        commission_amount: Number(pendingApplication.loanAmount) * 0.02,
        status: 'applied',
        application_id: uniqueAppId
      });

      if (error) {
        alert('Failed to save lead: ' + error.message);
      } else {
        alert(`Lead generated successfully for ${pendingApplication.clientName}! Application ID: ${uniqueAppId}`);
        localStorage.removeItem('pending_bank_application');
        setPendingApplication(null);
        router.refresh();
      }
    } catch (err) {
      console.error('Error confirming applied:', err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleConfirmNotApplied = () => {
    localStorage.removeItem('pending_bank_application');
    setPendingApplication(null);
  };
  
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    let savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme !== 'dark' && savedTheme !== 'light') savedTheme = 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const timer = setTimeout(() => {
      setTheme(savedTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleSessionCheck = async (session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, approved')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.role === 'agent' && !profile.approved) {
          await supabase.auth.signOut();
          setUser(null);
          setUserRole(null);
          router.push('/login?error=pending');
          return;
        }
        setUserRole(profile?.role || null);
      }
      setUser(session?.user || null);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionCheck(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password');
      } else {
        handleSessionCheck(session);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (e) {
        console.warn('Notifications table not configured yet:', e.message);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('realtime:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `agent_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20));
        setUnreadCount(c => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('agent_id', user.id)
        .eq('read', false);
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.warn('Failed to mark notifications read:', e);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Logout network request failed, proceeding to clear session locally:', err);
    }
    closeMenu();
    router.push('/');
    router.refresh();
  };

  const isLinkActive = (path) => pathname === path;

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="HandToHand Loans Logo"
            style={{ display: 'block', height: '36px', width: 'auto', flexShrink: 0, objectFit: 'contain' }}
          />
          <span className="logo-text" style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>
            HandToHand Loans
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            background: 'linear-gradient(135deg, #059669 0%, #ea580c 100%)',
            borderRadius: '20px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            boxShadow: '0 0 10px rgba(5, 150, 105, 0.5), 0 0 20px rgba(234, 88, 12, 0.3)',
            lineHeight: 1,
            textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'pulseGlow 2s infinite alternate',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            flexShrink: 0,
            marginLeft: '4px',
            WebkitTextFillColor: '#ffffff'
          }}>
            FINTECH
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li>
              <Link href="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/check" className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                Check Eligibility
              </Link>
            </li>
            <li>
              <Link href="/#emi-calculator" className="nav-link" style={{ marginLeft: '12px' }}>
                🧮 EMI Calculator
              </Link>
            </li>
            <li>
              <a
                href={user ? "https://consumer.experian.in/ecv-jet/affinityFlowController/affinityFlow?affinityId=369" : `/login?redirect=${encodeURIComponent("https://consumer.experian.in/ecv-jet/affinityFlowController/affinityFlow?affinityId=369")}`}
                target={user ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="nav-link"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--text-xs)', marginLeft: '4px' }}
                title="Free CIBIL report check in collaboration with Punjab National Bank"
              >
                📈 CIBIL Score <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--color-text-tertiary)', opacity: 0.85 }}>(Punjab National Bank Partnership)</span>
              </a>
            </li>
            {user ? (
              <>
                {(userRole === 'agent' || userRole === 'user' || user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com') && (
                <li>
                  <Link href="/banks" className={`nav-link ${isLinkActive('/banks') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                    🏦 Banks
                  </Link>
                </li>
                )}
                <li>
                  <Link href="/dashboard" className={`nav-link ${isLinkActive('/dashboard') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                    Dashboard
                  </Link>
                </li>
                {(user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com') && (
                  <li>
                    <Link href="/admin" className={`nav-link ${isLinkActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--color-success)', fontWeight: 600, marginLeft: '12px' }}>
                      Admin Panel
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="nav-link nav-logout" style={{ marginLeft: '12px' }}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/#banks" className="nav-link" style={{ marginLeft: '12px' }}>
                    🏦 Banks
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', marginLeft: '12px' }}>
                    Sign In
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right Header Actions (Theme Toggle & Hamburger) */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markAllRead();
                }}
                className="theme-toggle-btn"
                style={{ margin: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Notifications"
              >
                {/* Bell Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--color-error)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--color-bg-card)',
                    lineHeight: 1
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '12px',
                  width: '320px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  background: 'var(--color-bg-glass-heavy)',
                  backdropFilter: 'blur(25px)',
                  border: 'var(--border-light)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 999999,
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>🔔 Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>
                      No new notifications.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)',
                          borderLeft: n.read ? '2px solid transparent' : '2px solid var(--color-primary)',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 1.4
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ color: 'var(--color-text-secondary)' }}>{n.message}</div>
                          <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ margin: 0 }}
          >
            {theme === 'dark' ? (
              /* Moon Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              /* Sun Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div className="mobile-menu-backdrop" onClick={closeMenu} />
      )}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link href="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`} onClick={closeMenu}>
          Home
        </Link>
        <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`} onClick={closeMenu}>
          Check Eligibility
        </Link>
        <a
          href={user ? "https://consumer.experian.in/ecv-jet/affinityFlowController/affinityFlow?affinityId=369" : `/login?redirect=${encodeURIComponent("https://consumer.experian.in/ecv-jet/affinityFlowController/affinityFlow?affinityId=369")}`}
          target={user ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className="nav-link"
          style={{ color: 'var(--color-primary)', fontWeight: 700 }}
          onClick={closeMenu}
        >
          📈 Check CIBIL Score <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>(Punjab National Bank Partnership)</span>
        </a>
        {user ? (
          (userRole === 'agent' || userRole === 'user' || user.email === 'handtohandloans@gmail.com') && (
            <Link href="/banks" className={`nav-link ${isLinkActive('/banks') ? 'active' : ''}`} onClick={closeMenu}>
              🏦 Banks
            </Link>
          )
        ) : (
          <Link href="/#banks" className="nav-link" onClick={closeMenu}>
            🏦 Banks
          </Link>
        )}
        <Link href="/#emi-calculator" className="nav-link" onClick={closeMenu}>
          EMI Calculator
        </Link>
        {user ? (
          <>
            <Link href="/dashboard" className={`nav-link ${isLinkActive('/dashboard') ? 'active' : ''}`} onClick={closeMenu}>
              Dashboard
            </Link>
            {(user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com') && (
              <Link href="/admin" className={`nav-link nav-admin ${isLinkActive('/admin') ? 'active' : ''}`} onClick={closeMenu}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="nav-link nav-logout" style={{ width: '100%' }}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="nav-link nav-cta" style={{ width: '100%' }} onClick={closeMenu}>
            Sign In
          </Link>
        )}
      </div>

      {/* Global Applied/Not Applied Return Popup */}
      {pendingApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div className="form-card modal-drawer" style={{
            maxWidth: 'min(440px, 96vw)',
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gap: '20px',
            border: 'var(--border-accent)',
            background: 'var(--color-bg-tertiary)',
            backdropFilter: 'blur(20px)',
            padding: '28px 24px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-xl)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', margin: '0 auto' }}>📲</div>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                Update Lead Status
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                You were redirected to apply for <strong>{pendingApplication.clientName}</strong> at <strong>{pendingApplication.bankName}</strong>. 
                Did you complete the application?
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleConfirmNotApplied}
                className="btn btn-secondary"
                style={{ justifyContent: 'center', padding: '12px 16px', borderRadius: '10px' }}
                disabled={submittingStatus}
              >
                ✕ Not Applied
              </button>
              <button
                onClick={handleConfirmApplied}
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--gradient-primary)', border: 'none' }}
                disabled={submittingStatus}
              >
                {submittingStatus ? 'Saving Lead...' : '✓ Applied'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
