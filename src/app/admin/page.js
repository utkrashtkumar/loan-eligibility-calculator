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
  const [activeTab, setActiveTab] = useState('notifications');

  // Leads state
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Agent profiles state
  const [activeAgents, setActiveAgents] = useState([]);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [demotedUsers, setDemotedUsers] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentActionLoading, setAgentActionLoading] = useState(null);

  // Client applications state
  const [applications, setApplications] = useState([]);
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Payout requests state
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [updatingPayoutId, setUpdatingPayoutId] = useState(null);
  const [profileMsgText, setProfileMsgText] = useState('');

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setProfileMsgText(agent?.profile_update_message || '');
  };

  const fetchInquiries = async () => {
    try {
      // Fetch user inquiries and join profiles to identify role (agent vs customer)
      const { data, error } = await supabase
        .from('user_inquiries')
        .select('*, agent:profiles(full_name, email, agent_code, role)')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching inquiries:', error.message);
      else setInquiries(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgentsData = async () => {
    try {
      // 1. Fetch Active Approved Agents
      const { data: activeA, error: activeAErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (activeAErr) console.error('Error fetching active agents:', activeAErr.message);
      else setActiveAgents(activeA || []);

      // 2. Fetch Pending Unapproved Agents
      const { data: pendingA, error: pendingAErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (pendingAErr) console.error('Error fetching pending agents:', pendingAErr.message);
      else setPendingAgents(pendingA || []);

      // 3. Fetch Demoted Users
      const { data: demotedU, error: demotedUErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .not('demoted_at', 'is', null)
        .order('demoted_at', { ascending: false });

      if (demotedUErr) console.error('Error fetching demoted users:', demotedUErr.message);
      else setDemotedUsers(demotedU || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, agent:profiles(full_name, email, agent_code)')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching applications:', error.message);
      else setApplications(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*, agent:profiles(full_name, email, agent_code)')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching payout requests:', error.message);
      else setPayoutRequests(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInquiries(),
      fetchAgentsData(),
      fetchApplications(),
      fetchPayoutRequests()
    ]);
    setLoading(false);
  };

  // Authenticate admin
  useEffect(() => {
    async function authenticateAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'utkrashtkumar@gmail.com') {
        router.push('/admin/login');
      } else {
        await fetchAllData();
      }
    }

    authenticateAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleApproveAgent = async (agentId) => {
    setAgentActionLoading(agentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true, demoted_at: null })
        .eq('id', agentId);

      if (error) {
        alert('Approval failed: ' + error.message);
      } else {
        await fetchAgentsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleDemoteAgent = async (agentId) => {
    if (!confirm('Are you sure you want to demote this agent to a normal user?')) return;
    setAgentActionLoading(agentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'user',
          demoted_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (error) {
        alert('Demotion failed: ' + error.message);
      } else {
        handleSelectAgent(null);
        await fetchAgentsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRepromoteAgent = async (userId) => {
    setAgentActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'agent',
          demoted_at: null
        })
        .eq('id', userId);

      if (error) {
        alert('Re-promotion failed: ' + error.message);
      } else {
        await fetchAgentsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleToggleProfileLock = async (agent) => {
    const newLockStatus = !agent.profile_locked;
    setAgentActionLoading(agent.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_locked: newLockStatus })
        .eq('id', agent.id);

      if (error) {
        alert('Failed to update profile lock status: ' + error.message);
      } else {
        alert(`Agent profile successfully ${newLockStatus ? 'locked' : 'unlocked'}!`);
        await fetchAgentsData();
        setSelectedAgent(prev => prev ? { ...prev, profile_locked: newLockStatus } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRequestProfileUpdate = async (agent, message = '') => {
    setAgentActionLoading(agent.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_update_requested: true,
          profile_update_message: message || null
        })
        .eq('id', agent.id);

      if (error) {
        alert('Failed to send profile update request: ' + error.message);
      } else {
        alert(`📢 Profile update request sent to ${agent.full_name}! They will see a popup reminder every 5 minutes until their profile is 100% complete.`);
        await fetchAgentsData();
        setSelectedAgent(prev => prev ? { 
          ...prev, 
          profile_update_requested: true,
          profile_update_message: message || null
        } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleCancelProfileUpdateRequest = async (agent) => {
    setAgentActionLoading(agent.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_update_requested: false,
          profile_update_message: null
        })
        .eq('id', agent.id);

      if (error) {
        alert('Failed to cancel profile update request: ' + error.message);
      } else {
        alert(`✅ Profile update request cancelled for ${agent.full_name}.`);
        await fetchAgentsData();
        setSelectedAgent(prev => prev ? { 
          ...prev, 
          profile_update_requested: false,
          profile_update_message: null
        } : null);
        setProfileMsgText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };


  const handleUpdateStatus = async (appId, newStatus) => {
    setUpdatingAppId(appId);
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'Disbursed') {
        updateData.disbursed_at = new Date().toISOString();
      } else {
        updateData.disbursed_at = null;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', appId);

      if (error) {
        alert('Update status failed: ' + error.message);
      } else {
        await Promise.all([fetchApplications(), fetchPayoutRequests()]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleApprovePayout = async (payoutId) => {
    if (!confirm('Mark this payout request as paid?')) return;
    setUpdatingPayoutId(payoutId);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({
          status: 'Paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', payoutId);

      if (error) {
        alert('Payout update failed: ' + error.message);
      } else {
        await fetchPayoutRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  /* ---------- Calculations & Helpers ---------- */
  const totalLeads = inquiries.length;
  const averageCibil = totalLeads > 0
    ? Math.round(inquiries.reduce((acc, curr) => acc + curr.credit_score, 0) / totalLeads)
    : 0;

  // Split inquiries into Customer vs Agent submissions
  const customerInquiries = inquiries.filter(inq => !inq.agent || inq.agent.role === 'user');
  const agentInquiries = inquiries.filter(inq => inq.agent && inq.agent.role === 'agent');

  // Filter helper
  const getFilteredInquiries = (list) => {
    return list
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
  };

  const filteredCustomerInquiries = getFilteredInquiries(customerInquiries);
  const filteredAgentInquiries = getFilteredInquiries(agentInquiries);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Applied':
      case 'Pending':
        return { color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', border: 'var(--border-light)' };
      case 'In Progress':
        return { color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: 'var(--border-warning)' };
      case 'Approved':
        return { color: 'var(--color-info)', background: 'var(--color-info-bg)', border: 'var(--border-accent)' };
      case 'Disbursed':
      case 'Paid':
        return { color: 'var(--color-success)', background: 'var(--color-success-bg)', border: 'var(--border-success)', boxShadow: 'var(--shadow-glow-success)' };
      case 'Rejected':
        return { color: 'var(--color-error)', background: 'var(--color-error-bg)', border: 'var(--border-error)' };
      default:
        return {};
    }
  };

  const isWithin30Days = (demotedAtStr) => {
    if (!demotedAtStr) return false;
    const demotedTime = new Date(demotedAtStr).getTime();
    const nowTime = new Date().getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return (nowTime - demotedTime) < thirtyDaysInMs;
  };

  // Agent details filters
  const selectedAgentApps = selectedAgent ? applications.filter(app => app.agent_id === selectedAgent.id) : [];
  const selectedAgentPayouts = selectedAgent ? payoutRequests.filter(req => req.agent_id === selectedAgent.id) : [];
  
  // Calculate selected agent earnings
  const selectedAgentDisbursedApps = selectedAgentApps.filter(app => app.status === 'Disbursed');
  const selectedAgentDirectComm = selectedAgentDisbursedApps.reduce((acc, app) => acc + Number(app.commission_amount), 0);
  
  // Find sub-agents of selected agent to fetch referral commissions
  const selectedAgentSubAgents = selectedAgent ? activeAgents.filter(sa => sa.referred_by === selectedAgent.agent_code) : [];
  const selectedAgentSubAgentIds = selectedAgentSubAgents.map(sa => sa.id);
  const selectedAgentReferralApps = applications.filter(app => selectedAgentSubAgentIds.includes(app.agent_id) && app.status === 'Disbursed');
  const selectedAgentReferralBonus = selectedAgentReferralApps.reduce((acc, app) => acc + (Number(app.loan_amount) * 0.005), 0);
  const selectedAgentTotalEarnings = selectedAgentDirectComm + selectedAgentReferralBonus;

  const getDemotedOutstandingBalances = () => {
    return demotedUsers.map(du => {
      const duApps = applications.filter(app => app.agent_id === du.id);
      const duDisbursed = duApps.filter(app => app.status === 'Disbursed');
      const directComm = duDisbursed.reduce((acc, app) => acc + Number(app.commission_amount), 0);
      
      const saIds = activeAgents.filter(sa => sa.referred_by === du.agent_code).map(sa => sa.id);
      const referralApps = applications.filter(app => saIds.includes(app.agent_id) && app.status === 'Disbursed');
      const referralBonus = referralApps.reduce((acc, app) => acc + (Number(app.loan_amount) * 0.005), 0);
      
      const totalEarnings = directComm + referralBonus;
      const totalPaid = payoutRequests.filter(req => req.agent_id === du.id && req.status === 'Paid').reduce((acc, req) => acc + Number(req.amount), 0);
      const outstandingBalance = totalEarnings - totalPaid;
      
      const userPayouts = payoutRequests.filter(req => req.agent_id === du.id);
      const latestPayout = userPayouts.length > 0 ? userPayouts[0] : null;

      return {
        du,
        outstandingBalance,
        latestPayout
      };
    }).filter(item => item.outstandingBalance > 0);
  };

  const demotedBalances = getDemotedOutstandingBalances();
  const totalNotifications = pendingAgents.length + 
                             payoutRequests.filter(r => r.status === 'Pending').length + 
                             applications.filter(a => a.status === 'Applied').length + 
                             demotedBalances.length;

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="admin-section" style={{ padding: '48px 24px', minHeight: '90vh' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {loading ? (
              <div className="text-center" style={{ padding: '80px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Administration Portal...</p>
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
                      Control Room Panel
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      Manage eligibility leads, verify agents, transition submitted disbursements, and approve payment requests.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={fetchAllData} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
                      🔄 Refresh All
                    </button>
                    <button onClick={handleSignOut} className="btn btn-secondary" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)', border: 'var(--border-error)' }}>
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
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Approved Agents</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-accent-purple)', marginTop: '8px' }}>{activeAgents.length}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approvals</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-warning)', marginTop: '8px' }}>{pendingAgents.length}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Payouts</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>
                      ₹{payoutRequests.filter(req => req.status === 'Pending').reduce((acc, req) => acc + Number(req.amount), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="tabs-container">
                  {/* Tabs bar */}
                  <div className="tabs-sidebar" style={{ marginBottom: '24px' }}>
                    {[
                      { id: 'notifications', label: `🔔 Notifications (${totalNotifications})` },
                      { id: 'customer_leads', label: `👤 Customer Inquiries (${customerInquiries.length})` },
                      { id: 'agent_leads', label: `💼 Agent Inquiries (${agentInquiries.length})` },
                      { id: 'active_agents', label: `👥 Active Agents (${activeAgents.length})` },
                      { id: 'pending_agents', label: `⏳ Approval & Re-promotion (${pendingAgents.length + demotedUsers.length})` },
                      { id: 'payouts', label: `💸 Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                      { id: 'applications', label: `📝 Client Applications (${applications.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} tabs-sidebar-button`}
                        style={{
                          padding: '10px 20px',
                          fontSize: 'var(--text-sm)',
                          whiteSpace: 'nowrap',
                          background: activeTab === tab.id ? 'var(--gradient-primary)' : 'var(--color-bg-glass)',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB CONTENT PANELS */}
                  <div className="tabs-content">
 
                 {/* PANEL 0: NOTIFICATIONS */}
                 {activeTab === 'notifications' && (
                   <div style={{ display: 'grid', gap: '32px' }}>
                     
                     {/* SECTION 1: Unapproved agent registrations */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         ⏳ Pending Agent Registrations
                         <span className="badge badge-warning" style={{ fontSize: '10px' }}>{pendingAgents.length}</span>
                       </h3>
                       {pendingAgents.length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No pending agent registrations.</p>
                         </div>
                       ) : (
                         <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                           <div style={{ overflowX: 'auto' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                               <thead>
                                 <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                   <th style={{ padding: '16px 24px' }}>Agent Name</th>
                                   <th style={{ padding: '16px 24px' }}>Email</th>
                                   <th style={{ padding: '16px 24px' }}>Registered Date</th>
                                   <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {pendingAgents.map((sa) => (
                                   <tr key={sa.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px', fontWeight: 500 }}>{sa.full_name}</td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.email}</td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>{new Date(sa.created_at).toLocaleDateString('en-IN')}</td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <button
                                         onClick={() => handleApproveAgent(sa.id)}
                                         disabled={agentActionLoading === sa.id}
                                         className="btn btn-primary btn-sm"
                                         style={{ margin: 0 }}
                                       >
                                         {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve Agent'}
                                       </button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </div>

                     {/* SECTION 2: Pending agent payout requests */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         💸 Pending Agent Payout Requests
                         <span className="badge badge-warning" style={{ fontSize: '10px' }}>{payoutRequests.filter(r => r.status === 'Pending').length}</span>
                       </h3>
                       {payoutRequests.filter(r => r.status === 'Pending').length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No pending payout requests.</p>
                         </div>
                       ) : (
                         <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                           <div style={{ overflowX: 'auto' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                               <thead>
                                 <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                   <th style={{ padding: '16px 24px' }}>Agent Details</th>
                                   <th style={{ padding: '16px 24px' }}>Payout Amount</th>
                                   <th style={{ padding: '16px 24px' }}>Request Date</th>
                                   <th style={{ padding: '16px 24px' }}>Disbursement Details</th>
                                   <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {payoutRequests.filter(r => r.status === 'Pending').map((req) => (
                                   <tr key={req.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px' }}>
                                       {req.agent ? (
                                         <>
                                           <div style={{ fontWeight: 500 }}>{req.agent.full_name}</div>
                                           <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Code: {req.agent.agent_code}</div>
                                         </>
                                       ) : (
                                         <span style={{ color: 'var(--color-text-muted)' }}>Deleted Agent</span>
                                       )}
                                     </td>
                                     <td style={{ padding: '16px 24px', fontWeight: 700 }}>
                                       ₹{Number(req.amount).toLocaleString('en-IN')}
                                     </td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                       {new Date(req.created_at).toLocaleDateString('en-IN')}
                                     </td>
                                     <td style={{ padding: '16px 24px', fontSize: 'var(--text-xs)' }}>
                                       <div>Name: <strong>{req.account_name}</strong></div>
                                       {req.upi_id ? (
                                         <div style={{ color: 'var(--color-info)', marginTop: '2px' }}>UPI ID: {req.upi_id}</div>
                                       ) : (
                                         <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                           {req.bank_name} | Acc: {req.account_no} | IFSC: {req.ifsc_code}
                                         </div>
                                       )}
                                     </td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <button
                                         disabled={updatingPayoutId === req.id}
                                         onClick={() => handleApprovePayout(req.id)}
                                         className="btn btn-primary btn-sm"
                                         style={{ margin: 0 }}
                                       >
                                         {updatingPayoutId === req.id ? 'Processing...' : 'Mark as Paid'}
                                       </button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </div>

                     {/* SECTION 3: Client applications with status Applied */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         📝 New Client Applications (Applied)
                         <span className="badge badge-warning" style={{ fontSize: '10px' }}>{applications.filter(a => a.status === 'Applied').length}</span>
                       </h3>
                       {applications.filter(a => a.status === 'Applied').length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No new client applications with status &quot;Applied&quot;.</p>
                         </div>
                       ) : (
                         <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                           <div style={{ overflowX: 'auto' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                               <thead>
                                 <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                   <th style={{ padding: '16px 24px' }}>Client Details</th>
                                   <th style={{ padding: '16px 24px' }}>Submitting Agent</th>
                                   <th style={{ padding: '16px 24px' }}>Bank & Loan</th>
                                   <th style={{ padding: '16px 24px' }}>Loan Amount</th>
                                   <th style={{ padding: '16px 24px', textAlign: 'right' }}>Update Status</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {applications.filter(a => a.status === 'Applied').map((app) => (
                                   <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px' }}>
                                       <div style={{ fontWeight: 500 }}>{app.client_name}</div>
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {app.client_mobile}</div>
                                     </td>
                                     <td style={{ padding: '16px 24px' }}>
                                       {app.agent ? (
                                         <>
                                           <div style={{ fontWeight: 500 }}>{app.agent.full_name}</div>
                                           <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Code: {app.agent.agent_code}</div>
                                         </>
                                       ) : (
                                         <span style={{ color: 'var(--color-text-muted)' }}>Deleted Agent</span>
                                       )}
                                     </td>
                                     <td style={{ padding: '16px 24px' }}>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                         <BankLogo bankName={app.bank_name} size={16} />
                                         {app.bank_name}
                                       </div>
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Type: {app.loan_type === 'PL' ? 'Personal' : 'Business'}</div>
                                     </td>
                                     <td style={{ padding: '16px 24px', fontWeight: 500 }}>₹{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <select
                                         disabled={updatingAppId === app.id}
                                         value={app.status}
                                         onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                         style={{
                                           background: 'var(--color-bg-secondary)',
                                           color: 'var(--color-text-primary)',
                                           border: 'var(--border-light)',
                                           padding: '6px 12px',
                                           borderRadius: '6px',
                                           fontSize: 'var(--text-xs)',
                                           outline: 'none',
                                           cursor: 'pointer'
                                         }}
                                       >
                                         <option value="Applied">Applied</option>
                                         <option value="In Progress">In Progress</option>
                                         <option value="Approved">Approved</option>
                                         <option value="Disbursed">Disbursed</option>
                                         <option value="Rejected">Rejected</option>
                                       </select>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </div>

                     {/* SECTION 4: Outstanding demoted agent balances */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         ⚖️ Outstanding Demoted Agent Balances
                         <span className="badge badge-warning" style={{ fontSize: '10px' }}>{demotedBalances.length}</span>
                       </h3>
                       {demotedBalances.length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No outstanding balances for demoted profiles.</p>
                         </div>
                       ) : (
                         <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                           <div style={{ overflowX: 'auto' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                               <thead>
                                 <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                   <th style={{ padding: '16px 24px' }}>Name</th>
                                   <th style={{ padding: '16px 24px' }}>Demoted Date</th>
                                   <th style={{ padding: '16px 24px' }}>Outstanding Amount</th>
                                   <th style={{ padding: '16px 24px' }}>Latest Payment Details</th>
                                   <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {demotedBalances.map(({ du, outstandingBalance, latestPayout }) => (
                                   <tr key={du.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                       <div>{du.full_name}</div>
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Code: {du.agent_code}</div>
                                     </td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                       {du.demoted_at ? new Date(du.demoted_at).toLocaleDateString('en-IN') : 'N/A'}
                                     </td>
                                     <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--color-warning)' }}>
                                       ₹{outstandingBalance.toLocaleString('en-IN')}
                                     </td>
                                     <td style={{ padding: '16px 24px', fontSize: 'var(--text-xs)' }}>
                                       {latestPayout ? (
                                         latestPayout.upi_id ? (
                                           <div>UPI ID: <span style={{ color: 'var(--color-info)' }}>{latestPayout.upi_id}</span></div>
                                         ) : (
                                           <div>
                                             Bank: {latestPayout.bank_name} | Acc: {latestPayout.account_no} | Name: {latestPayout.account_name}
                                           </div>
                                         )
                                       ) : (
                                         <span style={{ color: 'var(--color-text-tertiary)' }}>No payout request logged</span>
                                       )}
                                     </td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <button
                                         onClick={async () => {
                                           if (!confirm(`Clear remaining balance of ₹${outstandingBalance.toLocaleString('en-IN')} for ${du.full_name}?`)) return;
                                           const { error } = await supabase.from('payout_requests').insert({
                                             agent_id: du.id,
                                             amount: outstandingBalance,
                                             upi_id: latestPayout?.upi_id || null,
                                             account_name: latestPayout?.account_name || du.full_name,
                                             account_no: latestPayout?.account_no || null,
                                             bank_name: latestPayout?.bank_name || null,
                                             ifsc_code: latestPayout?.ifsc_code || null,
                                             status: 'Paid',
                                             paid_at: new Date().toISOString()
                                           });
                                           if (error) {
                                             alert("Failed to clear balance: " + error.message);
                                           } else {
                                              await fetchPayoutRequests();
                                           }
                                         }}
                                         className="btn btn-primary btn-sm"
                                         style={{ margin: 0, background: 'var(--color-success)', border: 'none' }}
                                       >
                                         Clear Balance
                                       </button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                {/* PANEL 1: CUSTOMER INQUIRIES */}
                {activeTab === 'customer_leads' && (
                  <>
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
                          placeholder="Search customer name, phone or pincode..."
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

                    {/* Customer Leads Table */}
                    <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                          <thead>
                            <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Customer Name</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mobile</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Salary</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>CIBIL</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Pincode</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Eligible Matches</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCustomerInquiries.length === 0 ? (
                              <tr>
                                <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                  No customer inquiries found.
                                </td>
                              </tr>
                            ) : (
                              filteredCustomerInquiries.map((inq) => {
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

                {/* PANEL 1.5: AGENT INQUIRIES */}
                {activeTab === 'agent_leads' && (
                  <>
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
                          placeholder="Search client name, phone or pincode..."
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

                    {/* Agent Leads Table */}
                    <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                          <thead>
                            <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Client Name</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Mobile</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Salary</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>CIBIL</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Pincode</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Eligible Matches</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submitting Agent</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAgentInquiries.length === 0 ? (
                              <tr>
                                <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                  No agent inquiries found.
                                </td>
                              </tr>
                            ) : (
                              filteredAgentInquiries.map((inq) => {
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
                                    <td style={{ padding: '16px 24px' }}>
                                      <span className="badge badge-info" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                                        {inq.eligible_banks?.length || 0} Banks
                                      </span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                      <div style={{ fontWeight: 500 }}>{inq.agent.full_name}</div>
                                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>Code: {inq.agent.agent_code}</div>
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

                {/* PANEL 2: ACTIVE AGENTS */}
                {activeTab === 'active_agents' && (
                  <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Agent Name</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Phone Number</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Unique Code</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Approved On</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeAgents.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No active approved agents in database.
                              </td>
                            </tr>
                          ) : (
                            activeAgents.map((agent) => (
                              <tr key={agent.id} onClick={() => handleSelectAgent(agent)} className="table-row-hover" style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }}>
                                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{agent.full_name}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{agent.email}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{agent.phone || 'Not provided'}</td>
                                <td style={{ padding: '16px 24px', fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-accent-violet)' }}>
                                  {agent.agent_code}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                  {new Date(agent.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      onClick={() => handleSelectAgent(agent)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                    >
                                      Inspect Profile 👁️
                                    </button>
                                    <button
                                      onClick={() => handleDemoteAgent(agent.id)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: 'var(--border-error)' }}
                                    >
                                      Demote to User 👤
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PANEL 3: PENDING APPROVALS & RE-PROMOTIONS */}
                {activeTab === 'pending_agents' && (
                  <div style={{ display: 'grid', gap: '32px' }}>
                    {/* Unapproved Signups */}
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px' }}>
                        Pending Agent Registrations
                      </h2>
                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                <th style={{ padding: '16px 24px' }}>Agent Name</th>
                                <th style={{ padding: '16px 24px' }}>Email</th>
                                <th style={{ padding: '16px 24px' }}>Phone Number</th>
                                <th style={{ padding: '16px 24px' }}>Referrer</th>
                                <th style={{ padding: '16px 24px' }}>Registered Date</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingAgents.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No pending agent approvals.
                                  </td>
                                </tr>
                              ) : (
                                pendingAgents.map((sa) => (
                                  <tr key={sa.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{sa.full_name}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.email}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.phone || 'N/A'}</td>
                                    <td style={{ padding: '16px 24px' }}>{sa.referred_by || 'None'}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>{new Date(sa.created_at).toLocaleDateString('en-IN')}</td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                      <button
                                        onClick={() => handleApproveAgent(sa.id)}
                                        disabled={agentActionLoading === sa.id}
                                        className="btn btn-primary btn-sm"
                                        style={{ margin: 0 }}
                                      >
                                        {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve Agent'}
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Demoted Re-promotions queue */}
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Demoted Queue (30-day Restoration Window)
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>(Allows restoring user profiles back to agents within 30 days)</span>
                      </h2>
                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                <th style={{ padding: '16px 24px' }}>Customer Name</th>
                                <th style={{ padding: '16px 24px' }}>Email</th>
                                <th style={{ padding: '16px 24px' }}>Demoted Date</th>
                                <th style={{ padding: '16px 24px' }}>Time Remaining</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {demotedUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No demoted profiles recorded.
                                  </td>
                                </tr>
                              ) : (
                                demotedUsers.map((du) => {
                                  const eligible = isWithin30Days(du.demoted_at);
                                  
                                  // Calculate remaining days
                                  let remainingText = 'Expired';
                                  if (eligible) {
                                    const diffTime = (30 * 24 * 60 * 60 * 1000) - (new Date().getTime() - new Date(du.demoted_at).getTime());
                                    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    remainingText = `${remainingDays} Day${remainingDays > 1 ? 's' : ''} Left`;
                                  }

                                  return (
                                    <tr key={du.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{du.full_name}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{du.email}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {new Date(du.demoted_at).toLocaleDateString('en-IN')}
                                      </td>
                                      <td style={{ padding: '16px 24px', color: eligible ? 'var(--color-warning)' : 'var(--color-error)', fontWeight: 500 }}>
                                        {remainingText}
                                      </td>
                                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        {eligible ? (
                                          <button
                                            onClick={() => handleRepromoteAgent(du.id)}
                                            disabled={agentActionLoading === du.id}
                                            className="btn btn-secondary btn-sm"
                                            style={{ margin: 0, borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-success-bg)' }}
                                          >
                                            💼 Restore to Agent
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Locked</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 4: PAYOUT REQUESTS PROCESSOR */}
                {activeTab === 'payouts' && (
                  <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                            <th style={{ padding: '16px 24px' }}>Agent Details</th>
                            <th style={{ padding: '16px 24px' }}>Payout Amount</th>
                            <th style={{ padding: '16px 24px' }}>Request Date</th>
                            <th style={{ padding: '16px 24px' }}>Disbursement Details</th>
                            <th style={{ padding: '16px 24px' }}>Status</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payoutRequests.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No payout requests submitted.
                              </td>
                            </tr>
                          ) : (
                            payoutRequests.map((req) => (
                              <tr key={req.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                <td style={{ padding: '16px 24px' }}>
                                  {req.agent ? (
                                    <>
                                      <div style={{ fontWeight: 500 }}>{req.agent.full_name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Code: {req.agent.agent_code}</div>
                                    </>
                                  ) : (
                                    <span style={{ color: 'var(--color-text-muted)' }}>Deleted Agent</span>
                                  )}
                                </td>
                                <td style={{ padding: '16px 24px', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                                  ₹{Number(req.amount).toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                  {new Date(req.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td style={{ padding: '16px 24px', fontSize: 'var(--text-xs)' }}>
                                  <div>Name: <strong>{req.account_name}</strong></div>
                                  {req.upi_id ? (
                                    <div style={{ color: 'var(--color-info)', marginTop: '2px' }}>UPI ID: {req.upi_id}</div>
                                  ) : (
                                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                      {req.bank_name} | Acc: {req.account_no} | IFSC: {req.ifsc_code}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                  <span className="badge" style={{ ...getStatusBadgeStyle(req.status), margin: 0, fontSize: '10px' }}>
                                    {req.status}
                                  </span>
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                  {req.status === 'Pending' ? (
                                    <button
                                      disabled={updatingPayoutId === req.id}
                                      onClick={() => handleApprovePayout(req.id)}
                                      className="btn btn-primary btn-sm"
                                      style={{ margin: 0 }}
                                    >
                                      {updatingPayoutId === req.id ? 'Processing...' : 'Mark as Paid'}
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                      Paid on {new Date(req.paid_at).toLocaleDateString('en-IN')}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* PANEL 5: CLIENT APPLICATIONS */}
                {activeTab === 'applications' && (
                  <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Client Details</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submitting Agent</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bank & Loan</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Loan Amount</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Commission (2%)</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submit Date</th>
                            <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Update Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                No client applications submitted yet.
                              </td>
                            </tr>
                          ) : (
                            applications.map((app) => (
                              <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                <td style={{ padding: '16px 24px' }}>
                                  <div style={{ fontWeight: 500 }}>{app.client_name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {app.client_mobile}</div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                  {app.agent ? (
                                    <>
                                      <div style={{ fontWeight: 500 }}>{app.agent.full_name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                        Code: <strong>{app.agent.agent_code}</strong>
                                      </div>
                                    </>
                                  ) : (
                                    <span style={{ color: 'var(--color-text-muted)' }}>Deleted Agent</span>
                                  )}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                    <BankLogo bankName={app.bank_name} size={16} />
                                    {app.bank_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                    Type: {app.loan_type === 'PL' ? 'Personal' : 'Business'}
                                  </div>
                                </td>
                                <td style={{ padding: '16px 24px', fontWeight: 500 }}>₹{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-accent-violet)' }}>₹{Number(app.commission_amount).toLocaleString('en-IN')}</td>
                                <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                  {new Date(app.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                    <span className="badge" style={{ ...getStatusBadgeStyle(app.status), margin: 0, fontSize: '10px' }}>
                                      {app.status}
                                    </span>
                                    <select
                                      disabled={updatingAppId === app.id}
                                      value={app.status}
                                      onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                      style={{
                                        background: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        border: 'var(--border-light)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: 'var(--text-xs)',
                                        outline: 'none',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <option value="Applied">Applied</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Approved">Approved</option>
                                      <option value="Disbursed">Disbursed</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
            )}
          </div>
        </section>
      </main>

      {/* Leads Detail Drawer Modal */}
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
              <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
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
              <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Monthly Salary</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>₹{Number(selectedInquiry.salary).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Running EMIs</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>₹{Number(selectedInquiry.existing_emi).toLocaleString('en-IN')}</div>
                </div>
                <div className="span-2-desktop">
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
              <div className="form-card" style={{ display: 'grid', gap: '16px', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
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
              <div className="form-card" style={{ padding: '16px 20px', background: 'var(--color-bg-card)' }}>
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

      {/* Active Agent Detail Inspector Drawer */}
      {selectedAgent && (
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
        }} onClick={() => handleSelectAgent(null)}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>Inspect Agent Profile</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Agent Code: {selectedAgent.agent_code} | Joined {new Date(selectedAgent.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <button
                onClick={() => handleSelectAgent(null)}
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

            {/* Avatar Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--color-bg-card)', padding: '16px', borderRadius: '8px', border: 'var(--border-subtle)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', border: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedAgent.avatar ? (
                  <img src={selectedAgent.avatar} alt="Agent Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '24px' }}>👤</span>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedAgent.full_name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Official Partner</p>
              </div>
            </div>

            {/* Profile Lock Status */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Lock Status</h4>
              <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Status</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_locked ? 'var(--color-error)' : 'var(--color-success)', marginTop: '4px' }}>
                    {selectedAgent.profile_locked ? '🔒 Locked' : '🔓 Unlocked'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProfileLock(selectedAgent)}
                  disabled={agentActionLoading === selectedAgent.id}
                  className="btn btn-secondary btn-sm"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    borderColor: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    color: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    background: selectedAgent.profile_locked ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600
                  }}
                >
                  {selectedAgent.profile_locked ? '🔓 Unlock Agent Profile' : '🔒 Lock Agent Profile'}
                </button>
              </div>
            </div>

            {/* Profile Update Request */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Update Request</h4>
              <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--color-bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Request Status</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_update_requested ? 'var(--color-warning)' : 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {selectedAgent.profile_update_requested ? '📢 Update Requested — Agent will see reminders every 5 min' : '✅ No pending request'}
                    </div>
                  </div>
                  {selectedAgent.profile_update_requested && (
                    <button
                      onClick={() => handleCancelProfileUpdateRequest(selectedAgent)}
                      disabled={agentActionLoading === selectedAgent.id}
                      className="btn btn-secondary btn-sm"
                      style={{
                        margin: 0,
                        padding: '6px 12px',
                        borderColor: 'var(--color-error)',
                        color: 'var(--color-error)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Cancel Request
                    </button>
                  )}
                </div>

                {selectedAgent.profile_update_requested ? (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--color-bg-input)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: 'var(--border-subtle)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Custom message sent to agent:</strong>
                    {selectedAgent.profile_update_message || <em style={{ color: 'var(--color-text-muted)' }}>No custom message specified.</em>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      Custom Message / Correction Instructions (Optional)
                    </label>
                    <textarea
                      placeholder="e.g. Please upload a clear photo of your Aadhaar card; current one is blurred."
                      value={profileMsgText}
                      onChange={(e) => setProfileMsgText(e.target.value)}
                      className="input-field"
                      rows={3}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        padding: '10px 12px',
                        fontSize: 'var(--text-xs)',
                        borderRadius: 'var(--border-radius-sm)',
                        background: 'var(--color-bg-input)',
                        border: 'var(--border-subtle)',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'inherit'
                      }}
                    />
                    <button
                      onClick={() => handleRequestProfileUpdate(selectedAgent, profileMsgText)}
                      disabled={agentActionLoading === selectedAgent.id}
                      className="btn btn-primary btn-sm"
                      style={{
                        margin: '8px 0 0 auto',
                        padding: '8px 16px',
                        background: 'var(--gradient-primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      📢 Request Profile Update
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* Profile Basics */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Basics & Contact</h4>
                <button
                  onClick={() => handleDemoteAgent(selectedAgent.id)}
                  disabled={agentActionLoading === selectedAgent.id}
                  className="btn btn-secondary btn-sm"
                  style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-error)', border: 'var(--border-error)' }}
                >
                  Demote to Normal User 👤
                </button>
              </div>
              <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Agent Name</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.full_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Email Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Phone Number</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sub-Agent Count</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-info)' }}>{selectedAgentSubAgents.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Date of Birth</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.dob || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Calculated Age</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {selectedAgent.dob ? (new Date().getFullYear() - new Date(selectedAgent.dob).getFullYear()) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Father&apos;s Name</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.fathers_name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Marital Status</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.marital_status || 'N/A'}</div>
                </div>
                <div className="span-2-desktop">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.current_address || 'N/A'}</div>
                </div>
                <div className="span-2-desktop">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Permanent Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.permanent_address || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Pincode</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.pincode || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>City & State</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {selectedAgent.city ? `${selectedAgent.city}, ${selectedAgent.state || ''}` : selectedAgent.state || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Identity Details */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Identity Verification</h4>
              <div className="form-card" style={{ display: 'grid', gap: '16px', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Identity Proof Type</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.id_type || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Identity ID Number</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.id_number || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Identity Document File</div>
                  {selectedAgent.id_file ? (
                    selectedAgent.id_file.startsWith('data:application/pdf') || !selectedAgent.id_file.startsWith('data:image/') ? (
                      <a
                        href={selectedAgent.id_file}
                        download={`identity-${selectedAgent.id_type || 'verification'}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        📄 View / Download Identity Proof PDF
                      </a>
                    ) : (
                      <img src={selectedAgent.id_file} alt="ID Verification" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: 'var(--border-light)' }} />
                    )
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No document uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Financial Summary */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Earnings & payout Summary</h4>
              <div className="form-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>TOTAL EARNINGS</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: '4px' }}>₹{selectedAgentTotalEarnings.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>PAID OUT</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                    ₹{selectedAgentPayouts.filter(r=>r.status==='Paid').reduce((acc, r)=>acc+Number(r.amount), 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>PENDING PAYOUTS</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
                    ₹{selectedAgentPayouts.filter(r=>r.status==='Pending').reduce((acc, r)=>acc+Number(r.amount), 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Applications submitted by this agent */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Client Submissions ({selectedAgentApps.length})</h4>
              {selectedAgentApps.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No applications submitted by this agent.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedAgentApps.map(app => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: '6px', border: 'var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{app.client_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{app.bank_name} | ₹{Number(app.loan_amount).toLocaleString('en-IN')}</div>
                      </div>
                      <span className="badge" style={{ ...getStatusBadgeStyle(app.status), fontSize: '9px', padding: '2px 6px' }}>{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout requests made by this agent */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Payout request Logs ({selectedAgentPayouts.length})</h4>
              {selectedAgentPayouts.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No payout requests logged.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedAgentPayouts.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: '6px', border: 'var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>₹{Number(req.amount).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          Method: {req.upi_id ? `UPI (${req.upi_id})` : `Bank Transfer (${req.bank_name})`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge" style={{ ...getStatusBadgeStyle(req.status), fontSize: '9px', padding: '2px 6px' }}>{req.status}</span>
                        {req.status === 'Pending' && (
                          <button
                            onClick={() => handleApprovePayout(req.id)}
                            className="btn btn-primary btn-sm"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '9px' }}
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
