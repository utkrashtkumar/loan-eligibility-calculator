'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('utkrashtkumar@gmail.com'); // Pre-fill admin email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email === 'utkrashtkumar@gmail.com') {
        router.push('/admin');
      }
    }
    checkAdmin();
  }, [router]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (email.trim() !== 'utkrashtkumar@gmail.com') {
      setError('Invalid admin credentials.');
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
        if (user.email !== 'utkrashtkumar@gmail.com') {
          // Log out unauthorized user
          await supabase.auth.signOut();
          setError('Access Denied: You are not authorized to view the admin portal.');
        } else {
          setSuccess('Access Granted. Redirecting...');
          setTimeout(() => {
            router.push('/admin');
            router.refresh();
          }, 1000);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page">
          <div className="form-container" style={{ maxWidth: '480px' }}>
            <div className="form-card text-center" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
              <h2 className="form-step-title" style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Portal
              </h2>
              <p className="form-step-subtitle">Log in to view user eligibility inquiries</p>

              {error && <div className="input-error-text" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', margin: '16px 0' }}>⚠ {error}</div>}
              {success && <div style={{ color: 'var(--color-success)', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', margin: '16px 0' }}>✓ {success}</div>}

              <form onSubmit={handleAdminLogin} style={{ textAlign: 'left', marginTop: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Admin Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    readOnly
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Admin Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '16px', justifyContent: 'center', background: 'var(--gradient-primary)' }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Enter Admin Panel'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
