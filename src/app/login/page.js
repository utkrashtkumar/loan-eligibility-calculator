'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'pending'
      ? 'Your agent account is pending approval by the admin. Contact this number (8171261318) for approval of your agent id.'
      : ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');

  // If already logged in, redirect
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (redirectPath.startsWith('http')) {
          window.location.href = redirectPath;
        } else {
          router.push(redirectPath);
        }
      }
    }
    checkUser();
  }, [router, redirectPath]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        const user = data.user;
        
        // Fetch approval status and role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, approved, profile_update_message')
          .eq('id', user.id)
          .single();

        if (profileError) {
          // If profile table hasn't populated yet, sign out and throw error
          await supabase.auth.signOut();
          setError('Could not retrieve profile settings. Please try again.');
          setLoading(false);
          return;
        }

        if (profile.role === 'agent' && !profile.approved) {
          await supabase.auth.signOut();
          
          const isRejected = profile.profile_update_message && profile.profile_update_message.startsWith('REJECTED:');
          if (isRejected) {
            const reason = profile.profile_update_message.replace('REJECTED:', '').trim();
            setError(`Your agent registration request has been rejected by the admin. Reason: ${reason}`);
          } else {
            setError('Your agent account is pending approval by the admin. Contact this number (+91 8171261318) for approval of your agent id.');
          }
          
          setLoading(false);
          return;
        }

        setSuccess('Logged in successfully!');
        setTimeout(() => {
          if (redirectPath.startsWith('http')) {
            window.location.href = redirectPath;
          } else {
            router.push(redirectPath);
            router.refresh();
          }
        }, 1000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Password reset link sent! Check your email to create a new password.');
      }
    } catch (err) {
      setError('Failed to send password reset email. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address first to receive a magic link.');
      return;
    }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`
        }
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setSuccess('Magic Link sent! Please check your email inbox to log in.');
      }
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`
        }
      });
      if (googleError) {
        setError(googleError.message);
      }
    } catch (err) {
      setError('Failed to initiate Google sign in. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="form-card text-center" style={{ backdropFilter: 'blur(20px)' }}>
      <h2 className="form-step-title">Welcome Back</h2>
      <p className="form-step-subtitle">Log in to view your eligibility runs and check loans</p>

      {/* Agent Sign-up Warning Notice */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'left',
        margin: '20px 0 10px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '20px', color: '#f59e0b', lineHeight: '1' }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: 'var(--text-sm)' }}>For Agent Partners:</div>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            Please note that you must register via <strong>Manual Signup</strong> first. You can use the Google Login option to access your dashboard only after your registration has been approved by the admin.
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          margin: '16px 0',
          color: '#ef4444',
          fontSize: 'var(--text-sm)',
          textAlign: 'left',
          lineHeight: '1.5'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ marginTop: '2px' }}>⚠</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      {success && <div style={{ color: 'var(--color-success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', margin: '16px 0' }}>✓ {success}</div>}

      <form onSubmit={handleLogin} style={{ textAlign: 'left', marginTop: '24px' }}>
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
              placeholder="Enter your password"
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', margin: 0 }}
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
          <button
            type="button"
            onClick={handleMagicLinkLogin}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', margin: 0, border: 'var(--border-accent)', background: 'var(--color-bg-glass)' }}
            disabled={loading}
          >
            ✨ Magic Link
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        <span style={{ padding: '0 12px', fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn btn-secondary"
        style={{
          width: '100%',
          justifyContent: 'center',
          margin: 0,
          background: 'rgba(255, 255, 255, 0.03)',
          border: 'var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ marginTop: '24px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        Don&apos;t have an account?{' '}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectPath)}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page">
          <div className="form-container" style={{ maxWidth: '480px' }}>
            <Suspense fallback={
              <div className="form-card text-center" style={{ padding: '64px 32px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Login Form...</p>
              </div>
            }>
              <LoginContent />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
