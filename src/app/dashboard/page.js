'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/dashboard');
          return;
        }

        setUser(session.user);

        // Fetch user's previous inquiries
        const { data, error } = await supabase
          .from('user_inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching inquiries:', error);
        } else {
          setInquiries(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetch();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out network request failed, proceeding to clear session locally:', err);
    }
    router.push('/');
    router.refresh();
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="dashboard-section" style={{ padding: '48px 24px', minHeight: '80vh' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {loading ? (
              <div className="text-center" style={{ padding: '80px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Dashboard...</p>
              </div>
            ) : (
              <>
                {/* Dashboard Header Banner */}
                <div className="dashboard-header-card" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-bg-card)',
                  border: 'var(--border-light)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '24px 32px',
                  marginBottom: '32px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 'var(--text-xl)',
                      color: '#fff'
                    }}>
                      {getInitials(user?.user_metadata?.full_name || user?.email)}
                    </div>
                    <div>
                      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>
                        Hello, {user?.user_metadata?.full_name || 'User'}
                      </h1>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Link href="/check" className="btn btn-primary">
                      + Check New Eligibility
                    </Link>
                    <button onClick={handleSignOut} className="btn btn-secondary">
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                  
                  {/* Inquiry History */}
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '20px' }}>
                      Your Loan Eligibility History
                    </h2>

                    {inquiries.length === 0 ? (
                      <div className="form-card text-center" style={{ padding: '64px 32px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>No Saved Inquiries</h3>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                          You haven&apos;t run any eligibility checks yet. Check your eligibility to see matched banks here.
                        </p>
                        <Link href="/check" className="btn btn-primary">
                          Run Your First Check
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        {inquiries.map((inq) => {
                          const dateStr = new Date(inq.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div key={inq.id} className="result-card" style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr',
                              gap: '16px',
                              background: 'var(--color-bg-card)',
                              border: 'var(--border-light)',
                              borderRadius: 'var(--border-radius-md)',
                              padding: '24px',
                              backdropFilter: 'blur(20px)',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: 'var(--border-subtle)', paddingBottom: '16px' }}>
                                <div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className="badge badge-primary" style={{ background: 'var(--gradient-primary)' }}>
                                      {inq.eligible_banks?.length || 0} Banks Match
                                    </span>
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                                      Checked on {dateStr}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                  Pincode: <strong>{inq.pincode}</strong>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', margin: '8px 0' }}>
                                <div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Monthly Salary</div>
                                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    ₹{Number(inq.salary).toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Running EMIs</div>
                                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    ₹{Number(inq.existing_emi).toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Credit Score</div>
                                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-success)' }}>
                                    {inq.credit_score}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>FOIR Ratio</div>
                                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {inq.salary > 0 ? ((inq.existing_emi / inq.salary) * 100).toFixed(1) : 0}%
                                  </div>
                                </div>
                              </div>

                              <div style={{ paddingTop: '12px', borderTop: 'var(--border-subtle)' }}>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Matched Banks</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {inq.eligible_banks && inq.eligible_banks.length > 0 ? (
                                    inq.eligible_banks.map((bank, bidx) => (
                                      <span key={bidx} className="badge badge-info" style={{
                                        background: 'var(--color-info-bg)',
                                        border: '1px solid rgba(59, 130, 246, 0.15)',
                                        color: 'var(--color-info)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        textTransform: 'none',
                                        fontSize: 'var(--text-xs)'
                                      }}>
                                        <BankLogo bankName={bank} size={16} />
                                        {bank}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>No banks matched your criteria.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
