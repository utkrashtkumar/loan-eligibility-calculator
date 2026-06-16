'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const timer = setTimeout(() => {
      setTheme(savedTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    let nextTheme;
    if (theme === 'dark') {
      nextTheme = 'light';
    } else if (theme === 'light') {
      nextTheme = 'green-blue';
    } else {
      nextTheme = 'dark';
    }
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
          router.push('/login?error=pending');
          return;
        }
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
        {/* Logo */}
        <Link href="/" className="logo" onClick={closeMenu}>
          <span className="logo-text">Hand to Hand</span>
          <span className="logo-badge">Fintech</span>
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
            {user ? (
              <>
                <li>
                  <Link href="/dashboard" className={`nav-link ${isLinkActive('/dashboard') ? 'active' : ''}`} style={{ marginLeft: '12px' }}>
                    Dashboard
                  </Link>
                </li>
                {user.email === 'utkrashtkumar@gmail.com' && (
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
              <li>
                <Link href="/login" className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', marginLeft: '12px' }}>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right Header Actions (Theme Toggle & Hamburger) */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : theme === 'light' ? 'Switch to Green-Blue Mode' : 'Switch to Dark Mode'}
            style={{ margin: 0 }}
          >
            {theme === 'dark' ? (
              /* Moon Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : theme === 'light' ? (
              /* Sun Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Palette Icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.03458 19.176 5.09904 19.4357 5.02102 19.6705C4.8532 20.1754 4.88701 20.7259 5.12217 21.2066C5.45277 21.8824 6.27318 22 7.00008 22H12Z" />
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
                <circle cx="11.5" cy="7.5" r="1.5" fill="currentColor" />
                <circle cx="16.5" cy="9.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="14.5" r="1.5" fill="currentColor" />
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

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link href="/" className={`nav-link ${isLinkActive('/') ? 'active' : ''}`} onClick={closeMenu}>
          Home
        </Link>
        <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`} onClick={closeMenu}>
          Check Eligibility
        </Link>
        {user ? (
          <>
            <Link href="/dashboard" className={`nav-link ${isLinkActive('/dashboard') ? 'active' : ''}`} onClick={closeMenu}>
              Dashboard
            </Link>
            {user.email === 'utkrashtkumar@gmail.com' && (
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
    </header>
  );
}
