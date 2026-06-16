'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'agent'
  const [referredBy, setReferredBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectPath);
      }
    }
    checkUser();
  }, [router, redirectPath]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!name.trim() || !mobile.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password entry.');
      setLoading(false);
      return;
    }

    // Check for duplicate email or mobile number in profiles table
    try {
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();

      if (existingEmail) {
        setError('An account with this email address is already registered.');
        setLoading(false);
        return;
      }

      const { data: existingPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', mobile.trim())
        .maybeSingle();

      if (existingPhone) {
        setError('An account with this mobile number is already registered.');
        setLoading(false);
        return;
      }
    } catch (checkErr) {
      console.warn('Profile check warning:', checkErr);
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            role: role,
            referred_by: role === 'agent' ? (referredBy.trim() || null) : null,
            phone: mobile.trim()
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        if (role === 'agent') {
          setShowAgentModal(true);
        } else {
          setSuccess('Account created successfully! Check your email or try logging in.');
          setTimeout(() => {
            router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          }, 3000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClick = () => {
    // Redirection happens immediately after click
    setTimeout(() => {
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }, 500);
  };

  return (
    <>
      <div className="form-card text-center" style={{ backdropFilter: 'blur(20px)' }}>
        <h2 className="form-step-title">Create Account</h2>
        <p className="form-step-subtitle">Sign up to check loan eligibility and save checks</p>

        {error && <div className="input-error-text" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', margin: '16px 0' }}>⚠ {error}</div>}
        {success && <div style={{ color: 'var(--color-success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', margin: '16px 0' }}>✓ {success}</div>}

        <form onSubmit={handleSignup} style={{ textAlign: 'left', marginTop: '24px' }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <input
              type="tel"
              className="input-field"
              placeholder="Enter your 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">I want to Register as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '10px 8px', fontSize: 'var(--text-sm)' }}
                onClick={() => setRole('user')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Customer
              </button>
              <button
                type="button"
                className={`btn ${role === 'agent' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '10px 8px', fontSize: 'var(--text-sm)' }}
                onClick={() => setRole('agent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Agent
              </button>
            </div>
          </div>

          {role === 'agent' && (
            <div className="input-group">
              <label className="input-label">Referral Agent Code (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. H2H-12345"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Create a password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '48px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingRight: '48px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '24px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Already have an account?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>

      {showAgentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="form-card text-center" style={{
            maxWidth: '440px',
            width: '100%',
            background: 'var(--color-bg-surface)',
            border: 'var(--border-accent)',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'var(--color-primary)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>

            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
              Approval Required
            </h3>
            
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              Your agent registration request has been submitted successfully! To activate your agent ID, you must require approval from the admin.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: 'var(--border-light)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Click on the number to contact admin
              </span>
              <a 
                href="tel:+918171261318" 
                onClick={handleModalClick}
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +91 8171261318
              </a>
            </div>

            <button
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Go to Login Page
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SignupPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page">
          <div className="form-container" style={{ maxWidth: '480px' }}>
            <Suspense fallback={
              <div className="form-card text-center" style={{ padding: '64px 32px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Signup Form...</p>
              </div>
            }>
              <SignupContent />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
