'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  
  // Search, filter, and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Selected inquiry for detail drawer/modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inquiries:', error.message);
      } else {
        setInquiries(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Authenticate admin
  useEffect(() => {
    async function authenticateAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'utkrashtkumar@gmail.com') {
        router.push('/admin/login');
      } else {
        fetchInquiries();
      }
    }

    authenticateAdmin();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Admin sign out network request failed, proceeding to clear session locally:', err);
    }
    router.push('/admin/login');
    router.refresh();
  };

  /* ---------- Analytics Calculations ---------- */
  const totalLeads = inquiries.length;
  
  const averageCibil = totalLeads > 0
    ? Math.round(inquiries.reduce((acc, curr) => acc + curr.credit_score, 0) / totalLeads)
    : 0;

  const plInquiries = inquiries.filter(inq => {
    // Determine if PL or BL based on matching banks or some other indicator
    // In our matching engine we save inquiry but wait, does user_inquiries store loan_type?
    // Let's check: user_inquiries schema has: name, mobile, current_address, permanent_address, pincode, salary, existing_emi, credit_score, eligible_banks.
    // Wait, does it store loan type? Ah, we can check if matched banks list contains "(BL)" or if the user ran a check.
    // If not, we can infer it or we can just show the inquiries.
    // Let's see: we can search the matched banks for "BL". If they contain "BL", it's likely a business loan check.
    // Alternatively, we can check if eligible_banks array has items ending in "(BL)".
    // Let's inspect the data. If none, we can show total inquiries.
    const isBl = inq.eligible_banks?.some(b => b.includes('(BL)'));
    return !isBl;
  });

  const blInquiriesCount = inquiries.length - plInquiries.length;

  /* ---------- Filtering and Sorting ---------- */
  const filteredInquiries = inquiries
    .filter((inq) => {
      const matchesSearch = 
        inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.mobile.includes(searchTerm) ||
        inq.pincode.includes(searchTerm);
      
      const isBl = inq.eligible_banks?.some(b => b.includes('(BL)'));
      const matchesLoanType = 
        loanTypeFilter === 'ALL' ||
        (loanTypeFilter === 'BL' && isBl) ||
        (loanTypeFilter === 'PL' && !isBl);

      return matchesSearch && matchesLoanType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'salary_desc') return b.salary - a.salary;
      if (sortBy === 'cibil_desc') return b.credit_score - a.credit_score;
      return 0;
    });

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="admin-section" style={{ padding: '48px 24px', minHeight: '90vh' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {loading ? (
              <div className="text-center" style={{ padding: '80px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Leads Database...</p>
              </div>
            ) : (
              <>
                {/* Admin Header Panel */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
                      Leads Dashboard
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      Manage user eligibility inquiries and tracking database
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={fetchInquiries} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
                      🔄 Refresh Data
                    </button>
                    <button onClick={handleSignOut} className="btn btn-secondary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      Log Out
                    </button>
                  </div>
                </div>

                {/* Analytics Metrics Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Inquiries</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-accent-indigo)', marginTop: '8px' }}>{totalLeads}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Credit Score</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>{averageCibil}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Loan Checks</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-info)', marginTop: '8px' }}>{plInquiries.length}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Loan Checks</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-warning)', marginTop: '8px' }}>{blInquiriesCount}</div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="form-card" style={{
                  padding: '16px 24px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  backdropFilter: 'blur(20px)'
                }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Search name, phone or pincode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ margin: 0 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Type:</span>
                      <select
                        value={loanTypeFilter}
                        onChange={(e) => setLoanTypeFilter(e.target.value)}
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: 'var(--border-light)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ALL">All Loans</option>
                        <option value="PL">Personal Loan</option>
                        <option value="BL">Business Loan</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Sort By:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                          background: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: 'var(--border-light)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="salary_desc">Salary (High to Low)</option>
                        <option value="cibil_desc">Credit Score (High to Low)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Leads Table */}
                <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: 'var(--border-light)' }}>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Name</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mobile</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Salary</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>CIBIL</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Pincode</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Current Address</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Permanent Address</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Matches</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInquiries.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                              No inquiries found matching criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredInquiries.map((inq) => {
                            const dateStr = new Date(inq.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                            
                            const isBl = inq.eligible_banks?.some(b => b.includes('(BL)'));

                            return (
                              <tr
                                key={inq.id}
                                onClick={() => setSelectedInquiry(inq)}
                                style={{
                                  borderBottom: 'var(--border-subtle)',
                                  cursor: 'pointer',
                                  transition: 'background var(--transition-fast)'
                                }}
                                className="table-row-hover"
                              >
                                <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {inq.name}
                                    <span className={isBl ? 'badge badge-warning' : 'badge badge-primary'} style={{
                                      fontSize: '9px',
                                      padding: '2px 6px'
                                    }}>
                                      {isBl ? 'BL' : 'PL'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{inq.mobile}</td>
                                <td style={{ padding: '16px 24px' }}>₹{Number(inq.salary).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-success)' }}>{inq.credit_score}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{inq.pincode}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inq.current_address}>
                                  {inq.current_address || 'N/A'}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inq.permanent_address}>
                                  {inq.permanent_address || 'N/A'}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                  <span className="badge badge-info" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                                    {inq.eligible_banks?.length || 0} Banks
                                  </span>
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>{dateStr}</td>
                                <td style={{ padding: '16px 24px' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--border-subtle)', margin: 0 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInquiry(inq);
                                    }}
                                  >
                                    Details 👁️
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Detail Drawer Modal (Overlay) */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setSelectedInquiry(null)}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            height: '100%',
            background: 'var(--color-bg-secondary)',
            borderLeft: 'var(--border-light)',
            boxShadow: 'var(--shadow-xl)',
            padding: '32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>Inquiry Details</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>ID: #{selectedInquiry.id} | Submitted {new Date(selectedInquiry.created_at).toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: 'var(--color-bg-input)',
                  border: 'var(--border-light)',
                  color: 'var(--color-text-primary)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Info Card */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Customer Profile</h4>
              <div className="form-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Full Name</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedInquiry.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Mobile Number</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedInquiry.mobile}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Pincode</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedInquiry.pincode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Credit Score (CIBIL)</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-success)' }}>{selectedInquiry.credit_score}</div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Financial details</h4>
              <div className="form-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Monthly Salary</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>₹{Number(selectedInquiry.salary).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Running EMIs</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>₹{Number(selectedInquiry.existing_emi).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Calculated FOIR (EMI / Salary)</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {selectedInquiry.salary > 0 ? ((selectedInquiry.existing_emi / selectedInquiry.salary) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Addresses</h4>
              <div className="form-card" style={{ display: 'grid', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>{selectedInquiry.current_address}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Permanent Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>{selectedInquiry.permanent_address}</div>
                </div>
              </div>
            </div>

            {/* Matched Banks */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Matched Lenders</h4>
              <div className="form-card" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedInquiry.eligible_banks && selectedInquiry.eligible_banks.length > 0 ? (
                    selectedInquiry.eligible_banks.map((bank, idx) => (
                      <span key={idx} className="badge badge-info" style={{
                        background: 'var(--color-info-bg)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        color: 'var(--color-info)',
                        padding: '6px 12px',
                        fontSize: 'var(--text-xs)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textTransform: 'none'
                      }}>
                        <BankLogo bankName={bank} size={16} />
                        {bank}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>No matching lenders for this inquiry.</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
