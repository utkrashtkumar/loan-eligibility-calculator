'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Security (F7): Client-side rate limiting — one submission per 60 seconds.
  // Prevents contact form from being abused for unlimited DB inserts / spam.
  const RATE_LIMIT_KEY = 'contact_last_submit';
  const RATE_LIMIT_MS = 60 * 1000; // 60 seconds

  const isRateLimited = () => {
    const last = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
    return Date.now() - last < RATE_LIMIT_MS;
  };

  const MAX_LENGTHS = { name: 100, email: 254, subject: 200, message: 2000 };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || !subject.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // Security (F7): Enforce rate limit before hitting the database.
    if (isRateLimited()) {
      const last = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
      const secsLeft = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
      setError(`Please wait ${secsLeft} second${secsLeft !== 1 ? 's' : ''} before sending another message.`);
      return;
    }

    // Security (F7): Enforce input length limits.
    if (name.trim().length > MAX_LENGTHS.name) { setError(`Name must be under ${MAX_LENGTHS.name} characters.`); return; }
    if (email.trim().length > MAX_LENGTHS.email) { setError(`Email must be under ${MAX_LENGTHS.email} characters.`); return; }
    if (subject.trim().length > MAX_LENGTHS.subject) { setError(`Subject must be under ${MAX_LENGTHS.subject} characters.`); return; }
    if (message.trim().length > MAX_LENGTHS.message) { setError(`Message must be under ${MAX_LENGTHS.message} characters.`); return; }

    setSubmitting(true);
    setError('');

    try {
      const fullMessage = `[Contact Page Query] Subject: ${subject.trim()}\n\n${message.trim()}`;
      const { error: insertErr } = await supabase
        .from('site_feedbacks')
        .insert([
          {
            name: name.trim(),
            email: email.trim(),
            message: fullMessage,
            rating: 5
          }
        ]);

      if (insertErr) throw insertErr;

      // Security (F7): Record timestamp after successful submit to enforce cooldown.
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error('Contact form submission failed:', err);
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="section bg-light" style={{ paddingTop: '120px', paddingBottom: '40px', background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}>
        <div className="container" style={{ maxWidth: '1200px', textAlign: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '6px 16px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'inline-block',
            marginBottom: '16px'
          }}>
            Contact Support
          </span>
          <h1 className="section-title" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: '1.2', margin: '0 0 16px 0' }}>
            Get in <span className="text-gradient">Touch with Us</span>
          </h1>
          <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto', fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Have a question about loan options, eligibility checks, or partnership portals? Send us a message and our support desk will respond shortly.
          </p>
        </div>
      </section>

      {/* Main Grid Content */}
      <section className="section" style={{ padding: '40px 0 80px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
            
            {/* Contact Details Card */}
            <div style={{ display: 'grid', gap: '20px' }}>
              
              <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '20px', padding: '30px', backdropFilter: 'blur(20px)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                  Support Information
                </h3>
                
                <div style={{ display: 'grid', gap: '24px' }}>
                  
                  {/* Phone */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0
                    }}>
                      📞
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</div>
                      <a href="tel:+919389119399" style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        +91 93891 19399
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0
                    }}>
                      ✉️
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Support</div>
                      <a href="mailto:support@handtohandloans.in" style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                        support@handtohandloans.in
                      </a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0
                    }}>
                      🕒
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Support Timings</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        Mon-Sat, 9:00 AM - 6:00 PM
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Note */}
              <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px dashed var(--border-default)', borderRadius: '16px', padding: '24px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                💡 <strong>Important Note:</strong> For credit score report issues, please keep your Experian request Reference Number ready when calling support.
              </div>

            </div>

            {/* Interactive Form Card */}
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '24px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}>
              
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', display: 'grid', gap: '16px', justifyItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontSize: '28px'
                  }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Message Transmitted!</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    Thank you for reaching out. A support ticket has been recorded, and an associate will contact you within 24 hours.
                  </p>
                  <button onClick={() => setSubmitted(false)} className="btn btn-secondary" style={{ marginTop: '10px' }}>
                    Send another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                  
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    Send a Message
                  </h3>
                  
                  {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-error)' }}>
                      {error}
                    </div>
                  )}

                  {/* Name input */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Your Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email input */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Your Email Address *</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Subject input */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Query Subject *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Loan Eligibility, Partner Portal access..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Message input */}
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '12px', fontWeight: 600 }}>Your Message *</label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Describe your request in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      style={{ resize: 'none', fontFamily: 'inherit' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ justifySelf: 'start', padding: '12px 32px', borderRadius: '8px', fontWeight: 700 }}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>

                </form>
              )}

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
