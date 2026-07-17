'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const year = new Date().getFullYear();
  const [visitorCount, setVisitorCount] = useState(null);
  const [goldRate, setGoldRate] = useState(null);
  const [goldChange, setGoldChange] = useState('+0.21%');
  const [silverRate, setSilverRate] = useState(null);
  const [silverChange, setSilverChange] = useState('+0.15%');
  
  // Website Feedback Form States
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Fetch live rates on mount for Footer cards
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const [xauRes, xagRes] = await Promise.all([
          fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json'),
          fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xag.json')
        ]);
        const xauData = await xauRes.json();
        const xagData = await xagRes.json();
        const inrGoldPerOz = xauData?.xau?.inr;
        const inrSilverPerOz = xagData?.xag?.inr;
        
        if (inrGoldPerOz) {
          const goldPrice = Math.round(inrGoldPerOz / 31.1035);
          setGoldRate(goldPrice);
          const goldPct = ((goldPrice - 12450) / 12450) * 100;
          setGoldChange((goldPct >= 0 ? '+' : '') + goldPct.toFixed(2) + '%');
        }
        if (inrSilverPerOz) {
          const silverPrice = Math.round(inrSilverPerOz / 31.1035);
          setSilverRate(silverPrice);
          const silverPct = ((silverPrice - 175.8) / 175.8) * 100;
          setSilverChange((silverPct >= 0 ? '+' : '') + silverPct.toFixed(2) + '%');
        }
      } catch (err) {
        console.warn('Footer rates fetch failed, using fallbacks:', err);
      }
    };
    fetchRates();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setFeedbackError('Please enter your feedback message.');
      return;
    }
    setSubmitting(true);
    setFeedbackError('');

    try {
      const { error: insertErr } = await supabase
        .from('site_feedbacks')
        .insert([
          {
            rating,
            name: name.trim() || null,
            email: email.trim() || null,
            message: message.trim()
          }
        ]);

      if (insertErr) {
        throw insertErr;
      }

      setSubmitted(true);
      setMessage('');
      setName('');
      setEmail('');
      setRating(5);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setFeedbackError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const trackVisitor = async () => {
      let fetchedCount = null;
      try {
        const alreadyCounted = sessionStorage.getItem('h2h_visitor_counted');
        if (!alreadyCounted) {
          const { data, error } = await supabase.rpc('increment_visitor_count');
          if (!error && data) {
            fetchedCount = data;
            try {
              sessionStorage.setItem('h2h_visitor_counted', '1');
            } catch (e) {
              console.warn('Could not set sessionStorage item:', e);
            }
          } else {
            if (error) console.error('Supabase increment_visitor_count RPC error:', error);
            const { data: stats, error: selError } = await supabase.from('site_stats').select('visitor_count').eq('id', 'main').single();
            if (!selError && stats) {
              fetchedCount = stats.visitor_count;
            } else if (selError) {
              console.error('Supabase site_stats fallback error:', selError);
            }
          }
        } else {
          const { data: stats, error: selError } = await supabase.from('site_stats').select('visitor_count').eq('id', 'main').single();
          if (!selError && stats) {
            fetchedCount = stats.visitor_count;
          } else if (selError) {
            console.error('Supabase site_stats read error:', selError);
          }
        }
      } catch (err) {
        console.error('General visitor counter exception:', err);
      } finally {
        // Fallback value 215 if everything fails to ensure visibility (e.g. blocked by adblockers/privacy shields)
        setVisitorCount(fetchedCount || 215);
      }
    };
    trackVisitor();
  }, []);

  return (
    <footer style={{
      background: 'var(--color-bg-glass-heavy)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-default)',
      padding: '80px 0 40px 0',
      color: 'var(--color-text-secondary)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      zIndex: 10
    }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Website Feedback Form */}
        <div style={{
          background: 'var(--color-bg-glass)',
          border: 'var(--border-light)',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)'
        }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💬</span> Website Feedback
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
              Help us improve HandToHand Loans! Tell us about your experience on our website or share suggestions.
            </p>
          </div>
          
          {submitted ? (
            <div style={{ textAlign: 'center', color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 auto'
              }}>
                ✓
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Thank you for your feedback!</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>Your suggestions have been successfully recorded.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Rating (Stars) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Rating:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px',
                        lineHeight: 1,
                        padding: '2px',
                        color: star <= (hoverRating || rating) ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                        transition: 'transform 0.1s ease, color 0.1s ease',
                        transform: star <= (hoverRating || rating) ? 'scale(1.2)' : 'none'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ fontSize: 'var(--text-xs)', padding: '10px 14px' }}
                />
                <input
                  type="email"
                  placeholder="Your Email (Optional)"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontSize: 'var(--text-xs)', padding: '10px 14px' }}
                />
              </div>

              {/* Message */}
              <div style={{ position: 'relative' }}>
                <textarea
                  placeholder="What can we improve? (e.g. layout, speed, features...)"
                  className="input-field"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: 'none', fontSize: 'var(--text-xs)', padding: '10px 14px', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {feedbackError && <div style={{ color: 'var(--color-error)', fontSize: '11px' }}>{feedbackError}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-sm" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Main Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '32px',
          marginBottom: '64px'
        }}>
          {/* Column 1: Logo, Description & Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: 'Outfit, sans-serif'
              }}>
                H
              </div>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                H2H Loan
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, margin: 0, maxWidth: '340px', color: 'var(--color-text-muted)' }}>
              With the highest loan approval rate in the industry, H2H Loan offers a solution to each of your financial nuance at your fingertip.
            </p>
            
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { name: 'X', href: 'https://x.com/HandToHandLoans', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { name: 'LinkedIn', href: 'https://linkedin.com/company/handtohandloansofficial', path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
                { name: 'Facebook', href: 'https://www.facebook.com/handtohanloans', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                { name: 'Instagram', href: 'https://www.instagram.com/handtohandloans', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { name: 'YouTube', href: 'https://www.youtube.com/@HANDTOHANDLOANS', path: 'M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 00-2.11 2.11C.001 8.03.001 12 .001 12s0 3.969.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 002.11-2.11C24 15.97 24 12 24 12s0-3.969-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                { name: 'Telegram', href: 'https://t.me/handtohandloans', path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' }
              ].map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-glass)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-glass)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>

            {/* Verification Badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                color: 'var(--color-text-primary)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>100% SECURED</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                color: 'var(--color-text-primary)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 11 11 13 15 9"/>
                </svg>
                <span>TRUSTED BY MILLIONS</span>
              </div>
            </div>
          </div>

          {/* Column 2: Loan Types */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Loan Types
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)' }}>
              {[
                { name: 'Personal Loan', href: '/banks/salary' },
                { name: 'Instant Loan', href: '/banks/instant' },
                { name: 'Business Loan', href: '/banks/business' },
                { name: 'Two-Wheeler Loan', href: '/loans/two-wheeler' },
                { name: 'Car Loan', href: '/loans/car' },
                { name: 'Marriage Loan', href: '/loans/marriage' },
                { name: 'Travel Loan', href: '/loans/travel' },
                { name: 'Medical Loan', href: '/loans/medical' },
                { name: 'Education Loan', href: '/loans/education' },
                { name: 'Home Loan', href: '/loans/home' },
                { name: 'Gold Loan', href: '/loans/gold' },
                { name: 'Commodities', href: '/commodities' }
              ].map(link => (
                <li key={link.name}>
                  <Link href={link.href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Resources
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)' }}>
              {[
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms & Conditions', href: '/terms' },
                { name: 'H2H Credit Score', href: '/cibil' },
                { name: 'H2H Calculators', href: '/calculators' },
                { name: 'Quick Loans', href: '/banks/instant' },
                { name: 'H2H Games', href: '/games' },
                { name: 'H2H Credit Cards', href: '/credit-cards' },
                { name: 'Gold Rate Today', href: '/commodities/gold' },
                { name: 'Silver Rate Today', href: '/commodities/silver' },
                { name: 'Our Business Partners', href: '/banks' },
                { name: 'Statutory Disclosure', href: '/privacy#statutory' },
                { name: 'Grievance Redressal', href: '/grievance' }
              ].map(link => (
                <li key={link.name}>
                  <Link href={link.href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)' }}>
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Contact Us', href: '/contact' },
                { name: 'Features', href: '/features' },
                { name: 'H2H Loan App', href: '/loan-app' },
                { name: 'Testimonials', href: '/testimonials' },
                { name: 'Blog', href: '/blog' },
                { name: 'Sitemap', href: '/sitemap.xml' },
                { name: 'Press Release', href: '/press' },
                { name: 'Newsroom', href: '/press' },
                { name: 'Customer Care', href: '/contact' },
                { name: 'FAQ', href: '/faq' }
              ].map(link => (
                <li key={link.name}>
                  <Link href={link.href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Reach Us & Graphic Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', gridColumn: 'span 2' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              Address
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Reach Us</span>
              <a href="mailto:info@handtohandloans.com" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                info@handtohandloans.com
              </a>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              gap: '10px', 
              marginTop: '10px',
              width: '100%'
            }}>
              {/* Clickable Card 1: Credit Score Gauge */}
              <Link href="/cibil" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                flex: '1 1 180px',
                minWidth: '180px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '';
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--color-primary)' }}>FREE CREDIT SCORE</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-primary)' }}>CHECK NOW</span>
                </div>
                <svg width="40" height="28" viewBox="0 0 60 40">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#00d756" />
                    </linearGradient>
                  </defs>
                  <path d="M 10 35 A 20 20 0 0 1 50 35" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />
                  <path d="M 10 35 A 20 20 0 0 1 50 35" fill="none" stroke="url(#gaugeGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="63" strokeDashoffset="15" />
                  <line x1="30" y1="35" x2="42" y2="23" stroke="var(--color-text-primary)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="30" cy="35" r="3.5" fill="var(--color-text-primary)" />
                </svg>
              </Link>

              {/* Clickable Card 2: Gold Rate Coins */}
              <Link href="/commodities/gold" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                flex: '1 1 180px',
                minWidth: '180px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--color-warning)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '';
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-primary)' }}>GOLD RATE</span>
                  <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ₹{goldRate ? goldRate.toLocaleString('en-IN') : '12,485'}/g
                    <span style={{ color: goldChange.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                      {goldChange}
                    </span>
                  </span>
                </div>
                <svg width="36" height="28" viewBox="0 0 50 40" fill="none">
                  <ellipse cx="16" cy="32" rx="9" ry="3.5" fill="#d97706" opacity="0.6"/>
                  <ellipse cx="16" cy="27" rx="9" ry="3.5" fill="#f59e0b" opacity="0.8"/>
                  <ellipse cx="16" cy="22" rx="9" ry="3.5" fill="#fbbf24"/>
                  <path d="M7 22v10c0 2 4 3.5 9 3.5s9-1.5 9-3.5V22" stroke="#b45309" strokeWidth="1"/>
                  <ellipse cx="32" cy="34" rx="9" ry="3.5" fill="#d97706" opacity="0.6"/>
                  <ellipse cx="32" cy="29" rx="9" ry="3.5" fill="#f59e0b" opacity="0.7"/>
                  <ellipse cx="32" cy="24" rx="9" ry="3.5" fill="#fbbf24" opacity="0.85"/>
                  <ellipse cx="32" cy="19" rx="9" ry="3.5" fill="#fbbf24"/>
                  <path d="M23 19v15c0 2 4 3.5 9 3.5s9-1.5 9-3.5V19" stroke="#b45309" strokeWidth="1"/>
                </svg>
              </Link>

              {/* Clickable Card 3: Silver Rate Coins */}
              <Link href="/commodities/silver" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                flex: '1 1 180px',
                minWidth: '180px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '';
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-primary)' }}>SILVER RATE</span>
                  <span style={{ fontSize: '8px', fontWeight: 800, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ₹{silverRate ? silverRate.toLocaleString('en-IN') : '176'}/g
                    <span style={{ color: silverChange.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                      {silverChange}
                    </span>
                  </span>
                </div>
                <svg width="36" height="28" viewBox="0 0 50 40" fill="none">
                  <ellipse cx="16" cy="32" rx="9" ry="3.5" fill="#4b5563" opacity="0.6"/>
                  <ellipse cx="16" cy="27" rx="9" ry="3.5" fill="#9ca3af" opacity="0.8"/>
                  <ellipse cx="16" cy="22" rx="9" ry="3.5" fill="#d1d5db"/>
                  <path d="M7 22v10c0 2 4 3.5 9 3.5s9-1.5 9-3.5V22" stroke="#4b5563" strokeWidth="1"/>
                  <ellipse cx="32" cy="34" rx="9" ry="3.5" fill="#4b5563" opacity="0.6"/>
                  <ellipse cx="32" cy="29" rx="9" ry="3.5" fill="#9ca3af" opacity="0.7"/>
                  <ellipse cx="32" cy="24" rx="9" ry="3.5" fill="#d1d5db" opacity="0.85"/>
                  <ellipse cx="32" cy="19" rx="9" ry="3.5" fill="#d1d5db"/>
                  <path d="M23 19v15c0 2 4 3.5 9 3.5s9-1.5 9-3.5V19" stroke="#4b5563" strokeWidth="1"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Banner (Money Bag & Specs) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 215, 86, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(0, 215, 86, 0.15)',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '40px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', textAlign: 'left' }}>
            {/* SVG Money Bag and Stack of Cash */}
            <svg width="80" height="60" viewBox="0 0 100 80" fill="none" style={{ marginRight: '8px' }}>
              {/* Gold coins scattered around base */}
              <ellipse cx="25" cy="72" rx="6" ry="2" fill="#d97706" />
              <ellipse cx="65" cy="70" rx="6" ry="2" fill="#d97706" />
              <ellipse cx="45" cy="73" rx="7" ry="2" fill="#f59e0b" />

              {/* Stack of Bills */}
              <g transform="translate(5, 34) rotate(-8)">
                <rect x="0" y="8" width="45" height="24" rx="3" fill="#064e3b" stroke="#00d756" strokeWidth="1.2" />
                <rect x="0" y="4" width="45" height="24" rx="3" fill="#065f46" stroke="#00d756" strokeWidth="1.2" />
                <rect x="0" y="0" width="45" height="24" rx="3" fill="#047857" stroke="#00d756" strokeWidth="1.2" />
                <circle cx="22.5" cy="12" r="4" fill="none" stroke="#a7f3d0" strokeWidth="1.2" />
                <line x1="8" y1="12" x2="37" y2="12" stroke="#a7f3d0" strokeWidth="0.8" />
              </g>

              {/* Money Bag */}
              <g transform="translate(38, 5)">
                <path d="M10 20c0-5 5-10 15-10s15 5 15 10c0 2-1 5-3 7l5 18c2 7-3 11-17 11S3 52 5 45l5-18c-2-2-3-5-3-7z" fill="url(#bagGrad)" stroke="#00d756" strokeWidth="1.8" />
                <path d="M12 22.5c4 2 14 2 18 0" stroke="#00d756" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 23l-2 5M23 23l2 5" stroke="#00d756" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 32h7M19 36h7M21.5 32c2 0 2 3 0 3M19 40l3.5-3.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              
              <defs>
                <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f1422" />
                  <stop offset="100%" stopColor="#00d756" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Get Instant Loan Online Up to <span style={{ color: 'var(--color-primary)' }}>₹50 Lakhs</span>
              </h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> 100% Digital
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> Fast Approval
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> Flexible
                </div>
              </div>
            </div>
          </div>
          <Link href="/check" className="btn btn-primary" style={{ padding: '12px 32px', background: 'var(--gradient-primary)', border: 'none', color: '#ffffff', fontWeight: 700, borderRadius: '8px' }}>
            Apply Now
          </Link>
        </div>

        {/* Divider line & Copyright section */}
        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: 'var(--text-xs)' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Terms of Service</Link>
          </div>
          {visitorCount !== null && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'var(--color-bg-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: '20px',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              margin: '4px 0'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                boxShadow: '0 0 8px var(--color-primary)',
                display: 'inline-block'
              }}></span>
              <span>Visitors:</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{Number(visitorCount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div>
            © {year} H2H Loan. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );

}
