'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loansDropdownOpen, setLoansDropdownOpen] = useState(false);
  const [mobileLoansOpen, setMobileLoansOpen] = useState(false);
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
  
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);
  const [userFont, setUserFont] = useState('Jakarta');

  useEffect(() => {
    let savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme !== 'dark' && savedTheme !== 'light') savedTheme = 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedFont = localStorage.getItem('user-font') || 'Jakarta';

    const timer = setTimeout(() => {
      setMounted(true);
      setUserFont(savedFont);
      setTheme(savedTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const changeFont = (newFont) => {
    setUserFont(newFont);
    localStorage.setItem('user-font', newFont);

    let fontBody = '';
    let fontHeading = '';
    if (newFont === 'Inter') { fontBody = 'Inter, sans-serif'; fontHeading = 'Inter, sans-serif'; }
    else if (newFont === 'Poppins') { fontBody = 'Poppins, sans-serif'; fontHeading = 'Poppins, sans-serif'; }
    else if (newFont === 'Outfit') { fontBody = 'Outfit, sans-serif'; fontHeading = 'Outfit, sans-serif'; }
    else if (newFont === 'Lora') { fontBody = 'Lora, serif'; fontHeading = 'Lora, serif'; }
    else if (newFont === 'Playfair') { fontBody = '"Playfair Display", serif'; fontHeading = '"Playfair Display", serif'; }
    else if (newFont === 'JetBrains') { fontBody = '"JetBrains Mono", monospace'; fontHeading = '"JetBrains Mono", monospace'; }
    else { fontBody = 'var(--font-inter), "Plus Jakarta Sans", sans-serif'; fontHeading = 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif'; }
    
    if (fontBody) {
      document.documentElement.style.setProperty('--font-body', fontBody);
      document.documentElement.style.setProperty('--font-heading', fontHeading);
    }
  };

  const cycleFont = () => {
    const fontOrder = ['Jakarta', 'Inter', 'Poppins', 'Outfit', 'Lora', 'Playfair', 'JetBrains'];
    const currentIndex = fontOrder.indexOf(userFont);
    const nextIndex = (currentIndex + 1) % fontOrder.length;
    const nextFont = fontOrder[nextIndex];
    changeFont(nextFont);
  };

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
      const timer = setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
      }, 0);
      return () => clearTimeout(timer);
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

    const isAdmin = user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com';

    const channel = supabase
      .channel('realtime:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        ...(isAdmin ? {} : { filter: `agent_id=eq.${user.id}` })
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
      const isAdmin = user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com';
      const query = supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (!isAdmin) {
        query.eq('agent_id', user.id);
      }

      const { error } = await query;
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.warn('Failed to mark notifications read:', e);
    }
  };

  const clearReadNotifications = async () => {
    if (!user) return;
    try {
      const isAdmin = user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com';
      const query = supabase
        .from('notifications')
        .delete()
        .eq('read', true);
      
      if (!isAdmin) {
        query.eq('agent_id', user.id);
      }

      const { error } = await query;
      if (!error) {
        setNotifications(prev => prev.filter(n => !n.read));
      }
    } catch (e) {
      console.warn('Failed to clear read notifications:', e);
    }
  };

  const handleNotificationClick = async (n) => {
    // 1. Mark as read if not already read
    if (!n.read) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', n.id);
        if (!error) {
          setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
          setUnreadCount(c => Math.max(0, c - 1));
        }
      } catch (e) {
        console.warn('Failed to mark notification read on click:', e);
      }
    }

    // 2. Determine redirect URL
    const isAdmin = user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com';
    let targetUrl = '/dashboard';
    
    if (isAdmin) {
      const type = n.activity_type;
      const refId = n.reference_id;
      if (type === 'registration') {
        targetUrl = `/admin?tab=pending_agents&agentId=${refId}`;
      } else if (type === 'application') {
        targetUrl = `/admin?tab=agent_applications&appId=${refId}`;
      } else if (type === 'payout') {
        targetUrl = `/admin?tab=payouts`;
      } else if (type === 'agreement') {
        targetUrl = `/admin?tab=agreements&agentId=${refId}`;
      } else if (type === 'resign') {
        targetUrl = `/admin?tab=pending_agents&agentId=${refId}`;
      } else {
        targetUrl = `/admin`;
      }
    }

    // Close notifications panel
    setShowNotifications(false);

    // 3. Navigate
    if (typeof window !== 'undefined') {
      router.push(targetUrl);
      if (window.location.pathname === '/admin') {
        // Dispatch custom event to notify admin page of URL change
        const event = new CustomEvent('admin-query-change');
        window.dispatchEvent(event);
      }
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
          <div className="logo-text-group">
            <span className="logo-text">
              HandToHand Loans
            </span>
            <span className="logo-badge-fintech">
              FINTECH
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            {mounted && (
              <>
            <li>
              <Link href="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`}>
                Home
              </Link>
            </li>
            
            {/* Loans Dropdown */}
            <li 
              className="dropdown-container"
              onMouseEnter={() => setLoansDropdownOpen(true)}
              onMouseLeave={() => setLoansDropdownOpen(false)}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <button 
                className={`nav-link dropdown-toggle ${loansDropdownOpen ? 'active' : ''}`}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  color: 'inherit',
                  padding: '8px 0'
                }}
                onClick={() => setLoansDropdownOpen(!loansDropdownOpen)}
              >
                Loans
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: loansDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M1 1l4 4 4-4" />
                </svg>
              </button>
              {loansDropdownOpen && (
                <ul className="dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  background: 'var(--color-bg-glass-heavy)',
                  backdropFilter: 'blur(20px)',
                  border: 'var(--border-light)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '8px 0',
                  margin: '4px 0 0 0',
                  listStyle: 'none',
                  minWidth: '160px',
                  zIndex: 99999
                }}>
                  <li>
                    <Link 
                      href={user ? "/banks?category=instant" : "/check?type=instant"} 
                      className="dropdown-item" 
                      onClick={() => setLoansDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '8px 16px',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'background 0.2s'
                      }}
                    >
                      Instant Loan
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href={user ? "/banks?category=salary" : "/check?type=salary"} 
                      className="dropdown-item" 
                      onClick={() => setLoansDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '8px 16px',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'background 0.2s'
                      }}
                    >
                      Salary Loan
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href={user ? "/banks?category=business" : "/check?type=business"} 
                      className="dropdown-item" 
                      onClick={() => setLoansDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '8px 16px',
                        color: 'var(--color-text-primary)',
                        textDecoration: 'none',
                        fontSize: '13px',
                        transition: 'background 0.2s'
                      }}
                    >
                      Business Loan
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Credit Cards */}
            <li>
              <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                Credit Cards
              </Link>
            </li>
            <li>
              <Link href="/check" className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                Check Eligibility
              </Link>
            </li>
            <li>
              <Link href="/#emi-calculator" className="nav-link" style={{ marginLeft: '12px' }}>
                EMI Calculator
              </Link>
            </li>
            <li>
              <Link href="/verify-agreement" className={`nav-link ${isLinkActive('/verify-agreement') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                Verify Agreement
              </Link>
            </li>
            <li>
              <Link href="/blog" className={`nav-link ${isLinkActive('/blog') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/cibil"
                className={`nav-link ${isLinkActive('/cibil') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--text-xs)', marginLeft: '4px' }}
                title="Free CIBIL report check in collaboration with PNB"
              >
                CIBIL Score <span className="cibil-subtext">(PNB Partnership)</span>
              </Link>
            </li>
            {user ? (
              <>
                {(userRole === 'agent' || userRole === 'user' || user.email === 'handtohandloans@gmail.com' || user.email === 'utkrashtkumar@gmail.com') && (
                <li>
                  <Link href="/banks" className={`nav-link ${isLinkActive('/banks') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                    Banks
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
                    Banks
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', marginLeft: '12px' }}>
                    Sign In
                  </Link>
                </li>
              </>
            )}
              </>
            )}
          </ul>
        </nav>

        {/* Right Header Actions (Theme Toggle & Hamburger) */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {mounted && user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
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
                <div className="header-notification-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                          Mark all read
                        </button>
                      )}
                      {notifications.some(n => n.read) && (
                        <button onClick={clearReadNotifications} style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                          Clear Read
                        </button>
                      )}
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>
                      No new notifications.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="header-notification-item"
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)',
                            borderLeft: n.read ? '3px solid transparent' : '3px solid var(--color-primary)',
                            fontSize: 'var(--text-xs)',
                            lineHeight: 1.4,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{n.title}</span>
                            {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>}
                          </div>
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

          {/* Font Cycler Button */}
          <button
            onClick={cycleFont}
            className="theme-toggle-btn"
            style={{ 
              margin: 0, 
              marginRight: '6px', 
              padding: '0', 
              fontSize: '14px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-body)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              textTransform: 'none',
              cursor: 'pointer'
            }}
            title={`Font: ${userFont} (Tap to cycle)`}
            aria-label="Cycle Font Style"
          >
            Aa
          </button>

          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
            title={mounted ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Switch Theme'}
            style={{ margin: 0 }}
          >
            {mounted ? (
              theme === 'dark' ? (
                <>
                  {/* Moon Icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span className="theme-toggle-text">Dark Mode</span>
                </>
              ) : (
                <>
                  {/* Sun Icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span className="theme-toggle-text">Light Mode</span>
                </>
              )
            ) : (
              <>
                {/* Fallback while mounting: Light Mode default */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span className="theme-toggle-text">Light Mode</span>
              </>
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
        {mounted && (
          <>
        <Link href="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`} onClick={closeMenu}>
          Home
        </Link>
        
        {/* Mobile Loans Dropdown (Accordion) */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4px 0' }}>
          <button
            onClick={() => setMobileLoansOpen(!mobileLoansOpen)}
            className="nav-link"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '12px 16px',
              color: 'var(--color-text-primary)'
            }}
          >
            <span>Loans</span>
            <svg width="12" height="8" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: mobileLoansOpen ? 'rotate(180deg)' : 'none' }}>
              <path d="M1 1l4 4 4-4" />
            </svg>
          </button>
          
          {mobileLoansOpen && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: 'none',
              padding: '4px 0'
            }}>
              <Link href={user ? "/banks?category=instant" : "/check?type=instant"} className="mobile-dropdown-item" onClick={closeMenu}>
                Instant Loan
              </Link>
              <Link href={user ? "/banks?category=salary" : "/check?type=salary"} className="mobile-dropdown-item" onClick={closeMenu}>
                Salary Loan
              </Link>
              <Link href={user ? "/banks?category=business" : "/check?type=business"} className="mobile-dropdown-item" onClick={closeMenu}>
                Business Loan
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Credit Cards */}
        <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`} onClick={closeMenu}>
          Credit Cards
        </Link>
        <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`} onClick={closeMenu}>
          Check Eligibility
        </Link>
        <Link href="/blog" className={`nav-link ${isLinkActive('/blog') ? 'active' : ''}`} onClick={closeMenu}>
          Blog
        </Link>
        <Link
          href="/cibil"
          className={`nav-link ${isLinkActive('/cibil') ? 'active' : ''}`}
          style={{ color: 'var(--color-primary)', fontWeight: 700 }}
          onClick={closeMenu}
        >
          Check CIBIL Score <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>(PNB Partnership)</span>
        </Link>
        {user ? (
          (userRole === 'agent' || userRole === 'user' || user.email === 'handtohandloans@gmail.com') && (
            <Link href="/banks" className={`nav-link ${isLinkActive('/banks') ? 'active' : ''}`} onClick={closeMenu}>
              Banks
            </Link>
          )
        ) : (
          <Link href="/#banks" className="nav-link" onClick={closeMenu}>
            Banks
          </Link>
        )}
        <Link href="/#emi-calculator" className="nav-link" onClick={closeMenu}>
          EMI Calculator
        </Link>
        <Link href="/verify-agreement" className={`nav-link ${isLinkActive('/verify-agreement') ? 'active' : ''}`} onClick={closeMenu}>
          Verify Agent Agreement
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
          </>
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
            <div style={{ fontSize: '48px', margin: '0 auto', color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</div>
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
                Not Applied
              </button>
              <button
                onClick={handleConfirmApplied}
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--gradient-primary)', border: 'none' }}
                disabled={submittingStatus}
              >
                {submittingStatus ? 'Saving Lead...' : 'Applied'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
