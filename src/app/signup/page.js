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
  const [role, setRole] = useState('user'); // 'user' or 'agent'
  const [referredBy, setReferredBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    if (!name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
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
          setSuccess('Agent account request submitted! It will require admin approval before you can log in.');
        } else {
          setSuccess('Account created successfully! Check your email or try logging in.');
        }
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
              👤 Customer
            </button>
            <button
              type="button"
              className={`btn ${role === 'agent' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'center', padding: '10px 8px', fontSize: 'var(--text-sm)' }}
              onClick={() => setRole('agent')}
            >
              💼 Agent
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
          <input
            type="password"
            className="input-field"
            placeholder="Create a password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
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
        <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`} style={{ color: 'var(--color-accent-violet)', fontWeight: 500 }}>
          Log In
        </Link>
      </div>
    </div>
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
