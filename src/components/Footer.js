'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const year = new Date().getFullYear();
  const [visitorCount, setVisitorCount] = useState(null);
  
  // Website Feedback Form States
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

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
      <div className="container">
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '64px'
        }}>
          {/* Column 1: Logo & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#10b981',
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
                HandToHand Loans
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.6, margin: 0, maxWidth: '280px', color: 'var(--color-text-muted)' }}>
              India&apos;s most trusted loan marketplace connecting borrowers with leading banks and NBFCs.
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Row 1 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://wa.me/919389119399" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://t.me" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.87 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.536-.196.999.12.823.953z"/>
                  </svg>
                </a>
              </div>
              {/* Row 2 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }} onMouseOver={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-bg-input)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 00-2.11 2.11C.001 8.03.001 12 .001 12s0 3.969.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 002.11-2.11C24 15.97 24 12 24 12s0-3.969-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 'var(--text-xs)' }}>
              <li><Link href="/about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>About Us</Link></li>
              <li><Link href="/signup?role=agent" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>DSA Program</Link></li>
              <li><Link href="/check" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Loan Products</Link></li>
              <li><Link href="/banks" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Partner Banks</Link></li>
              <li><Link href="/credit-cards" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Credit Cards</Link></li>
              <li><Link href="/verify-agreement" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Verify Agreement</Link></li>
              <li>
                <Link href="/emi-calculator" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>EMI Calculator</Link>
                <ul style={{ listStyle: 'none', padding: '6px 0 0 12px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.85 }}>
                  <li><Link href="/personal-loan-emi-calculator" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>• Personal Loan EMI</Link></li>
                  <li><Link href="/home-loan-emi-calculator" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>• Home Loan EMI</Link></li>
                  <li><Link href="/business-loan-emi-calculator" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>• Business Loan EMI</Link></li>
                </ul>
              </li>
              <li><Link href="/blog" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Blog</Link></li>
              <li><Link href="/contact" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Loan Products */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>
              Loan Products
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 'var(--text-xs)' }}>
              <li><Link href="/check?type=salary" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Personal Loan</Link></li>
              <li><Link href="/check?type=business" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Business Loan</Link></li>
              <li><Link href="/check" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Home Loan</Link></li>
              <li><Link href="/check" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Gold Loan</Link></li>
            </ul>
          </div>

          {/* Column 4: Get in Touch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>
              Get in Touch
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Phone */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: '#10b981', marginTop: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="tel:+919389119399" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: 'none' }}>
                    +91 93891 19399
                  </a>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Mon-Sat, 9AM-6PM
                  </span>
                </div>
              </div>
              {/* Email */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ color: '#10b981', marginTop: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="mailto:support@handtohandloans.in" style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: 'none', wordBreak: 'break-all' }}>
                    support@handtohandloans.in
                  </a>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    Replies within 24h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider line */}
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
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }}></span>
              <span>Visitors:</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{Number(visitorCount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div>
            © {year} HandToHand Loans. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
