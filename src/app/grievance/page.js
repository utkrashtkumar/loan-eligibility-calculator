'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function GrievancePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !complaint) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const ticketRef = `H2H-GR-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Save it into the contact_messages database table since it's a customer query/complaint!
      // In supabase_rls_policies.sql, contact_messages has columns: name, email, phone, message (we can append ticketRef inside message)
      const fullMessage = `[GRIEVANCE TICKET: ${ticketRef}] [Orig Ticket Ref: ${ticketId || 'N/A'}] ${complaint}`;
      
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name,
            email,
            phone,
            message: fullMessage
          }
        ]);

      if (error) throw error;

      setGeneratedTicket(ticketRef);
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setTicketId('');
      setComplaint('');
    } catch (err) {
      console.error('Grievance submission error:', err);
      setErrorMsg('Failed to submit grievance. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '85vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="light-tag" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '6px 16px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '1px' }}>
              CUSTOMER CARE POLICIES
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, marginTop: '16px', color: 'var(--color-text-primary)', letterSpacing: '-1px' }}>
              Grievance Redressal Mechanism
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '750px', margin: '12px auto 0', lineHeight: 1.6 }}>
              At HandToHand Loans, customer satisfaction is our top priority. If you have any complaints, disputes, or grievances regarding our services or banking partners, please follow our structured escalation matrix below.
            </p>
          </div>

          {/* Three Escalation Levels Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '56px'
          }}>
            {/* Level 1 */}
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Level 1: Support Desk</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '12px 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>Customer Care</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Contact our support desk for immediate queries, status checks, or minor clarifications.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>📞 +91 93891 19399</span>
                <span>✉️ info@handtohandloans.com</span>
                <span>⏰ Response Time: Within 24-48 Hours</span>
              </div>
            </div>

            {/* Level 2 */}
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--color-warning)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Level 2: Officer</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '12px 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>Grievance Officer</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                If your issue is not resolved at Level 1 within 7 business days, escalate to our Grievance Redressal Officer.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>👤 Mr. Rajesh Kumar</span>
                <span>✉️ grievance@handtohandloans.com</span>
                <span>⏰ Response Time: Within 7 Business Days</span>
              </div>
            </div>

            {/* Level 3 */}
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--color-error)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Level 3: Principal Officer</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '12px 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>Principal Nodal Officer</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                If you remain unsatisfied with Level 2 redressal, escalate your ticket to our Principal Nodal Officer.
              </p>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span>👤 Mrs. Priya Sharma</span>
                <span>✉️ nodalofficer@handtohandloans.com</span>
                <span>⏰ Response Time: Within 15 Business Days</span>
              </div>
            </div>
          </div>

          {/* Form and Submission info */}
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-light)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '24px', fontFamily: 'Outfit, sans-serif' }}>
              ✍️ File a Grievance Ticket Online
            </h3>

            {success ? (
              <div style={{
                background: 'rgba(0, 215, 86, 0.04)',
                border: '1px solid #00d756',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Grievance Ticket Raised Successfully</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                  Your ticket reference is <strong>{generatedTicket}</strong>. We have logged your request. Our Grievance Redressal Officer will investigate your concern and reach out within 48-72 hours.
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>
                  File Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Full Name *</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address *</span>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {/* Phone */}
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Phone Number (Optional)</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    />
                  </div>

                  {/* Old Ticket ID */}
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Original Lead/Ticket ID (Optional)</span>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. H2H-APP-XXXXX"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                {/* Complaint Details */}
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Detailed Complaint *</span>
                  <textarea
                    className="input-field"
                    placeholder="Provide complete description of the issue or dispute"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                    required
                  />
                </div>

                {errorMsg && (
                  <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '12px 36px', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Grievance Ticket'}
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
