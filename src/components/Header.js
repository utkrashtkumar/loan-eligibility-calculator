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
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          <span className="logo-text">LoanMatch</span>
          <span className="logo-badge">Pro</span>
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
              <Link href="/check" className={`nav-link ${isLinkActive('/check') ? 'active' : ''}`}>
                Check Eligibility
              </Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link href="/dashboard" className={`nav-link ${isLinkActive('/dashboard') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                </li>
                {user.email === 'utkrashtkumar@gmail.com' && (
                  <li>
                    <Link href="/admin" className={`nav-link ${isLinkActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                      Admin Panel
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={handleLogout} className="nav-link nav-logout">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/login" className="nav-link nav-cta">
                  Sign In
                </Link>
              </li>
            )}
            <li>
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                aria-label="Toggle Theme"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </li>
          </ul>
        </nav>

        {/* Hamburger Menu */}
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
              <Link href="/admin" className={`nav-link ${isLinkActive('/admin') ? 'active' : ''}`} onClick={closeMenu} style={{ color: 'var(--color-success)' }}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="nav-link nav-logout" style={{ width: '100%', textAlign: 'center' }}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="nav-link nav-cta" style={{ width: '100%', textAlign: 'center' }} onClick={closeMenu}>
            Sign In
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', borderTop: 'var(--border-subtle)', paddingTop: '16px' }}>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </span>
        </div>
      </div>
    </header>
  );
}
