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
  const [isMobileTabSelectOpen, setIsMobileTabSelectOpen] = useState(false);

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
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [deletingAppId, setDeletingAppId] = useState(null);
  const [appStatusFilter, setAppStatusFilter] = useState('all');

  // Payout requests state
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [updatingPayoutId, setUpdatingPayoutId] = useState(null);
  const [profileMsgText, setProfileMsgText] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Agent profile editing state
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editAgentData, setEditAgentData] = useState(null);

  // Contact messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Bank policies state
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    bank_name: '',
    loan_type: 'PL',
    min_salary: 25000,
    min_cibil: 650,
    foir_max: 55,
    min_age: 21,
    max_age: 60,
    company_category: 'ALL TYPES',
    pf_required: 'No',
    min_experience: '1 Year',
    min_residence_stability: '1 Year',
    all_pincodes: true,
    special_notes: '',
    logo_url: '',
    employment_type: 'salaried',
    policy_category: 'salary'
  });

  const [activePolicyCategory, setActivePolicyCategory] = useState('salary');

  // Pincode management state
  const [bankPincodes, setBankPincodes] = useState([]);
  const [newPincodeText, setNewPincodeText] = useState('');
  const [pincodeActionLoading, setPincodeActionLoading] = useState(null);
  const [pincodeSearchTerm, setPincodeSearchTerm] = useState('');
  const [selectedPincodeIds, setSelectedPincodeIds] = useState([]);

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setProfileMsgText(agent?.profile_update_message || '');
    setIsEditingAgent(false);
    setEditAgentData(agent ? { ...agent } : null);
  };

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_policies')
        .select('*')
        .order('bank_name', { ascending: true });
      if (error) console.error('Error fetching policies:', error.message);
      else setPolicies(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getBankLogo = (bankName) => {
    if (!bankName) return '';
    const normName = bankName.toUpperCase().replace(/\(BL\)/g, '').trim();
    const policy = policies.find(p => p.bank_name.toUpperCase().replace(/\(BL\)/g, '').trim() === normName);
    return policy ? policy.logo_url : '';
  };

  const fetchBankPincodes = async (bankName) => {
    if (!bankName) return;
    try {
      setSelectedPincodeIds([]);
      const { data, error } = await supabase
        .from('bank_pincodes')
        .select('*')
        .eq('bank_name', bankName)
        .order('pincode', { ascending: true });
      if (error) console.error('Error fetching bank pincodes:', error.message);
      else setBankPincodes(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAgentProfile = async () => {
    if (!editAgentData || !selectedAgent) return;
    setAgentActionLoading(selectedAgent.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editAgentData.full_name,
          email: editAgentData.email,
          phone: editAgentData.phone,
          dob: editAgentData.dob,
          fathers_name: editAgentData.fathers_name,
          marital_status: editAgentData.marital_status,
          current_address: editAgentData.current_address,
          permanent_address: editAgentData.permanent_address,
          pincode: editAgentData.pincode,
          city: editAgentData.city,
          state: editAgentData.state,
          id_type: editAgentData.id_type,
          id_number: editAgentData.id_number
        })
        .eq('id', selectedAgent.id);

      if (error) {
        alert('Failed to update agent profile: ' + error.message);
      } else {
        alert('Agent profile updated successfully!');
        logAdminAction('Edit Agent Profile', `Edited profile details for agent: ${editAgentData.full_name} (${editAgentData.email})`);
        const updatedAgent = { ...selectedAgent, ...editAgentData };
        setSelectedAgent(updatedAgent);
        setIsEditingAgent(false);
        await fetchAgentsData(); // Refresh active agents list
      }
    } catch (err) {
      console.error(err);
      alert('Error updating agent profile.');
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleAgentPincodeChange = async (pincodeVal) => {
    const cleaned = pincodeVal.replace(/\D/g, '').slice(0, 6);
    setEditAgentData(prev => ({ ...prev, pincode: cleaned }));
    
    if (cleaned.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();
        if (data && data[0]?.Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setEditAgentData(prev => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State
          }));
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
      }
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!policyForm.bank_name) {
      alert('Bank Name is required');
      return;
    }
    setAgentActionLoading('saving-policy');
    try {
      let query;
      if (selectedPolicy) {
        query = supabase
          .from('bank_policies')
          .update(policyForm)
          .eq('id', selectedPolicy.id);
      } else {
        query = supabase
          .from('bank_policies')
          .insert([policyForm]);
      }
      
      const { error } = await query;
      if (error) {
        alert('Error saving policy: ' + error.message);
      } else {
        alert(selectedPolicy ? 'Policy updated successfully!' : 'Policy added successfully!');
        logAdminAction(selectedPolicy ? 'Update Bank Policy' : 'Create Bank Policy', `${selectedPolicy ? 'Updated' : 'Created'} policy details for bank: ${policyForm.bank_name} (${policyForm.policy_category})`);
        setIsPolicyModalOpen(false);
        setSelectedPolicy(null);
        await fetchPolicies();
      }
    } catch (err) {
      console.error(err);
      alert('Error saving policy');
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this bank policy? This action cannot be undone.')) {
      return;
    }
    setAgentActionLoading('deleting-policy');
    try {
      const { error } = await supabase
        .from('bank_policies')
        .delete()
        .eq('id', policyId);
      if (error) {
        alert('Error deleting policy: ' + error.message);
      } else {
        alert('Policy deleted successfully!');
        logAdminAction('Delete Bank Policy', `Deleted bank policy ID: ${policyId}`);
        await fetchPolicies();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting policy');
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleOpenAddPolicy = () => {
    setSelectedPolicy(null);
    setPolicyForm({
      bank_name: '',
      loan_type: activePolicyCategory === 'business' ? 'BL' : 'PL',
      min_salary: 25000,
      min_cibil: 650,
      foir_max: 55,
      min_age: 21,
      max_age: 60,
      company_category: 'ALL TYPES',
      pf_required: 'No',
      min_experience: '1 Year',
      min_residence_stability: '1 Year',
      all_pincodes: true,
      special_notes: '',
      logo_url: '',
      apply_url: '',
      portal_username: '',
      portal_password: '',
      direct_submit: false,
      employment_type: activePolicyCategory === 'salary' ? 'salaried' : 'self_employed',
      policy_category: activePolicyCategory
    });
    setBankPincodes([]);
    setPincodeSearchTerm('');
    setSelectedPincodeIds([]);
    setIsPolicyModalOpen(true);
  };

  const handleOpenEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setPolicyForm({
      bank_name: policy.bank_name,
      loan_type: policy.loan_type,
      min_salary: policy.min_salary,
      min_cibil: policy.min_cibil,
      foir_max: policy.foir_max,
      min_age: policy.min_age,
      max_age: policy.max_age,
      company_category: policy.company_category || 'ALL TYPES',
      pf_required: policy.pf_required || 'No',
      min_experience: policy.min_experience || '1 Year',
      min_residence_stability: policy.min_residence_stability || '1 Year',
      all_pincodes: policy.all_pincodes !== false,
      special_notes: policy.special_notes || '',
      logo_url: policy.logo_url || '',
      apply_url: policy.apply_url || '',
      portal_username: policy.portal_username || '',
      portal_password: policy.portal_password || '',
      direct_submit: policy.direct_submit === true,
      employment_type: policy.employment_type || 'salaried',
      policy_category: policy.policy_category || 'salary'
    });
    setPincodeSearchTerm('');
    setSelectedPincodeIds([]);
    setIsPolicyModalOpen(true);
    
    if (policy.all_pincodes === false) {
      fetchBankPincodes(policy.bank_name);
    } else {
      setBankPincodes([]);
    }
  };

  const handleAddBankPincodes = async () => {
    if (!newPincodeText.trim()) return;
    const bankName = policyForm.bank_name || selectedPolicy?.bank_name;
    if (!bankName) {
      alert('Please specify the Bank Name first.');
      return;
    }
    
    setPincodeActionLoading('adding');
    const pincodesToAdd = newPincodeText
      .split(',')
      .map(p => p.trim())
      .filter(p => /^\d{6}$/.test(p));
      
    if (pincodesToAdd.length === 0) {
      alert('Please enter valid 6-digit numeric pincode(s).');
      setPincodeActionLoading(null);
      return;
    }
    
    try {
      // Check for duplicates
      const { data: existingPins } = await supabase
        .from('bank_pincodes')
        .select('pincode')
        .eq('bank_name', bankName)
        .in('pincode', pincodesToAdd);
      
      const existingSet = new Set((existingPins || []).map(p => p.pincode));
      const newPins = pincodesToAdd.filter(p => !existingSet.has(p));
      const duplicates = pincodesToAdd.filter(p => existingSet.has(p));
      
      if (duplicates.length > 0) {
        alert(`⚠️ ${duplicates.length} pincode(s) already exist for ${bankName}: ${duplicates.slice(0, 10).join(', ')}${duplicates.length > 10 ? '...' : ''}`);
      }
      
      if (newPins.length === 0) {
        setPincodeActionLoading(null);
        return;
      }
      
      const rows = newPins.map(pin => ({
        bank_name: bankName,
        pincode: pin,
        is_active: true
      }));
      
      const { error } = await supabase
        .from('bank_pincodes')
        .insert(rows);
        
      if (error) {
        alert('Error adding pincodes: ' + error.message);
      } else {
        setNewPincodeText('');
        await fetchBankPincodes(bankName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPincodeActionLoading(null);
    }
  };

  const handleDeleteBankPincode = async (pincodeId) => {
    const bankName = policyForm.bank_name || selectedPolicy?.bank_name;
    setPincodeActionLoading(pincodeId);
    try {
      const { error } = await supabase
        .from('bank_pincodes')
        .delete()
        .eq('id', pincodeId);
        
      if (error) {
        alert('Error removing pincode: ' + error.message);
      } else {
        await fetchBankPincodes(bankName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPincodeActionLoading(null);
    }
  };

  const handleBulkDeletePincodes = async () => {
    if (selectedPincodeIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedPincodeIds.length} selected pincode(s)?`)) return;
    
    const bankName = policyForm.bank_name || selectedPolicy?.bank_name;
    setPincodeActionLoading('bulk-deleting');
    try {
      const { error } = await supabase
        .from('bank_pincodes')
        .delete()
        .in('id', selectedPincodeIds);
        
      if (error) {
        alert('Error deleting pincodes: ' + error.message);
      } else {
        setSelectedPincodeIds([]);
        await fetchBankPincodes(bankName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPincodeActionLoading(null);
    }
  };

  const fetchInquiries = async () => {
    try {
      // Fetch user inquiries and join profiles to identify role (agent vs customer)
      const { data, error } = await supabase
        .from('user_inquiries')
        .select('*, agent:profiles(full_name, email, agent_code, role)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inquiries:', error.message);
      } else {
        // Keep only the latest enquiry per mobile number
        const seen = new Set();
        const deduped = (data || []).filter(inq => {
          if (!inq.mobile) return true;
          const mob = inq.mobile.trim();
          if (seen.has(mob)) return false;
          seen.add(mob);
          return true;
        });
        setInquiries(deduped);
      }
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
        .select('*, agent:profiles(full_name, email, agent_code, role)')
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

  const fetchContactMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching contact messages:', error.message);
      else setContactMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContactMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return;
    setMessageActionLoading(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Message deleted successfully.');
      setContactMessages((prev) => prev.filter((msg) => msg.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting contact message:', err.message);
      alert('Failed to delete message: ' + err.message);
    } finally {
      setMessageActionLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching audit logs:', error.message);
      else setAuditLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const logAdminAction = async (action, details = '') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminEmail = session?.user?.email || 'unknown';
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          admin_email: adminEmail,
          action,
          details
        }]);
      if (error) console.error('Error creating audit log:', error.message);
      else {
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInquiries(),
      fetchAgentsData(),
      fetchApplications(),
      fetchPayoutRequests(),
      fetchPolicies(),
      fetchContactMessages(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  };

  // Authenticate admin
  useEffect(() => {
    async function authenticateAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || (session.user.email !== 'handtohandloans@gmail.com' && session.user.email !== 'utkrashtkumar@gmail.com')) {
        router.push('/admin/login');
      } else {
        await fetchAllData();
      }
    }

    authenticateAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);



  // Auto-inject data-label attributes to td elements based on th text content
  useEffect(() => {
    const timer = setTimeout(() => {
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.replace(/[^a-zA-Z0-9\s/()₹%-]/g, '').trim());
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, index) => {
            if (headers[index] && !cell.getAttribute('data-label')) {
              cell.setAttribute('data-label', headers[index]);
            }
          });
        });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab, loading, inquiries, activeAgents, pendingAgents, demotedUsers, applications, payoutRequests, policies, contactMessages]);

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
        .update({ approved: true, demoted_at: null, profile_update_message: null })
        .eq('id', agentId);

      if (error) {
        alert('Approval failed: ' + error.message);
      } else {
        logAdminAction('Approve Agent', `Approved agent ID: ${agentId}`);
        await fetchAgentsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRejectAgent = async (agentId) => {
    const reason = prompt('Enter reason for rejecting this agent (this will be shown to the user upon login):', 'Your document details were invalid.');
    if (reason === null) return; // user cancelled prompt
    
    setAgentActionLoading(agentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          approved: false, 
          profile_update_message: 'REJECTED: ' + (reason.trim() || 'No specific reason provided.') 
        })
        .eq('id', agentId);

      if (error) {
        alert('Rejection failed: ' + error.message);
      } else {
        alert('Agent registration rejected.');
        logAdminAction('Reject Agent', `Rejected agent ID: ${agentId}. Reason: ${reason}`);
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
        logAdminAction('Demote Agent', `Demoted agent ID: ${agentId} to standard user role.`);
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
        logAdminAction('Re-promote Agent', `Re-promoted user ID: ${userId} back to agent role.`);
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
        logAdminAction(newLockStatus ? 'Lock Agent Profile' : 'Unlock Agent Profile', `Changed lock status to ${newLockStatus ? 'locked' : 'unlocked'} for agent ID: ${agent.id} (${agent.full_name})`);
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
        logAdminAction('Update Application Status', `Updated application ID: ${appId} to status: ${newStatus}`);
        await Promise.all([fetchApplications(), fetchPayoutRequests()]);
        setSelectedApplication(prev => {
          if (prev && prev.id === appId) {
            return { ...prev, status: newStatus, disbursed_at: updateData.disbursed_at };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleDeleteApplication = async (appId) => {
    if (!window.confirm('⚠️ Are you sure you want to permanently delete this client application? This action cannot be undone.')) return;
    setDeletingAppId(appId);
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

      if (error) {
        alert('Delete application failed: ' + error.message);
      } else {
        alert('Application deleted successfully!');
        logAdminAction('Delete Client Application', `Deleted application ID: ${appId}`);
        setSelectedApplication(prev => prev && prev.id === appId ? null : prev);
        await Promise.all([fetchApplications(), fetchPayoutRequests()]);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the application.');
    } finally {
      setDeletingAppId(null);
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
        logAdminAction('Approve Payout Request', `Approved and marked paid for payout request ID: ${payoutId}`);
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
    if (!status) return {};
    switch (status.toLowerCase()) {
      case 'applied':
      case 'pending':
        return { color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', border: 'var(--border-light)' };
      case 'in progress':
      case 'in process':
        return { color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: 'var(--border-warning)' };
      case 'approved':
      case 'kyc verification':
        return { color: 'var(--color-info)', background: 'var(--color-info-bg)', border: 'var(--border-accent)' };
      case 'disbursed':
      case 'paid':
        return { color: 'var(--color-success)', background: 'var(--color-success-bg)', border: 'var(--border-success)', boxShadow: 'var(--shadow-glow-success)' };
      case 'rejected':
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
  const selectedAgentDisbursedApps = selectedAgentApps.filter(app => app.status && app.status.toLowerCase() === 'disbursed');
  const selectedAgentDirectComm = selectedAgentDisbursedApps.reduce((acc, app) => acc + Number(app.commission_amount), 0);
  
  // Find sub-agents of selected agent to fetch referral commissions
  const selectedAgentSubAgents = selectedAgent ? [...activeAgents, ...pendingAgents].filter(sa => sa.referred_by === selectedAgent.agent_code) : [];
  const selectedAgentSubAgentIds = selectedAgentSubAgents.map(sa => sa.id);
  const selectedAgentReferralApps = applications.filter(app => selectedAgentSubAgentIds.includes(app.agent_id) && app.status && app.status.toLowerCase() === 'disbursed');
  const selectedAgentReferralBonus = selectedAgentReferralApps.reduce((acc, app) => acc + (Number(app.loan_amount) * 0.005), 0);
  const selectedAgentTotalEarnings = selectedAgentDirectComm + selectedAgentReferralBonus;

  const getDemotedOutstandingBalances = () => {
    return demotedUsers.map(du => {
      const duApps = applications.filter(app => app.agent_id === du.id);
      const duDisbursed = duApps.filter(app => app.status && app.status.toLowerCase() === 'disbursed');
      const directComm = duDisbursed.reduce((acc, app) => acc + Number(app.commission_amount), 0);
      
      const saIds = activeAgents.filter(sa => sa.referred_by === du.agent_code).map(sa => sa.id);
      const referralApps = applications.filter(app => saIds.includes(app.agent_id) && app.status && app.status.toLowerCase() === 'disbursed');
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

  const actualPendingAgents = pendingAgents.filter(sa => !(sa.profile_update_message && sa.profile_update_message.startsWith('REJECTED:')));
  const demotedBalances = getDemotedOutstandingBalances();
  const agentApplications = applications.filter(app => app.agent?.role !== 'user');
  const customerApplications = applications.filter(app => app.agent?.role === 'user');
  const totalNotifications = actualPendingAgents.length + 
                             payoutRequests.filter(r => r.status === 'Pending').length + 
                             applications.filter(a => a.status && a.status.toLowerCase() === 'applied').length + 
                             demotedBalances.length;

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="admin-section" style={{ padding: 'clamp(16px, 3vw, 48px) clamp(12px, 2vw, 24px)', minHeight: '90vh' }}>
          <div className="container" style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            
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
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-warning)', marginTop: '8px' }}>{actualPendingAgents.length}</div>
                  </div>
                  <div className="form-card" style={{ padding: '20px 24px', backdropFilter: 'blur(20px)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Payouts</div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>
                      ₹{payoutRequests.filter(req => req.status === 'Pending').reduce((acc, req) => acc + Number(req.amount), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="tabs-container">
                  {/* MOBILE TABS MENU (hamburger / dropdown toggle style) */}
                  <div className="mobile-tabs-menu" style={{ marginBottom: '20px', position: 'relative' }}>
                    <button
                      onClick={() => setIsMobileTabSelectOpen(!isMobileTabSelectOpen)}
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        background: 'var(--color-bg-glass)',
                        border: 'var(--border-light)',
                        borderRadius: 'var(--border-radius-lg)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {[
                          { id: 'notifications', label: `🔔 Notifications (${totalNotifications})` },
                          { id: 'customer_leads', label: `👤 Customer Inquiries (${customerInquiries.length})` },
                          { id: 'agent_leads', label: `💼 Agent Inquiries (${agentInquiries.length})` },
                          { id: 'active_agents', label: `👥 Active Agents (${activeAgents.length})` },
                          { id: 'pending_agents', label: `⏳ Approval & Re-promotion (${pendingAgents.length + demotedUsers.length})` },
                          { id: 'payouts', label: `💸 Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                          { id: 'agent_applications', label: `📝 Agent Applications (${agentApplications.length})` },
                          { id: 'customer_applications', label: `👤 Customer Applications (${customerApplications.length})` },
                          { id: 'policies', label: `🏦 Bank Policies (${policies.length})` },
                          { id: 'contacts', label: `💌 Contact Messages (${contactMessages.length})` },
                          { id: 'audit_logs', label: `📋 Audit Logs (${auditLogs.length})` },
                        ].find(t => t.id === activeTab)?.label || 'Select Menu Option'}
                      </span>
                      <span style={{ fontSize: '12px' }}>{isMobileTabSelectOpen ? '▲ Close' : '▼ Menu'}</span>
                    </button>

                    {isMobileTabSelectOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '8px',
                          background: 'rgba(17, 24, 39, 0.95)',
                          backdropFilter: 'blur(30px)',
                          WebkitBackdropFilter: 'blur(30px)',
                          border: 'var(--border-accent)',
                          borderRadius: 'var(--border-radius-lg)',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 99999
                        }}
                      >
                        {[
                          { id: 'notifications', label: `🔔 Notifications (${totalNotifications})` },
                          { id: 'customer_leads', label: `👤 Customer Inquiries (${customerInquiries.length})` },
                          { id: 'agent_leads', label: `💼 Agent Inquiries (${agentInquiries.length})` },
                          { id: 'active_agents', label: `👥 Active Agents (${activeAgents.length})` },
                          { id: 'pending_agents', label: `⏳ Approval & Re-promotion (${pendingAgents.length + demotedUsers.length})` },
                          { id: 'payouts', label: `💸 Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                          { id: 'agent_applications', label: `📝 Agent Applications (${agentApplications.length})` },
                          { id: 'customer_applications', label: `👤 Customer Applications (${customerApplications.length})` },
                          { id: 'policies', label: `🏦 Bank Policies (${policies.length})` },
                          { id: 'contacts', label: `💌 Contact Messages (${contactMessages.length})` },
                          { id: 'audit_logs', label: `📋 Audit Logs (${auditLogs.length})` },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setSearchTerm('');
                              setIsMobileTabSelectOpen(false);
                            }}
                            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 16px',
                              fontSize: 'var(--text-sm)',
                              background: activeTab === tab.id ? 'var(--gradient-primary)' : 'transparent',
                              border: 'none',
                              color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-secondary)',
                              justifyContent: 'flex-start'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DESKTOP TABS SIDEBAR (vertical sidebar layout) */}
                  <div className="desktop-tabs-sidebar tabs-sidebar" style={{ marginBottom: '24px' }}>
                    {[
                      { id: 'notifications', label: `🔔 Notifications (${totalNotifications})` },
                      { id: 'customer_leads', label: `👤 Customer Inquiries (${customerInquiries.length})` },
                      { id: 'agent_leads', label: `💼 Agent Inquiries (${agentInquiries.length})` },
                      { id: 'active_agents', label: `👥 Active Agents (${activeAgents.length})` },
                      { id: 'pending_agents', label: `⏳ Approval & Re-promotion (${pendingAgents.length + demotedUsers.length})` },
                      { id: 'payouts', label: `💸 Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                      { id: 'agent_applications', label: `📝 Agent Applications (${agentApplications.length})` },
                      { id: 'customer_applications', label: `👤 Customer Applications (${customerApplications.length})` },
                      { id: 'policies', label: `🏦 Bank Policies (${policies.length})` },
                      { id: 'contacts', label: `💌 Contact Messages (${contactMessages.length})` },
                      { id: 'audit_logs', label: `📋 Audit Logs (${auditLogs.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSearchTerm('');
                        }}
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
                         <span className="badge badge-warning" style={{ fontSize: '10px' }}>{actualPendingAgents.length}</span>
                       </h3>
                       {actualPendingAgents.length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No pending agent registrations.</p>
                         </div>
                       ) : (
                         <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                           <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                                 {actualPendingAgents.map((sa) => (
                                   <tr key={sa.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px', fontWeight: 500 }}>{sa.full_name}</td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.email}</td>
                                     <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>{new Date(sa.created_at).toLocaleDateString('en-IN')}</td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                         <button
                                           onClick={() => handleApproveAgent(sa.id)}
                                           disabled={agentActionLoading === sa.id}
                                           className="btn btn-primary btn-sm"
                                           style={{ margin: 0 }}
                                         >
                                           {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve'}
                                         </button>
                                         <button
                                           onClick={() => handleRejectAgent(sa.id)}
                                           disabled={agentActionLoading === sa.id}
                                           className="btn btn-secondary btn-sm"
                                           style={{ margin: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                                           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                         >
                                           {agentActionLoading === sa.id ? 'Rejecting...' : '✗ Reject'}
                                         </button>
                                       </div>
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
                           <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                           <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                                 {applications.filter(a => a.status && a.status.toLowerCase() === 'applied').map((app) => (
                                   <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                     <td style={{ padding: '16px 24px' }}>
                                       <div style={{ fontWeight: 500 }}>{app.client_name}</div>
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {app.client_mobile}</div>
                                       {app.problem && (
                                         <div style={{ 
                                           fontSize: '11px', 
                                           color: 'var(--color-error)', 
                                           marginTop: '6px',
                                           background: 'rgba(239, 68, 68, 0.08)',
                                           padding: '6px 8px',
                                           borderRadius: '4px',
                                           borderLeft: '2px solid var(--color-error)',
                                           maxWidth: '280px',
                                           wordBreak: 'break-word',
                                           textAlign: 'left'
                                         }}>
                                           ⚠️ <strong>Issue:</strong> {app.problem}
                                         </div>
                                       )}
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
                                         <BankLogo bankName={app.bank_name} logoUrl={getBankLogo(app.bank_name)} size={16} />
                                         {app.bank_name}
                                       </div>
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Type: {app.loan_type === 'PL' ? 'Personal' : 'Business'}</div>
                                     </td>
                                     <td style={{ padding: '16px 24px', fontWeight: 500 }}>₹{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                     <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                       <select
                                         disabled={updatingAppId === app.id}
                                         value={app.status ? app.status.toLowerCase() : 'applied'}
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
                                         <option value="applied">Applied</option>
                                         <option value="in process">In Progress</option>
                                         <option value="kyc verification">KYC Verification</option>
                                         <option value="disbursed">Disbursed</option>
                                         <option value="rejected">Rejected</option>
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
                           <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                                              logAdminAction('Clear Demoted Balance', `Cleared outstanding balance of ₹${outstandingBalance} for demoted user: ${du.full_name} (${du.email})`);
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
                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                {activeTab === 'active_agents' && (() => {
                  const filtered = activeAgents.filter(agent => {
                    const query = searchTerm.toLowerCase().trim();
                    return (
                      agent.full_name?.toLowerCase().includes(query) ||
                      agent.email?.toLowerCase().includes(query) ||
                      agent.phone?.includes(query) ||
                      agent.agent_code?.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                      {/* Search Bar */}
                      <div style={{ padding: '16px 24px', borderBottom: 'var(--border-subtle)' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>🔍</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search active agents by name, email, phone, or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                  No approved agents match your search criteria.
                                </td>
                              </tr>
                            ) : (
                              filtered.map((agent) => (
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
                  );
                })()}

                {/* PANEL 3: PENDING APPROVALS & RE-PROMOTIONS */}
                {activeTab === 'pending_agents' && (() => {
                  const query = searchTerm.toLowerCase().trim();
                  const filteredPending = pendingAgents.filter(sa => {
                    if (!query) return true;
                    return (
                      sa.full_name?.toLowerCase().includes(query) ||
                      sa.email?.toLowerCase().includes(query) ||
                      sa.phone?.includes(query) ||
                      sa.referred_by?.toLowerCase().includes(query)
                    );
                  });
                  const filteredDemoted = demotedUsers.filter(du => {
                    if (!query) return true;
                    return (
                      du.full_name?.toLowerCase().includes(query) ||
                      du.email?.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div style={{ display: 'grid', gap: '32px' }}>
                      {/* Search Bar */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>🔍</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search pending registrations and demoted queue by name, email, phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      {/* Unapproved Signups */}
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px' }}>
                          Pending Agent Registrations
                        </h2>
                        <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                              <thead>
                                <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Agent Name</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Phone Number</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Referrer</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Registered Date</th>
                                  <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPending.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                      No pending agent approvals match search.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredPending.map((sa) => {
                                  const isRejected = sa.profile_update_message && sa.profile_update_message.startsWith('REJECTED:');
                                  const rejectReason = isRejected ? sa.profile_update_message.replace('REJECTED:', '').trim() : '';
                                  return (
                                    <tr key={sa.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                        {sa.full_name}
                                        {isRejected && (
                                          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 400, marginTop: '4px' }}>
                                            Reason: {rejectReason}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.email}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{sa.phone || 'N/A'}</td>
                                      <td style={{ padding: '16px 24px' }}>
                                        {isRejected ? (
                                          <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2.5px 6px', borderRadius: '4px', fontSize: '11px' }}>Rejected</span>
                                        ) : (
                                          <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2.5px 6px', borderRadius: '4px', fontSize: '11px' }}>Pending</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '16px 24px' }}>{sa.referred_by || 'None'}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>{new Date(sa.created_at).toLocaleDateString('en-IN')}</td>
                                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                          <button
                                            onClick={() => handleApproveAgent(sa.id)}
                                            disabled={agentActionLoading === sa.id}
                                            className="btn btn-primary btn-sm"
                                            style={{ margin: 0 }}
                                          >
                                            {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve'}
                                          </button>
                                          {!isRejected && (
                                            <button
                                              onClick={() => handleRejectAgent(sa.id)}
                                              disabled={agentActionLoading === sa.id}
                                              className="btn btn-secondary btn-sm"
                                              style={{ margin: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                            >
                                              {agentActionLoading === sa.id ? 'Rejecting...' : '✗ Reject'}
                                            </button>
                                          )}
                                        </div>
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

                    {/* Demoted Re-promotions queue */}
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Demoted Queue (30-day Restoration Window)
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>(Allows restoring user profiles back to agents within 30 days)</span>
                      </h2>
                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                              {filteredDemoted.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No demoted profiles match search.
                                  </td>
                                </tr>
                              ) : (
                                filteredDemoted.map((du) => {
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
                );
              })()}

                {/* PANEL 4: PAYOUT REQUESTS PROCESSOR */}
                {activeTab === 'payouts' && (() => {
                  const query = searchTerm.toLowerCase().trim();
                  const filteredPayouts = payoutRequests.filter(req => {
                    if (!query) return true;
                    return (
                      req.agent?.full_name?.toLowerCase().includes(query) ||
                      req.agent?.agent_code?.toLowerCase().includes(query) ||
                      req.account_name?.toLowerCase().includes(query) ||
                      req.upi_id?.toLowerCase().includes(query) ||
                      req.bank_name?.toLowerCase().includes(query) ||
                      req.account_no?.includes(query) ||
                      req.amount?.toString().includes(query) ||
                      req.status?.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {/* Search Bar */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>🔍</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search payout requests by agent, bank details, upi, status, amount..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
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
                              {filteredPayouts.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No payout requests match search.
                                  </td>
                                </tr>
                              ) : (
                                filteredPayouts.map((req) => (
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
                    </div>
                  );
                })()}

                {/* PANEL 5: CLIENT APPLICATIONS */}
                {activeTab === 'agent_applications' && (() => {
                  const query = searchTerm.toLowerCase().trim();
                  const filtered = agentApplications.filter(app => {
                    if (!query) return true;
                    return (
                      app.client_name?.toLowerCase().includes(query) ||
                      app.client_mobile?.includes(query) ||
                      app.bank_name?.toLowerCase().includes(query) ||
                      app.loan_type?.toLowerCase().includes(query) ||
                      app.application_id?.toLowerCase().includes(query) ||
                      app.agent?.full_name?.toLowerCase().includes(query) ||
                      app.agent?.agent_code?.toLowerCase().includes(query)
                    );
                  });
                  const displayApps = filtered.filter(app => 
                    appStatusFilter === 'all' ? true : (app.status || '').toLowerCase() === appStatusFilter
                  );
                  return (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {/* Search Bar */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>🔍</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search applications by client, mobile, bank, agent, or Application ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      {/* Sub-tabs for filtering status */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'applied', label: 'Applied' },
                          { id: 'in process', label: 'In Process' },
                          { id: 'kyc verification', label: 'KYC Waiting' },
                          { id: 'disbursed', label: 'Disbursed' },
                          { id: 'rejected', label: 'Rejected' }
                        ].map(subTab => {
                          const count = filtered.filter(app => subTab.id === 'all' ? true : (app.status || '').toLowerCase() === subTab.id).length;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setAppStatusFilter(subTab.id)}
                              className="btn btn-sm"
                              style={{
                                margin: 0,
                                padding: '6px 12px',
                                fontSize: 'var(--text-xs)',
                                background: appStatusFilter === subTab.id ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                color: appStatusFilter === subTab.id ? '#fff' : 'var(--color-text-secondary)',
                                border: appStatusFilter === subTab.id ? 'none' : 'var(--border-light)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              {subTab.label}
                              <span style={{
                                background: appStatusFilter === subTab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                color: '#fff'
                              }}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Client Details</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submitting Agent</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bank & Loan</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Loan Amount</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Commission (2%)</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submit Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayApps.length === 0 ? (
                                <tr>
                                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No agent applications match search and status &quot;{appStatusFilter}&quot;.
                                  </td>
                                </tr>
                              ) : (
                                displayApps.map((app) => (
                                  <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }} onClick={() => setSelectedApplication(app)}>
                                    <td style={{ padding: '16px 24px' }}>
                                      <div style={{ fontWeight: 600 }}>{app.client_name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {app.client_mobile}</div>
                                      {app.application_id && (
                                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                                          ID: {app.application_id}
                                        </div>
                                      )}
                                      {app.problem && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: 'var(--color-error)', 
                                          marginTop: '6px',
                                          background: 'rgba(239, 68, 68, 0.08)',
                                          padding: '6px 8px',
                                          borderRadius: '4px',
                                          borderLeft: '2px solid var(--color-error)',
                                          maxWidth: '280px',
                                          wordBreak: 'break-word',
                                          textAlign: 'left'
                                        }}>
                                          ⚠️ <strong>Issue:</strong> {app.problem}
                                        </div>
                                      )}
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
                                        <BankLogo bankName={app.bank_name} logoUrl={getBankLogo(app.bank_name)} size={16} />
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
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                        <span className="badge" style={{ ...getStatusBadgeStyle(app.status), margin: 0, fontSize: '10px' }}>
                                          {app.status}
                                        </span>
                                        <button
                                          onClick={() => setSelectedApplication(app)}
                                          className="btn btn-sm"
                                          style={{
                                            margin: 0,
                                            padding: '6px 12px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            color: 'var(--color-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600
                                          }}
                                        >
                                          🔍 Inspect
                                        </button>
                                        <button
                                          onClick={() => handleDeleteApplication(app.id)}
                                          disabled={deletingAppId === app.id}
                                          className="btn btn-sm"
                                          style={{
                                            margin: 0,
                                            padding: '6px 8px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: 'var(--color-error)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                          title="Delete application"
                                        >
                                          🗑️
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
                    </div>
                  );
                })()}

                {/* PANEL 5B: CUSTOMER APPLICATIONS */}
                {activeTab === 'customer_applications' && (() => {
                  const query = searchTerm.toLowerCase().trim();
                  const filtered = customerApplications.filter(app => {
                    if (!query) return true;
                    return (
                      app.client_name?.toLowerCase().includes(query) ||
                      app.client_mobile?.includes(query) ||
                      app.bank_name?.toLowerCase().includes(query) ||
                      app.loan_type?.toLowerCase().includes(query) ||
                      app.application_id?.toLowerCase().includes(query) ||
                      app.agent?.full_name?.toLowerCase().includes(query) ||
                      app.agent?.email?.toLowerCase().includes(query)
                    );
                  });
                  const displayApps = filtered.filter(app => 
                    appStatusFilter === 'all' ? true : (app.status || '').toLowerCase() === appStatusFilter
                  );
                  return (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {/* Search Bar */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>🔍</span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search applications by client, mobile, bank, customer, or Application ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      {/* Sub-tabs for filtering status */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'applied', label: 'Applied' },
                          { id: 'in process', label: 'In Process' },
                          { id: 'kyc verification', label: 'KYC Waiting' },
                          { id: 'disbursed', label: 'Disbursed' },
                          { id: 'rejected', label: 'Rejected' }
                        ].map(subTab => {
                          const count = filtered.filter(app => subTab.id === 'all' ? true : (app.status || '').toLowerCase() === subTab.id).length;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setAppStatusFilter(subTab.id)}
                              className="btn btn-sm"
                              style={{
                                margin: 0,
                                padding: '6px 12px',
                                fontSize: 'var(--text-xs)',
                                background: appStatusFilter === subTab.id ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                color: appStatusFilter === subTab.id ? '#fff' : 'var(--color-text-secondary)',
                                border: appStatusFilter === subTab.id ? 'none' : 'var(--border-light)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              {subTab.label}
                              <span style={{
                                background: appStatusFilter === subTab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                color: '#fff'
                              }}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Client Details</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submitting Customer</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Bank & Loan</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Loan Amount</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Submit Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayApps.length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No customer applications match search and status &quot;{appStatusFilter}&quot;.
                                  </td>
                                </tr>
                              ) : (
                                displayApps.map((app) => (
                                  <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }} onClick={() => setSelectedApplication(app)}>
                                    <td style={{ padding: '16px 24px' }}>
                                      <div style={{ fontWeight: 600 }}>{app.client_name}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>📞 {app.client_mobile}</div>
                                      {app.application_id && (
                                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                                          ID: {app.application_id}
                                        </div>
                                      )}
                                      {app.problem && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: 'var(--color-error)', 
                                          marginTop: '6px',
                                          background: 'rgba(239, 68, 68, 0.08)',
                                          padding: '6px 8px',
                                          borderRadius: '4px',
                                          borderLeft: '2px solid var(--color-error)',
                                          maxWidth: '280px',
                                          wordBreak: 'break-word',
                                          textAlign: 'left'
                                        }}>
                                          ⚠️ <strong>Issue:</strong> {app.problem}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                      {app.agent ? (
                                        <>
                                          <div style={{ fontWeight: 500 }}>{app.agent.full_name}</div>
                                          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                            Email: {app.agent.email}
                                          </div>
                                        </>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-muted)' }}>Deleted User</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                        <BankLogo bankName={app.bank_name} logoUrl={getBankLogo(app.bank_name)} size={16} />
                                        {app.bank_name}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                        Type: {app.loan_type === 'PL' ? 'Personal' : 'Business'}
                                      </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>₹{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                      {new Date(app.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                        <span className="badge" style={{ ...getStatusBadgeStyle(app.status), margin: 0, fontSize: '10px' }}>
                                          {app.status}
                                        </span>
                                        <button
                                          onClick={() => setSelectedApplication(app)}
                                          className="btn btn-sm"
                                          style={{
                                            margin: 0,
                                            padding: '6px 12px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            color: 'var(--color-primary)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600
                                          }}
                                        >
                                          🔍 Inspect
                                        </button>
                                        <button
                                          onClick={() => handleDeleteApplication(app.id)}
                                          disabled={deletingAppId === app.id}
                                          className="btn btn-sm"
                                          style={{
                                            margin: 0,
                                            padding: '6px 8px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: 'var(--color-error)',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                          title="Delete application"
                                        >
                                          🗑️
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
                    </div>
                  );
                })()}

                {/* PANEL 6: BANK POLICIES */}
                {activeTab === 'policies' && (() => {
                  const salaryCount = policies.filter(p => (p.policy_category || 'salary') === 'salary').length;
                  const instantCount = policies.filter(p => p.policy_category === 'instant').length;
                  const businessCount = policies.filter(p => p.policy_category === 'business').length;
                  
                  const displayPolicies = policies.filter(policy => 
                    (policy.policy_category || 'salary') === activePolicyCategory
                  );
                  
                  const subTabs = [
                    { id: 'salary', label: 'Salary PL', count: salaryCount, emoji: '💼' },
                    { id: 'instant', label: 'Instant PL', count: instantCount, emoji: '⚡' },
                    { id: 'business', label: 'Business Loans', count: businessCount, emoji: '🏢' }
                  ];

                  return (
                    <div style={{ display: 'grid', gap: '24px' }}>
                      {/* Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>🏦 Bank & NBFC Policies</h3>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                            Manage lender eligibility criteria — CIBIL, salary, FOIR, age, PF, pincodes and more
                          </p>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleOpenAddPolicy}
                          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add New Policy
                        </button>
                      </div>

                      {/* Sub-tabs for filtering category */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {subTabs.map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => setActivePolicyCategory(subTab.id)}
                            className="btn btn-sm"
                            style={{
                              margin: 0,
                              padding: '6px 12px',
                              fontSize: 'var(--text-xs)',
                              background: activePolicyCategory === subTab.id ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                              color: activePolicyCategory === subTab.id ? '#fff' : 'var(--color-text-secondary)',
                              border: activePolicyCategory === subTab.id ? 'none' : 'var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>{subTab.emoji}</span>
                            {subTab.label}
                            <span style={{
                              background: activePolicyCategory === subTab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              color: '#fff',
                              marginLeft: '2px'
                            }}>
                              {subTab.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Policies Table */}
                      {displayPolicies.length === 0 ? (
                        <div className="form-card" style={{ padding: '48px 24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏦</div>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No policies found in this category.</p>
                          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>Click &quot;Add New Policy&quot; to define a criteria for this category.</p>
                        </div>
                      ) : (
                        <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                              <thead>
                                <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Bank / NBFC</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Type</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Emp. Type</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Min Salary (₹)</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Min CIBIL</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Max FOIR %</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Age Range</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Pincodes</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayPolicies.map((policy) => (
                                  <tr key={policy.id} style={{ borderBottom: 'var(--border-subtle)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <td data-label="Bank" style={{ padding: '12px 10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BankLogo bankName={policy.bank_name} logoUrl={policy.logo_url} size={20} />
                                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{policy.bank_name}</span>
                                      </div>
                                    </td>
                                    <td data-label="Type" style={{ padding: '12px 10px' }}>
                                      <span className={`badge ${policy.loan_type === 'PL' ? 'badge-primary' : 'badge-info'}`}>
                                        {policy.loan_type === 'PL' ? '💳 Personal' : '💼 Business'}
                                      </span>
                                    </td>
                                    <td data-label="Emp. Type" style={{ padding: '12px 10px' }}>
                                      <span className="badge" style={{
                                        background: policy.employment_type === 'self_employed' ? 'rgba(16, 185, 129, 0.15)' : policy.employment_type === 'both' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                        color: policy.employment_type === 'self_employed' ? '#10b981' : policy.employment_type === 'both' ? '#f59e0b' : '#6366f1',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        fontSize: '10px'
                                      }}>
                                        {policy.employment_type === 'self_employed' ? '🏢 Self Emp' : policy.employment_type === 'both' ? '🔄 Both' : '💼 Salaried'}
                                      </span>
                                    </td>
                                    <td data-label="Min Salary" style={{ padding: '12px 10px', fontWeight: 500 }}>
                                      ₹{Number(policy.min_salary).toLocaleString('en-IN')}
                                    </td>
                                    <td data-label="Min CIBIL" style={{ padding: '12px 10px', fontWeight: 500 }}>
                                      {policy.min_cibil}+
                                    </td>
                                    <td data-label="Max FOIR" style={{ padding: '12px 10px', fontWeight: 500 }}>
                                      {policy.foir_max}%
                                    </td>
                                    <td data-label="Age Range" style={{ padding: '12px 10px' }}>
                                      {policy.min_age}–{policy.max_age} yrs
                                    </td>
                                    <td data-label="Pincodes" style={{ padding: '12px 10px' }}>
                                      {policy.all_pincodes ? (
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '11px' }}>🌍 All India</span>
                                      ) : (
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '11px' }}>📍 Limited</span>
                                      )}
                                    </td>
                                    <td data-label="Actions" style={{ padding: '12px 10px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <button
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '5px 12px', fontSize: '11px' }}
                                          onClick={() => handleOpenEditPolicy(policy)}
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          className="btn btn-sm"
                                          style={{ padding: '5px 12px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.25)' }}
                                          onClick={() => handleDeletePolicy(policy.id)}
                                          disabled={agentActionLoading === 'deleting-policy'}
                                        >
                                          🗑️ Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* PANEL 8: CONTACT MESSAGES */}
                {activeTab === 'contacts' && (
                  <div className="form-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Contact Inquiries</h3>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Manage messages and inquiries sent by visitors via the Contact Us homepage form.
                        </p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="🔍 Search messages by sender, email, subject, or content..."
                        value={contactSearch || ''}
                        onChange={(e) => setContactSearch(e.target.value)}
                      />
                    </div>

                    {/* Messages Table */}
                    {contactMessages.filter((msg) => {
                      const query = (contactSearch || '').toLowerCase();
                      return (
                        msg.name?.toLowerCase().includes(query) ||
                        msg.email?.toLowerCase().includes(query) ||
                        msg.subject?.toLowerCase().includes(query) ||
                        msg.message?.toLowerCase().includes(query)
                      );
                    }).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No contact messages found.
                      </div>
                    ) : (
                      <div className="table-scroll-x" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--color-text-secondary)' }}>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sender Info</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Subject</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Message Snippet</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Submitted On</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contactMessages.filter((msg) => {
                              const query = (contactSearch || '').toLowerCase();
                              return (
                                msg.name?.toLowerCase().includes(query) ||
                                msg.email?.toLowerCase().includes(query) ||
                                msg.mobile?.toLowerCase().includes(query) ||
                                msg.subject?.toLowerCase().includes(query) ||
                                msg.message?.toLowerCase().includes(query)
                              );
                            }).map((msg) => (
                              <tr key={msg.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                <td style={{ padding: '16px' }}>
                                  <div style={{ fontWeight: 600 }}>{msg.name}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                    <a href={`mailto:${msg.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'var(--text-xs)' }}>{msg.email}</a>
                                    {msg.mobile && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>📱 {msg.mobile}</span>}
                                  </div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: 500 }}>
                                  {msg.subject || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No Subject</span>}
                                </td>
                                <td style={{ padding: '16px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {msg.message}
                                </td>
                                <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>
                                  {new Date(msg.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={() => setSelectedMessage(msg)}
                                      style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                                    >
                                      View details
                                    </button>
                                    <button
                                      className="btn btn-danger btn-xs"
                                      onClick={() => deleteContactMessage(msg.id)}
                                      disabled={messageActionLoading}
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '11px',
                                        borderRadius: '6px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444'
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                 {/* PANEL 11: AUDIT LOGS */}
                 {activeTab === 'audit_logs' && (
                   <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                       <div>
                         <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>📋 Administrative Audit Logs</h3>
                         <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                           Chronological list of all actions performed by administrators in the control room panel.
                         </p>
                       </div>
                       <div>
                         <button onClick={fetchAuditLogs} className="btn btn-secondary btn-sm" disabled={loadingAuditLogs}>
                           {loadingAuditLogs ? 'Refreshing...' : '🔄 Refresh Logs'}
                         </button>
                       </div>
                     </div>

                     {/* Search logs bar */}
                     <div style={{ marginBottom: '20px' }}>
                       <input
                         type="text"
                         className="input-field"
                         placeholder="Search logs by action, admin email, or specific details..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         style={{ width: '100%', maxWidth: '400px' }}
                       />
                     </div>

                     {auditLogs.length === 0 ? (
                       <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                         No administrative actions recorded yet.
                       </div>
                     ) : (
                       <div className="table-scroll-x" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                         <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                           <thead>
                             <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                               <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Timestamp</th>
                               <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Admin Email</th>
                               <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Action</th>
                               <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Details</th>
                             </tr>
                           </thead>
                           <tbody>
                             {auditLogs.filter(log => {
                               const query = searchTerm.toLowerCase();
                               return (
                                 log.admin_email?.toLowerCase().includes(query) ||
                                 log.action?.toLowerCase().includes(query) ||
                                 log.details?.toLowerCase().includes(query)
                               );
                             }).map(log => (
                               <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                 <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                   {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                 </td>
                                 <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                   {log.admin_email}
                                 </td>
                                 <td style={{ padding: '12px 16px' }}>
                                   <span style={{
                                     padding: '4px 8px',
                                     borderRadius: '4px',
                                     fontSize: '11px',
                                     fontWeight: 600,
                                     background: log.action?.includes('Approve') || log.action?.includes('promote') ? 'rgba(16, 185, 129, 0.1)' : 
                                                 log.action?.includes('Reject') || log.action?.includes('Demote') || log.action?.includes('Delete') ? 'rgba(239, 68, 68, 0.1)' : 
                                                 'rgba(99, 102, 241, 0.1)',
                                     color: log.action?.includes('Approve') || log.action?.includes('promote') ? 'var(--color-success)' :
                                            log.action?.includes('Reject') || log.action?.includes('Demote') || log.action?.includes('Delete') ? '#ef4444' :
                                            'var(--color-primary)',
                                     border: log.action?.includes('Approve') || log.action?.includes('promote') ? '1px solid rgba(16, 185, 129, 0.2)' :
                                             log.action?.includes('Reject') || log.action?.includes('Demote') || log.action?.includes('Delete') ? '1px solid rgba(239, 68, 68, 0.2)' :
                                             '1px solid rgba(99, 102, 241, 0.2)'
                                   }}>
                                     {log.action}
                                   </span>
                                 </td>
                                 <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                   {log.details}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>
          </>
            )}
          </div>
        </section>
      </main>

      {/* Contact Message Detail Modal */}
      {selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          overflowY: 'auto',
          padding: '40px 16px',
          zIndex: 99999
        }} onClick={() => setSelectedMessage(null)}>
          <div className="modal-drawer" style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-accent)',
            borderRadius: 'var(--border-radius-xl)',
            width: '100%',
            maxWidth: 'min(600px, 96vw)',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            margin: '0 auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <span className="badge badge-primary" style={{ background: 'var(--gradient-primary)', color: '#ffffff !important' }}>Contact Query</span>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                  {selectedMessage.subject || '(No Subject)'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-light)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>{selectedMessage.name}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-light)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', marginTop: '4px' }}>
                    <a href={`mailto:${selectedMessage.email}`} style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
                      {selectedMessage.email}
                    </a>
                  </div>
                </div>
                {selectedMessage.mobile && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-light)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                      <a href={`tel:+91${selectedMessage.mobile}`} style={{ textDecoration: 'none', color: 'var(--color-text-primary)' }}>
                        {selectedMessage.mobile}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-light)' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Submitted On</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                  {new Date(selectedMessage.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '8px', border: 'var(--border-light)', minHeight: '120px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Message Body</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedMessage(null)}
                  style={{ padding: '10px 20px', borderRadius: '8px' }}
                >
                  Close Window
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    deleteContactMessage(selectedMessage.id);
                  }}
                  disabled={messageActionLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#ffffff'
                  }}
                >
                  Delete Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setSelectedInquiry(null)}>
          <div style={{
            width: '100%',
            maxWidth: 'min(550px, 96vw)',
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
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Date of Birth</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedInquiry.dob || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Calculated Age</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {selectedInquiry.dob ? (() => {
                      const today = new Date();
                      const birthDate = new Date(selectedInquiry.dob);
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return `${age} years`;
                    })() : 'N/A'}
                  </div>
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
                        <BankLogo bankName={bank} logoUrl={getBankLogo(bank)} size={16} />
                        {bank}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>No matching lenders for this inquiry.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '12px', paddingTop: '24px', borderTop: 'var(--border-subtle)' }}>
              <button
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete the inquiry for "${selectedInquiry.name}"? This action cannot be undone.`)) {
                    try {
                      const { error } = await supabase
                        .from('user_inquiries')
                        .delete()
                        .eq('id', selectedInquiry.id);
                      if (error) {
                        alert('Error deleting inquiry: ' + error.message);
                      } else {
                        alert('Inquiry deleted successfully!');
                        setSelectedInquiry(null);
                        fetchInquiries();
                      }
                    } catch (err) {
                      console.error(err);
                      alert('An unexpected error occurred.');
                    }
                  }
                }}
                className="btn"
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-error)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-error)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = 'var(--color-error)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Inquiry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bank Policy Edit/Add Modal with Pincode Sub-Management */}
      {isPolicyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          overflowY: 'auto',
          padding: '40px 20px',
          WebkitOverflowScrolling: 'touch'
        }} onClick={() => setIsPolicyModalOpen(false)}>
          <div style={{
            width: '100%',
            maxWidth: policyForm.all_pincodes ? 'min(600px, 96vw)' : 'min(1100px, 96vw)',
            background: 'var(--color-bg-secondary)',
            border: 'var(--border-light)',
            borderRadius: 'var(--border-radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            padding: '32px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            transition: 'max-width var(--transition-base)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                  {selectedPolicy ? 'Edit Bank Policy & Criteria' : 'Define New Bank Policy'}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  Configure lending criteria and geographical coverage settings
                </p>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
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

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: '32px',
              alignItems: 'start'
            }} className={!policyForm.all_pincodes ? 'responsive-grid-2' : ''}>
              
              {/* Left Column: Form Fields */}
              <form onSubmit={handleSavePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Bank/NBFC Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g. SBI, AXIS, HDFC"
                      value={policyForm.bank_name}
                      onChange={(e) => setPolicyForm({ ...policyForm, bank_name: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Loan Type</label>
                    <select
                      className="input-field"
                      value={policyForm.loan_type}
                      onChange={(e) => setPolicyForm({ ...policyForm, loan_type: e.target.value })}
                    >
                      <option value="PL">Personal Loan (PL)</option>
                      <option value="BL">Business Loan (BL)</option>
                    </select>
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Employment Type</label>
                    <select
                      className="input-field"
                      value={policyForm.employment_type || 'salaried'}
                      onChange={(e) => setPolicyForm({ ...policyForm, employment_type: e.target.value })}
                    >
                      <option value="salaried">💼 Salaried Only</option>
                      <option value="self_employed">🏢 Self Employed Only</option>
                      <option value="both">🔄 Both (Salaried & Self Employed)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Policy Category</label>
                    <select
                      className="input-field"
                      value={policyForm.policy_category || 'salary'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const inferredLoanType = val === 'business' ? 'BL' : 'PL';
                        const inferredEmpType = val === 'salary' ? 'salaried' : (val === 'instant' ? 'self_employed' : 'self_employed');
                        setPolicyForm({ 
                          ...policyForm, 
                          policy_category: val,
                          loan_type: inferredLoanType,
                          employment_type: inferredEmpType
                        });
                      }}
                    >
                      <option value="salary">Salary PL</option>
                      <option value="instant">Instant PL</option>
                      <option value="business">Business Loans</option>
                    </select>
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min Monthly Salary (₹)</label>
                    <input 
                      type="number"
                      className="input-field"
                      required
                      min="0"
                      value={policyForm.min_salary}
                      onChange={(e) => setPolicyForm({ ...policyForm, min_salary: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min CIBIL Score</label>
                    <input 
                      type="number"
                      className="input-field"
                      required
                      min="300"
                      max="900"
                      value={policyForm.min_cibil}
                      onChange={(e) => setPolicyForm({ ...policyForm, min_cibil: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Max FOIR Ratio (%)</label>
                    <input 
                      type="number"
                      className="input-field"
                      required
                      min="0"
                      max="100"
                      value={policyForm.foir_max}
                      onChange={(e) => setPolicyForm({ ...policyForm, foir_max: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>PF Contribution Required?</label>
                    <select
                      className="input-field"
                      value={policyForm.pf_required}
                      onChange={(e) => setPolicyForm({ ...policyForm, pf_required: e.target.value })}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Min Age (Years)</label>
                    <input 
                      type="number"
                      className="input-field"
                      required
                      min="18"
                      value={policyForm.min_age}
                      onChange={(e) => setPolicyForm({ ...policyForm, min_age: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Max Age (Years)</label>
                    <input 
                      type="number"
                      className="input-field"
                      required
                      min="18"
                      value={policyForm.max_age}
                      onChange={(e) => setPolicyForm({ ...policyForm, max_age: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '12px', border: 'var(--border-subtle)', marginBottom: '4px' }}>
                  <input 
                    type="checkbox"
                    id="direct_submit_checkbox"
                    checked={policyForm.direct_submit}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPolicyForm({ 
                        ...policyForm, 
                        direct_submit: checked,
                        apply_url: checked ? '' : policyForm.apply_url
                      });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="direct_submit_checkbox" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    📥 Direct Submit to Admin (Admin will apply on behalf of Agent)
                  </label>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Bank Logo URL</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. /logos/sbi.png (Optional)"
                      value={policyForm.logo_url}
                      onChange={(e) => setPolicyForm({ ...policyForm, logo_url: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Apply Link (URL) {policyForm.direct_submit && <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>(Disabled via Direct Submit)</span>}
                    </label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. https://apply.bank.com/portal"
                      disabled={policyForm.direct_submit}
                      value={policyForm.apply_url}
                      onChange={(e) => setPolicyForm({ ...policyForm, apply_url: e.target.value })}
                      style={{ opacity: policyForm.direct_submit ? 0.5 : 1 }}
                    />
                  </div>
                </div>

                <div className="responsive-grid-2" style={{ gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Portal Login ID / Username (For Agent Portal)</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. incredhtoh@gmail.com (Optional)"
                      value={policyForm.portal_username}
                      onChange={(e) => setPolicyForm({ ...policyForm, portal_username: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Portal Login Password / OTP Contact</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. Password or 'OTP Support: 9389119399' (Optional)"
                      value={policyForm.portal_password}
                      onChange={(e) => setPolicyForm({ ...policyForm, portal_password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Special Credit Policies Notes</label>
                  <textarea 
                    className="input-field"
                    placeholder="Provide any additional rules (e.g. Salary account with same bank required)"
                    rows="3"
                    value={policyForm.special_notes}
                    onChange={(e) => setPolicyForm({ ...policyForm, special_notes: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-card)', padding: '12px 16px', borderRadius: '12px', border: 'var(--border-subtle)' }}>
                  <input 
                    type="checkbox"
                    id="all_pincodes_checkbox"
                    checked={policyForm.all_pincodes}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPolicyForm({ ...policyForm, all_pincodes: checked });
                      if (!checked && (policyForm.bank_name || selectedPolicy?.bank_name)) {
                        fetchBankPincodes(policyForm.bank_name || selectedPolicy?.bank_name || '');
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="all_pincodes_checkbox" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                    🌍 Serves all Pincodes in India (No mapping needed)
                  </label>
                </div>

                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px 28px', justifyContent: 'center', marginTop: '8px' }}
                  disabled={agentActionLoading === 'saving-policy'}
                >
                  {agentActionLoading === 'saving-policy' ? 'Saving Policy...' : 'Save Bank Policy'}
                </button>
              </form>

              {/* Right Column: Pincode Management (Only when all_pincodes is false) */}
              {!policyForm.all_pincodes && (() => {
                const filteredPincodes = bankPincodes.filter(pin => 
                  pin.pincode.includes(pincodeSearchTerm.trim())
                );
                return (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    background: 'var(--color-bg-card)',
                    border: 'var(--border-light)',
                    borderRadius: '16px',
                    padding: '24px',
                    height: '100%',
                    maxHeight: '680px',
                    minWidth: '320px'
                  }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📍 Serviced Pincodes ({filteredPincodes.length} / {bankPincodes.length})
                    </h4>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="Enter pincode (e.g. 110001) or comma separated"
                        value={newPincodeText}
                        onChange={(e) => setNewPincodeText(e.target.value)}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={handleAddBankPincodes}
                        disabled={pincodeActionLoading === 'adding'}
                        style={{ padding: '0 16px' }}
                      >
                        {pincodeActionLoading === 'adding' ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    <input
                      type="text"
                      className="input-field"
                      placeholder="🔍 Search mapped pincodes..."
                      value={pincodeSearchTerm}
                      onChange={(e) => setPincodeSearchTerm(e.target.value)}
                      style={{ fontSize: 'var(--text-xs)', padding: '8px 12px' }}
                    />

                    {filteredPincodes.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={filteredPincodes.length > 0 && filteredPincodes.every(pin => selectedPincodeIds.includes(pin.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allFilteredIds = filteredPincodes.map(pin => pin.id);
                                setSelectedPincodeIds(prev => [...new Set([...prev, ...allFilteredIds])]);
                              } else {
                                const filteredIdsSet = new Set(filteredPincodes.map(pin => pin.id));
                                setSelectedPincodeIds(prev => prev.filter(id => !filteredIdsSet.has(id)));
                              }
                            }}
                          />
                          Select All
                        </label>
                        {selectedPincodeIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleBulkDeletePincodes}
                            className="btn btn-sm"
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              color: 'var(--color-error)', 
                              border: '1px solid rgba(239, 68, 68, 0.25)', 
                              padding: '2px 8px', 
                              fontSize: '10px', 
                              fontWeight: 600,
                              borderRadius: '4px'
                            }}
                            disabled={pincodeActionLoading === 'bulk-deleting'}
                          >
                            🗑️ Delete Selected ({selectedPincodeIds.length})
                          </button>
                        )}
                      </div>
                    )}

                    <div style={{ 
                      overflowY: 'auto', 
                      flex: 1, 
                      border: 'var(--border-subtle)', 
                      borderRadius: '12px',
                      background: 'var(--color-bg-input)',
                      padding: '8px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '8px',
                      alignContent: 'start',
                      minHeight: '200px',
                      maxHeight: '400px'
                    }}>
                      {filteredPincodes.length === 0 ? (
                        <div style={{ 
                          gridColumn: '1 / -1', 
                          padding: '32px 16px', 
                          textAlign: 'center', 
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--text-xs)'
                        }}>
                          {bankPincodes.length === 0 ? 'No pincodes mapped.' : 'No matching pincodes found.'}
                        </div>
                      ) : (
                        filteredPincodes.map((pin) => (
                          <div 
                            key={pin.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              background: 'var(--color-bg-card)',
                              border: selectedPincodeIds.includes(pin.id) ? '1px solid rgba(239, 68, 68, 0.5)' : 'var(--border-light)',
                              borderRadius: '8px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPincodeIds.includes(pin.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPincodeIds(prev => [...prev, pin.id]);
                                } else {
                                  setSelectedPincodeIds(prev => prev.filter(id => id !== pin.id));
                                }
                              }}
                              style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                            />
                            <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>{pin.pincode}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBankPincode(pin.id)}
                              disabled={pincodeActionLoading === pin.id}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-error)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                padding: '0 2px'
                              }}
                              title="Remove pincode serviceability"
                            >
                              ✕
                            </button>
                        </div>
                      ))
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
                    * Pincodes added here map mapping links directly in the serviceable regions list for eligibility matching.
                  </p>
                </div>
              )})()}

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
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => handleSelectAgent(null)}>
          <div style={{
            width: '100%',
            maxWidth: 'min(650px, 96vw)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditingAgent ? (
                  <>
                    <button
                      onClick={handleSaveAgentProfile}
                      disabled={agentActionLoading === selectedAgent.id}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 14px' }}
                    >
                      {agentActionLoading === selectedAgent.id ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAgent(false);
                        setEditAgentData({ ...selectedAgent });
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 14px' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingAgent(true);
                      setEditAgentData({ ...selectedAgent });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 14px' }}
                  >
                    Edit Profile
                  </button>
                )}
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
            </div>

            {/* Avatar Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--color-bg-card)', padding: '16px', borderRadius: '8px', border: 'var(--border-subtle)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', border: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedAgent.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
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
              {isEditingAgent ? (
                <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Agent Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.full_name || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Email Address</label>
                    <input 
                      type="email"
                      className="input-field"
                      value={editAgentData.email || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Phone Number</label>
                    <input 
                      type="text"
                      className="input-field"
                      maxLength={10}
                      value={editAgentData.phone || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sub-Agent Count</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-info)', marginTop: '8px' }}>{selectedAgentSubAgents.length}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Date of Birth</label>
                    <input 
                      type="date"
                      className="input-field"
                      value={editAgentData.dob || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, dob: e.target.value })}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Calculated Age</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '8px' }}>
                      {editAgentData.dob ? (new Date().getFullYear() - new Date(editAgentData.dob).getFullYear()) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Father&apos;s Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.fathers_name || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, fathers_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Marital Status</label>
                    <select
                      className="input-field"
                      value={editAgentData.marital_status || 'Single'}
                      onChange={(e) => setEditAgentData({ ...editAgentData, marital_status: e.target.value })}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="span-2-desktop">
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Current Address</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.current_address || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, current_address: e.target.value })}
                    />
                  </div>
                  <div className="span-2-desktop">
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Permanent Address</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.permanent_address || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, permanent_address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Pincode</label>
                    <input 
                      type="text"
                      className="input-field"
                      maxLength={6}
                      placeholder="6 digit pincode"
                      value={editAgentData.pincode || ''}
                      onChange={(e) => handleAgentPincodeChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>City & State</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.city ? `${editAgentData.city}, ${editAgentData.state || ''}` : editAgentData.state || ''}
                      disabled
                      placeholder="Auto-filled from Pincode"
                    />
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {/* Identity Details */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Identity Verification</h4>
              {isEditingAgent ? (
                <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Identity Proof Type</label>
                    <select
                      className="input-field"
                      value={editAgentData.id_type || 'PAN Card'}
                      onChange={(e) => setEditAgentData({ ...editAgentData, id_type: e.target.value })}
                    >
                      <option value="PAN Card">PAN Card</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID Card">Voter ID Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Identity ID Number</label>
                    <input 
                      type="text"
                      className="input-field"
                      maxLength={12}
                      value={editAgentData.id_number || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, id_number: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
                    />
                  </div>
                </div>
              ) : (
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          View / Download Identity Proof PDF
                        </a>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={selectedAgent.id_file} alt="ID Verification" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: 'var(--border-light)' }} />
                      )
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No document uploaded</span>
                    )}
                  </div>
                </div>
              )}
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

            {/* Recruited Sub-Agents */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Recruited Sub-Agents ({selectedAgentSubAgents.length})</h4>
              {selectedAgentSubAgents.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No sub-agents recruited.</p>
              ) : (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedAgentSubAgents.map(sa => (
                    <div key={sa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: '6px', border: 'var(--border-subtle)' }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{sa.full_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Code: {sa.agent_code || 'PENDING'} | Phone: {sa.phone || 'N/A'} | Email: {sa.email}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                          Joined: {new Date(sa.created_at).toLocaleDateString('en-IN')} {sa.city && sa.state ? `| Location: ${sa.city}, ${sa.state}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span className="badge" style={{ 
                          color: sa.approved ? 'var(--color-success)' : 'var(--color-warning)', 
                          background: sa.approved ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', 
                          border: sa.approved ? 'var(--border-success)' : 'var(--border-warning)',
                          fontSize: '9px', 
                          padding: '2px 6px' 
                        }}>
                          {sa.approved ? 'Active' : 'Pending'}
                        </span>
                        <button
                          onClick={() => handleSelectAgent(sa)}
                          className="btn btn-secondary btn-sm"
                          style={{ margin: 0, padding: '4px 8px', fontSize: '9px' }}
                        >
                          Inspect 👁️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{app.client_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{app.bank_name} | ₹{Number(app.loan_amount).toLocaleString('en-IN')}</div>
                        {app.problem && (
                          <div style={{ 
                            fontSize: '9px', 
                            color: 'var(--color-error)', 
                            marginTop: '4px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            borderLeft: '2px solid var(--color-error)',
                            wordBreak: 'break-word'
                          }}>
                            ⚠️ {app.problem}
                          </div>
                        )}
                      </div>
                      <span className="badge" style={{ ...getStatusBadgeStyle(app.status), fontSize: '9px', padding: '2px 6px', flexShrink: 0 }}>{app.status}</span>
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

      {/* Client Application Detail Inspector Drawer */}
      {selectedApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setSelectedApplication(null)}>
          <div style={{
            width: '100%',
            maxWidth: 'min(600px, 96vw)',
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>Inspect Client Application</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>App ID: <strong style={{ color: 'var(--color-primary)', fontFamily: 'monospace' }}>{selectedApplication.application_id || 'N/A'}</strong> | DB ID: #{selectedApplication.id} | Submitted {new Date(selectedApplication.created_at).toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
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

            {/* Client Info Card */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Client Profile</h4>
              <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Client Name</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedApplication.client_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Mobile Number</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedApplication.client_mobile}</div>
                </div>
              </div>
            </div>

            {/* Submitting Agent/Customer Info */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                {selectedApplication.agent?.role === 'user' ? 'Submitting Customer' : 'Submitting Agent'}
              </h4>
              <div className="form-card" style={{ padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                {selectedApplication.agent ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        {selectedApplication.agent?.role === 'user' ? 'Customer Name' : 'Agent Name'}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedApplication.agent.full_name}</div>
                    </div>
                    {selectedApplication.agent?.role !== 'user' && (
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Agent Code</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>{selectedApplication.agent.agent_code}</div>
                      </div>
                    )}
                    <div className={selectedApplication.agent?.role === 'user' ? "" : "span-2-desktop"}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                        {selectedApplication.agent?.role === 'user' ? 'Customer Email' : 'Agent Email'}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{selectedApplication.agent.email}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Deleted Agent (No agent profile matches this code)</div>
                )}
              </div>
            </div>

            {/* Bank & Loan details */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Bank & Loan Details</h4>
              <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Lender / Bank</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <BankLogo bankName={selectedApplication.bank_name} logoUrl={getBankLogo(selectedApplication.bank_name)} size={18} />
                    {selectedApplication.bank_name}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Loan Category</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {(() => {
                      if (selectedApplication.loan_type === 'BL') return 'Business Loan';
                      const name = (selectedApplication.bank_name || '').toLowerCase();
                      if (name.includes('instant')) return 'Instant PL';
                      return 'Salary PL';
                    })()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Loan Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>₹{Number(selectedApplication.loan_amount).toLocaleString('en-IN')}</div>
                </div>
                {selectedApplication.agent?.role !== 'user' && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Payout Commission (2%)</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-accent-violet)' }}>₹{Number(selectedApplication.commission_amount).toLocaleString('en-IN')}</div>
                  </div>
                )}
                {selectedApplication.disbursed_at && (
                  <div className="span-2-desktop">
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Disbursed Date</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-success)' }}>
                      {new Date(selectedApplication.disbursed_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lender Portal & Credentials for Admin */}
            {(() => {
              const matchedPolicy = policies.find(p => p.bank_name.toUpperCase().replace(/\(BL\)/g, '').trim() === selectedApplication.bank_name?.toUpperCase().replace(/\(BL\)/g, '').trim());
              if (!matchedPolicy) return null;
              
              const applyLink = matchedPolicy.apply_url || '';
              const isFinnable = selectedApplication.bank_name?.toUpperCase()?.includes('FINNABLE');
              const isIncred = selectedApplication.bank_name?.toUpperCase()?.includes('INCRED');
              
              let username = matchedPolicy.portal_username || '';
              let password = matchedPolicy.portal_password || '';
              
              if (!username && isFinnable) username = '9389119399';
              if (!password && isFinnable) password = 'Call 9389119399 (OTP Support)';
              if (!username && isIncred) username = 'incredhtoh@gmail.com';
              if (!password && isIncred) password = 'Call & Message on WhatsApp to 9389119399 (OTP Support)';
              
              const hasCredentials = username || password || applyLink;
              
              if (!hasCredentials) return null;
              
              return (
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Lender Portal & Credentials</h4>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-primary)' }}>🔗 {selectedApplication.bank_name} Partner Portal</div>
                    
                    {matchedPolicy.direct_submit && (
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                        📥 <strong>Direct Submission Force Enabled</strong>: The agent submitted this client directly. You must log in and submit it on the partner portal below.
                      </div>
                    )}
                    
                    {(username || password) && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: 'var(--border-subtle)',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                        display: 'grid',
                        gap: '6px'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>🔑 Login Credentials for Portal:</div>
                        {username && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>• <strong>Username / ID:</strong> {username}</span>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(username); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                          </div>
                        )}
                        {password && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>• <strong>Password / OTP:</strong> {password}</span>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(password); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {applyLink && (
                      <a
                        href={applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          padding: '10px 16px',
                          marginTop: '4px'
                        }}
                      >
                        🚀 Open Bank Partner Portal ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Status & Problem updates */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Application Status Controls</h4>
              <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--color-bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Current Status</div>
                    <span className="badge" style={{ ...getStatusBadgeStyle(selectedApplication.status), margin: 0, fontSize: '12px', padding: '6px 14px' }}>
                      {selectedApplication.status || 'applied'}
                    </span>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Update Status
                    </label>
                    <select
                      disabled={updatingAppId === selectedApplication.id}
                      value={selectedApplication.status ? selectedApplication.status.toLowerCase() : 'applied'}
                      onChange={(e) => handleUpdateStatus(selectedApplication.id, e.target.value)}
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: 'var(--border-light)',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: 'var(--text-sm)',
                        outline: 'none',
                        cursor: 'pointer',
                        minWidth: '160px'
                      }}
                    >
                      <option value="applied">Applied</option>
                      <option value="in process">In Process</option>
                      <option value="kyc verification">KYC Waiting</option>
                      <option value="disbursed">Disbursed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Problems or notes update option */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Reported Issues / Status Notes
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <textarea
                      placeholder="Specify reason for rejection or details about current processing issue..."
                      value={selectedApplication.problem || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedApplication(prev => prev ? { ...prev, problem: val } : null);
                      }}
                      className="input-field"
                      rows={3}
                      style={{
                        flex: 1,
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
                  </div>
                  <button
                    onClick={async () => {
                      setUpdatingAppId(selectedApplication.id);
                      try {
                        const { error } = await supabase
                          .from('applications')
                          .update({ problem: selectedApplication.problem || null })
                          .eq('id', selectedApplication.id);
                        if (error) {
                          alert('Failed to save issue details: ' + error.message);
                        } else {
                          alert('Issue details successfully updated!');
                          await fetchApplications();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUpdatingAppId(null);
                      }
                    }}
                    disabled={updatingAppId === selectedApplication.id}
                    className="btn btn-primary btn-sm"
                    style={{
                      margin: '4px 0 0 auto',
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
                    💾 Save Status Notes
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: 'var(--border-subtle)' }}>
              <button
                onClick={() => handleDeleteApplication(selectedApplication.id)}
                disabled={deletingAppId === selectedApplication.id}
                className="btn"
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-error)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-error)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = 'var(--color-error)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Client Application
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
