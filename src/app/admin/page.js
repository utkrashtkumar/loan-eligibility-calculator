'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, Legend, PieChart, Pie 
} from 'recharts';

function ExpirationTimer({ createdAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const createdTime = new Date(createdAt).getTime();
      const expireTime = createdTime + 14 * 24 * 60 * 60 * 1000;
      const diff = expireTime - Date.now();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      setTimeLeft(`Expires in: ${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.15)', display: 'inline-flex', alignItems: 'center' }}>
      ⏱️ {timeLeft}
    </span>
  );
}

const getExpirationCountdown = (createdAt) => {
  const createdTime = new Date(createdAt).getTime();
  const expireTime = createdTime + 14 * 24 * 60 * 60 * 1000;
  const timeLeft = expireTime - Date.now();

  if (timeLeft <= 0) return 'Expired';

  const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 1) {
    return `${days} days left`;
  } else if (days === 1) {
    return `1 day, ${hours}h left`;
  } else if (hours > 0) {
    return `${hours}h, ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
};

// Helper functions to keep component pure and avoid calling impure functions during render
const getFourteenDaysAgoString = () => new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const generateRandomAgentCode = () => `H2H-${Math.floor(1000 + Math.random() * 9000)}`;
const generateUpdateFileName = (ext) => `update-${Date.now()}.${ext}`;
const generateBlogFileName = (ext) => `blog-${Date.now()}.${ext}`;

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [isMobileTabSelectOpen, setIsMobileTabSelectOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
  const [normalUsers, setNormalUsers] = useState([]);
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
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // Agent profile editing state
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editAgentData, setEditAgentData] = useState(null);

  // Regen request management state
  const [regenRequests, setRegenRequests] = useState([]); // all pending regen requests
  const [regenAdminNote, setRegenAdminNote] = useState('');
  const [regenActionLoading, setRegenActionLoading] = useState(null); // request id being actioned

  // Activity notifications state
  const [dbNotifications, setDbNotifications] = useState([]);
  const [notificationActionLoading, setNotificationActionLoading] = useState(null);

  // Contact messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Feedbacks state
  const [siteFeedbacks, setSiteFeedbacks] = useState([]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackActionLoading, setFeedbackActionLoading] = useState(false);

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
    policy_category: 'salary',
    policy_pdf: ''
  });

  const [activePolicyCategory, setActivePolicyCategory] = useState('salary');

  // Pincode management state
  const [bankPincodes, setBankPincodes] = useState([]);

  // Agent Agreements Management State
  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [agreementSearch, setAgreementSearch] = useState('');
  const [agreementFilter, setAgreementFilter] = useState('all'); // 'all', 'active', 'revoked'
  const [revokingAgreement, setRevokingAgreement] = useState(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revokingLoading, setRevokingLoading] = useState(false);
  const [newPincodeText, setNewPincodeText] = useState('');
  const [pincodeActionLoading, setPincodeActionLoading] = useState(null);
  const [pincodeSearchTerm, setPincodeSearchTerm] = useState('');
  const [selectedPincodeIds, setSelectedPincodeIds] = useState([]);

  // Agent Updates (Image Board) State
  const [agentUpdates, setAgentUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Blogs Management State
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    published: false,
    author: 'Admin'
  });
  const [blogImageFile, setBlogImageFile] = useState(null);
  const [blogImagePreview, setBlogImagePreview] = useState('');
  const [blogUploading, setBlogUploading] = useState(false);
  const [blogError, setBlogError] = useState('');
  const [blogSuccess, setBlogSuccess] = useState('');

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    setProfileMsgText(agent?.profile_update_message || '');
    setIsEditingAgent(false);
    setEditAgentData(agent ? { ...agent } : null);
  };

  const exportToCSV = (data, filename, headers) => {
    if (!data || !data.length) {
      alert("No data available to export.");
      return;
    }
    const headerRow = Object.values(headers).join(",");
    const rows = data.map(item => {
      return Object.keys(headers).map(key => {
        let val = item[key];
        if (val === null || val === undefined) {
          val = "";
        } else {
          val = '"' + String(val).replace(/"/g, '""') + '"';
        }
        return val;
      }).join(",");
    });
    const csvContent = "\uFEFF" + [headerRow, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          id_number: editAgentData.id_number,
          id_type_2: editAgentData.id_type_2,
          id_number_2: editAgentData.id_number_2,
          bank_holder_name: editAgentData.bank_holder_name,
          bank_name: editAgentData.bank_name,
          bank_account_no: editAgentData.bank_account_no,
          bank_ifsc: editAgentData.bank_ifsc
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
      policy_category: activePolicyCategory,
      policy_pdf: ''
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
      policy_category: policy.policy_category || 'salary',
      policy_pdf: policy.policy_pdf || ''
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
        alert(`${duplicates.length} pincode(s) already exist for ${bankName}: ${duplicates.slice(0, 10).join(', ')}${duplicates.length > 10 ? '...' : ''}`);
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

  const fetchAgreementsData = async () => {
    setLoadingAgreements(true);
    try {
      const { data, error } = await supabase
        .from('agent_agreements')
        .select(`
          *,
          profiles:agent_id (
            full_name,
            phone,
            email
          )
        `)
        .order('signed_at', { ascending: false });

      if (error) {
        console.error('Error fetching agreements:', error.message);
      } else {
        setAgreements(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAgreements(false);
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

      // 4. Fetch Normal Users (registered users who are not demoted agents)
      const { data: normalU, error: normalUErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .is('demoted_at', null)
        .order('created_at', { ascending: false });

      if (normalUErr) console.error('Error fetching normal users:', normalUErr.message);
      else setNormalUsers(normalU || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegenRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('agreement_regen_requests')
        .select(`
          *,
          profiles:agent_id (
            full_name,
            email,
            phone,
            agent_code
          )
        `)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });
      if (!error) setRegenRequests(data || []);
    } catch (err) {
      console.error('Error fetching regen requests:', err);
    }
  };

  const fetchDbNotifications = async () => {
    try {
      // 1. Purge database notifications older than 14 days
      const fourteenDaysAgo = getFourteenDaysAgoString();
      await supabase.from('notifications').delete().lt('created_at', fourteenDaysAgo);

      // 2. Fetch active activity notifications
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:agent_id (
            id,
            full_name,
            email,
            agent_code
          )
        `)
        .order('created_at', { ascending: false });
      if (!error) {
        setDbNotifications(data || []);
      }
    } catch (err) {
      console.error('Error fetching db notifications:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    setNotificationActionLoading(id);
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        alert('Failed to delete notification: ' + error.message);
      } else {
        setDbNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setNotificationActionLoading(null);
    }
  };

  const handleFollowupNotification = async (notif) => {
    const type = notif.activity_type;
    const refId = notif.reference_id;

    if (!type || !refId) return;

    try {
      // 1. REGISTRATION
      if (type === 'registration') {
        let agent = pendingAgents.find(a => a.id === refId) || activeAgents.find(a => a.id === refId);
        if (!agent) {
          const { data } = await supabase.from('profiles').select('*').eq('id', refId).single();
          agent = data;
        }
        if (agent) {
          handleSelectAgent(agent);
          if (agent.approved) {
            setActiveTab('active_agents');
          } else {
            setActiveTab('pending_agents');
          }
        }
      } 
      // 2. APPLICATION
      else if (type === 'application') {
        let app = applications.find(a => a.id === refId);
        if (!app) {
          const { data } = await supabase.from('applications').select('*, agent:profiles(full_name, agent_code)').eq('id', refId).single();
          app = data;
        }
        if (app) {
          setSelectedApplication(app);
          setActiveTab('agent_applications');
        }
      } 
      // 3. PAYOUT
      else if (type === 'payout') {
        setActiveTab('payouts');
      } 
      // 4. AGREEMENT
      else if (type === 'agreement') {
        setActiveTab('agreements');
        let agent = activeAgents.find(a => a.id === refId) || pendingAgents.find(a => a.id === refId);
        if (agent) {
          setAgreementSearch(agent.full_name);
        }
      } 
      // 5. RESIGN
      else if (type === 'resign') {
        let agent = pendingAgents.find(a => a.id === refId) || activeAgents.find(a => a.id === refId);
        if (!agent) {
          const { data } = await supabase.from('profiles').select('*').eq('id', refId).single();
          agent = data;
        }
        if (agent) {
          handleSelectAgent(agent);
          setActiveTab('pending_agents');
        }
      }
    } catch (err) {
      console.error('Error running followup:', err);
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

  const handleExportApplicationsToExcel = async (appsToExport, isAgent = true) => {
    try {
      const XLSX = await import('xlsx');
      
      const formattedData = appsToExport.map(app => {
        const row = {
          "Application ID": app.application_id || 'N/A',
          "Client Name": app.client_name || '',
          "Client Mobile": app.client_mobile || '',
          "Bank Name": app.bank_name || '',
          "Loan Type": app.loan_type || '',
          "Loan Amount (Lakhs)": app.loan_amount || 0,
          "Submission Date": app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A',
          "Status": app.status || 'Applied',
        };

        if (isAgent) {
          row["Agent Name"] = app.agent?.full_name || 'Deleted Agent';
          row["Agent Email"] = app.agent?.email || '';
          row["Agent Code"] = app.agent?.agent_code || '';
        } else {
          row["Customer Name"] = app.agent?.full_name || 'Deleted Customer';
          row["Customer Email"] = app.agent?.email || '';
        }

        row["Issue/Problem"] = app.problem || '';
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, isAgent ? "Agent Applications" : "Customer Applications");
      
      const filename = isAgent 
        ? `Agent_Applications_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Customer_Applications_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Failed to export to Excel:", err);
      alert("Failed to export to Excel. Please check console for details.");
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

  const fetchSiteFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('site_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching feedbacks:', error.message);
      else setSiteFeedbacks(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSiteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    setFeedbackActionLoading(true);
    try {
      const { error } = await supabase
        .from('site_feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Feedback deleted successfully.');
      setSiteFeedbacks((prev) => prev.filter((fb) => fb.id !== id));
    } catch (err) {
      console.error('Error deleting feedback:', err.message);
      alert('Failed to delete feedback: ' + err.message);
    } finally {
      setFeedbackActionLoading(false);
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

  // ── Agent Updates functions ──────────────────────────────────────────────
  const fetchAgentUpdates = async () => {
    setUpdatesLoading(true);
    try {
      const fourteenDaysAgo = getFourteenDaysAgoString();
      
      // Fetch updates older than 14 days to delete their storage files
      const { data: oldUpdates } = await supabase
        .from('agent_updates')
        .select('id, image_url')
        .lt('created_at', fourteenDaysAgo);
        
      if (oldUpdates && oldUpdates.length > 0) {
        const fileNames = oldUpdates.map(u => u.image_url.split('/').pop().split('?')[0]);
        // Delete files from storage
        await supabase.storage.from('agent-updates').remove(fileNames);
        // Delete rows from database
        await supabase.from('agent_updates').delete().in('id', oldUpdates.map(u => u.id));
      }

      const { data, error } = await supabase
        .from('agent_updates')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setAgentUpdates(data || []);
    } catch (err) { console.error(err); }
    setUpdatesLoading(false);
  };

  const handleUploadUpdate = async () => {
    if (!uploadTitle.trim()) { setUploadError('Title is required.'); return; }
    if (!uploadFile) { setUploadError('Please select a file.'); return; }
    if (uploadFile.size > 5 * 1024 * 1024) { setUploadError('File must be under 5 MB.'); return; }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const ext = uploadFile.name.split('.').pop();
      const fileName = generateUpdateFileName(ext);
      const { error: storageError } = await supabase.storage
        .from('agent-updates')
        .upload(fileName, uploadFile, { cacheControl: '3600', upsert: false });
      if (storageError) throw storageError;
      const { data: urlData } = supabase.storage.from('agent-updates').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      const { error: dbError } = await supabase.from('agent_updates').insert([{
        title: uploadTitle.trim(),
        description: uploadDesc.trim(),
        image_url: publicUrl,
        category: uploadCategory,
        is_active: true
      }]);
      if (dbError) throw dbError;
      setUploadSuccess('Update uploaded successfully!');
      setUploadTitle('');
      setUploadDesc('');
      setUploadCategory('general');
      setUploadFile(null);
      setUploadPreview('');
      logAdminAction('Upload Agent Update', `Uploaded file: ${fileName} (${uploadCategory})`);
      await fetchAgentUpdates();
    } catch (err) {
      setUploadError('Upload failed: ' + (err.message || String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpdate = async (update) => {
    if (!window.confirm(`Delete "${update.title}"? This cannot be undone.`)) return;
    try {
      const fileName = update.image_url.split('/').pop().split('?')[0];
      await supabase.storage.from('agent-updates').remove([fileName]);
      await supabase.from('agent_updates').delete().eq('id', update.id);
      logAdminAction('Delete Agent Update', `Deleted update: ${update.title}`);
      await fetchAgentUpdates();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleToggleUpdate = async (update) => {
    try {
      await supabase.from('agent_updates')
        .update({ is_active: !update.is_active })
        .eq('id', update.id);
      logAdminAction('Toggle Agent Update', `Set update "${update.title}" active=${!update.is_active}`);
      await fetchAgentUpdates();
    } catch (err) {
      alert('Toggle failed: ' + err.message);
    }
  };

  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setBlogs(data || []);
    } catch (err) {
      console.error(err);
    }
    setBlogsLoading(false);
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    if (!blogForm.title.trim()) { setBlogError('Title is required.'); return; }
    if (!blogForm.excerpt.trim()) { setBlogError('Excerpt is required.'); return; }
    if (!blogForm.content.trim()) { setBlogError('Content is required.'); return; }

    setBlogUploading(true);
    setBlogError('');
    setBlogSuccess('');

    try {
      let finalCoverImage = selectedBlog ? selectedBlog.cover_image : '';

      // Upload cover image if a new file is attached
      if (blogImageFile) {
        const ext = blogImageFile.name.split('.').pop();
        const fileName = generateBlogFileName(ext);
        const { error: storageError } = await supabase.storage
          .from('agent-updates')
          .upload(fileName, blogImageFile, { cacheControl: '3600', upsert: false });
        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage.from('agent-updates').getPublicUrl(fileName);
        finalCoverImage = urlData.publicUrl;

        // If editing and previous image existed, clean it up
        if (selectedBlog && selectedBlog.cover_image && selectedBlog.cover_image.includes('/agent-updates/')) {
          const oldFileName = selectedBlog.cover_image.split('/').pop().split('?')[0];
          await supabase.storage.from('agent-updates').remove([oldFileName]);
        }
      }

      // Format Slug (lowercase alphanumeric and hyphens only)
      let slug = blogForm.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slug) {
        slug = blogForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      const blogPayload = {
        title: blogForm.title.trim(),
        slug,
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        cover_image: finalCoverImage,
        published: blogForm.published,
        author: blogForm.author.trim() || 'Admin',
        updated_at: new Date().toISOString()
      };

      if (selectedBlog) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(blogPayload)
          .eq('id', selectedBlog.id);
        if (error) throw error;
        setBlogSuccess('Blog updated successfully!');
        logAdminAction('Edit Blog', `Edited blog: ${blogPayload.title}`);
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([blogPayload]);
        if (error) throw error;
        setBlogSuccess('Blog created successfully!');
        logAdminAction('Create Blog', `Created new blog: ${blogPayload.title}`);
      }

      setIsBlogModalOpen(false);
      setSelectedBlog(null);
      setBlogForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        published: false,
        author: 'Admin'
      });
      setBlogImageFile(null);
      setBlogImagePreview('');
      await fetchBlogs();
    } catch (err) {
      setBlogError('Operation failed: ' + (err.message || String(err)));
    } finally {
      setBlogUploading(false);
    }
  };

  const handleDeleteBlog = async (blog) => {
    if (!window.confirm(`Are you sure you want to delete the blog "${blog.title}"? This action cannot be undone.`)) return;
    try {
      if (blog.cover_image && blog.cover_image.includes('/agent-updates/')) {
        const fileName = blog.cover_image.split('/').pop().split('?')[0];
        await supabase.storage.from('agent-updates').remove([fileName]);
      }
      const { error } = await supabase.from('blogs').delete().eq('id', blog.id);
      if (error) throw error;
      logAdminAction('Delete Blog', `Deleted blog: ${blog.title}`);
      await fetchBlogs();
    } catch (err) {
      alert('Failed to delete blog: ' + err.message);
    }
  };

  const handleTogglePublishBlog = async (blog) => {
    try {
      const newPublished = !blog.published;
      const { error } = await supabase
        .from('blogs')
        .update({ published: newPublished, updated_at: new Date().toISOString() })
        .eq('id', blog.id);
      if (error) throw error;
      logAdminAction(newPublished ? 'Publish Blog' : 'Unpublish Blog', `Toggled blog publish: ${blog.title}`);
      await fetchBlogs();
    } catch (err) {
      alert('Failed to toggle publication status: ' + err.message);
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
      fetchSiteFeedbacks(),
      fetchAuditLogs(),
      fetchAgreementsData(),
      fetchAgentUpdates(),
      fetchRegenRequests(),
      fetchDbNotifications(),
      fetchBlogs()
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

  // Handle URL query parameters to select agent or application from notifications
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    const parseQuery = async () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const agentId = params.get('agentId');
      const appId = params.get('appId');

      if (tab) {
        setActiveTab(tab);
      }

      try {
        if (agentId) {
          let agent = pendingAgents.find(a => a.id === agentId) || 
                      activeAgents.find(a => a.id === agentId) ||
                      demotedUsers.find(a => a.id === agentId);
          if (!agent) {
            const { data } = await supabase.from('profiles').select('*').eq('id', agentId).single();
            agent = data;
          }
          if (agent) {
            handleSelectAgent(agent);
          }
        }

        if (appId) {
          let app = applications.find(a => a.id === appId);
          if (!app) {
            const { data } = await supabase.from('applications').select('*, agent:profiles(full_name, agent_code)').eq('id', appId).single();
            app = data;
          }
          if (app) {
            setSelectedApplication(app);
          }
        }
      } catch (err) {
        console.error('Error selecting from URL query:', err);
      }
    };

    parseQuery();

    // Listen to custom navigation changes from the Header component
    const handleUrlChange = () => {
      setTimeout(parseQuery, 50);
    };

    window.addEventListener('admin-query-change', handleUrlChange);
    return () => {
      window.removeEventListener('admin-query-change', handleUrlChange);
    };
  }, [loading, pendingAgents, activeAgents, demotedUsers, applications]);



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
  }, [
    activeTab, 
    loading, 
    inquiries, 
    activeAgents, 
    pendingAgents, 
    demotedUsers, 
    applications, 
    payoutRequests, 
    policies, 
    contactMessages,
    auditLogs,
    auditSearchTerm,
    searchTerm,
    contactSearch,
    pincodeSearchTerm,
    loanTypeFilter,
    sortBy,
    appStatusFilter,
    activePolicyCategory
  ]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Admin sign out network request failed, proceeding to clear session locally:', err);
    }
    router.push('/admin/login');
    router.refresh();
  };

  const handleApproveAgent = async (agent) => {
    const agentId = agent.id;
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
        
        // Trigger approval email in background
        fetch('/api/agent-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent.full_name,
            agentEmail: agent.email,
            action: 'approved'
          })
        }).catch(err => console.error('Failed to send approval email:', err));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRejectAgent = async (agent) => {
    const agentId = agent.id;
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
        
        // Trigger rejection email in background
        fetch('/api/agent-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent.full_name,
            agentEmail: agent.email,
            action: 'rejected',
            reason: reason.trim()
          })
        }).catch(err => console.error('Failed to send rejection email:', err));
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
        await supabase
          .from('agent_agreements')
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            revocation_reason: 'Agent demoted by Administrator.'
          })
          .eq('agent_id', agentId)
          .eq('status', 'active');

        logAdminAction('Demote Agent', `Demoted agent ID: ${agentId} to standard user role.`);
        handleSelectAgent(null);
        await fetchAgentsData();
        await fetchAgreementsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handlePromoteUserToAgent = async (userProfile) => {
    if (!confirm(`Are you sure you want to promote ${userProfile.full_name} to Agent/Partner?`)) return;
    setAgentActionLoading(userProfile.id);
    try {
      let agentCode = userProfile.agent_code;
      if (!agentCode) {
        agentCode = generateRandomAgentCode();
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'agent', 
          approved: true, 
          demoted_at: null,
          agent_code: agentCode
        })
        .eq('id', userProfile.id);

      if (error) {
        alert('Failed to promote user to agent: ' + error.message);
      } else {
        alert('User successfully promoted to Agent!');
        logAdminAction('Promote User to Agent', `Promoted user ${userProfile.full_name} (${userProfile.email}) to Agent with code ${agentCode}`);
        await fetchAgentsData();
      }
    } catch (err) {
      console.error(err);
      alert('Error promoting user to agent.');
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
        await supabase
          .from('agent_agreements')
          .update({
            status: 'active',
            revoked_at: null,
            revocation_reason: null
          })
          .eq('agent_id', userId)
          .eq('status', 'revoked');

        logAdminAction('Re-promote Agent', `Re-promoted user ID: ${userId} back to agent role.`);
        await fetchAgentsData();
        await fetchAgreementsData();
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
        alert(`Profile update request sent to ${agent.full_name}! They will see a popup reminder every 5 minutes until their profile is 100% complete.`);
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
        alert(`Profile update request cancelled for ${agent.full_name}.`);
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
    if (!window.confirm('Are you sure you want to permanently delete this client application? This action cannot be undone.')) return;
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
      case 'not interested':
        return { color: '#94a3b8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)' };
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

  const renderAnalytics = () => {
    if (!isMounted) {
      return (
        <div className="text-center" style={{ padding: '60px 0' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Dashboard Analytics...</p>
        </div>
      );
    }

    // ─── Data Aggregation ───────────────────────────────────────────────────
    const totalLeads = inquiries.length;
    const totalApps = applications.length;
    
    const disbursedApps = applications.filter(app => app.status && app.status.toLowerCase() === 'disbursed');
    const totalDisbursedAmount = disbursedApps.reduce((acc, app) => acc + (Number(app.loan_amount) || 0), 0);
    const disbursementRate = totalApps > 0 ? ((disbursedApps.length / totalApps) * 100).toFixed(1) : '0.0';

    // 1. Monthly Disbursement Trend (Last 6 Months)
    const getTrendData = () => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const trendMap = {};
      const now = new Date();
      
      // Seed last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        trendMap[label] = { name: label, applied: 0, disbursed: 0 };
      }

      applications.forEach(app => {
        if (!app.created_at) return;
        const date = new Date(app.created_at);
        const label = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
        if (trendMap[label] !== undefined) {
          const amt = Number(app.loan_amount) || 0;
          trendMap[label].applied += amt;
          if (app.status && app.status.toLowerCase() === 'disbursed') {
            trendMap[label].disbursed += amt;
          }
        }
      });
      return Object.values(trendMap);
    };

    // 2. Application Status Split
    const getStatusData = () => {
      const counts = {
        'Applied': 0,
        'In Progress': 0,
        'KYC Check': 0,
        'Disbursed': 0,
        'Rejected': 0,
        'Not Interested': 0
      };
      
      applications.forEach(app => {
        const status = app.status ? app.status.toLowerCase() : 'applied';
        if (status === 'applied') counts['Applied']++;
        else if (status === 'in process' || status === 'in progress') counts['In Progress']++;
        else if (status === 'kyc verification' || status === 'kyc waiting') counts['KYC Check']++;
        else if (status === 'disbursed' || status === 'paid') counts['Disbursed']++;
        else if (status === 'rejected') counts['Rejected']++;
        else if (status === 'not interested') counts['Not Interested']++;
      });

      const colors = {
        'Applied': '#6366f1',
        'In Progress': '#f59e0b',
        'KYC Check': '#3b82f6',
        'Disbursed': '#10b981',
        'Rejected': '#ef4444',
        'Not Interested': '#94a3b8'
      };

      return Object.keys(counts).map(key => ({
        name: key,
        value: counts[key],
        color: colors[key]
      })).filter(item => item.value > 0);
    };

    // 3. Bank-wise Loan Distribution (Top 6)
    const getBankData = () => {
      const bankMap = {};
      applications.forEach(app => {
        const bank = app.bank_name || 'Other Lenders';
        if (!bankMap[bank]) bankMap[bank] = { name: bank, count: 0 };
        bankMap[bank].count++;
      });
      return Object.values(bankMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    };

    // 4. Top Performing Agents Leaderboard
    const getAgentLeaderboard = () => {
      const agentMap = {};
      applications.forEach(app => {
        if (app.status && app.status.toLowerCase() === 'disbursed') {
          const agentId = app.agent_id;
          const name = app.agent?.name || 'Customer App / Direct';
          const amt = Number(app.loan_amount) || 0;
          
          if (!agentMap[agentId]) agentMap[agentId] = { name, amount: 0 };
          agentMap[agentId].amount += amt;
        }
      });
      return Object.values(agentMap)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    };

    const trendData = getTrendData();
    const statusData = getStatusData();
    const bankData = getBankData();
    const agentLeaderboard = getAgentLeaderboard();

    return (
      <div style={{ display: 'grid', gap: '32px' }}>
        {/* Header Title */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Control Room Analytics</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
            Real-time business intelligence metrics, loan disbursements, and top-performing agent metrics.
          </p>
        </div>

        {/* Aggregated Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1: Total Leads */}
          <div className="form-card" style={{ padding: '24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Leads Checked
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {totalLeads}
            </div>
          </div>

          {/* Card 2: Total Applications */}
          <div className="form-card" style={{ padding: '24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Applications
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {totalApps}
            </div>
          </div>

          {/* Card 3: Total Disbursed Volume */}
          <div className="form-card" style={{ padding: '24px', textAlign: 'center', backdropFilter: 'blur(20px)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Disbursed Volume
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              ₹{totalDisbursedAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Card 4: Success Rate */}
          <div className="form-card" style={{ padding: '24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Disbursement Rate
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
              {disbursementRate}%
            </div>
          </div>
        </div>

        {/* Charts Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
          gap: '32px'
        }}>
          {/* Chart 1: Disbursement Trend */}
          <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Disbursement & Application Volume Trend
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={10} />
                <YAxis stroke="var(--color-text-secondary)" fontSize={10} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={11} />
                <Area name="Applied Volume" type="monotone" dataKey="applied" stroke="#6366f1" fillOpacity={1} fill="url(#colorApplied)" strokeWidth={2} />
                <Area name="Disbursed Volume" type="monotone" dataKey="disbursed" stroke="#10b981" fillOpacity={1} fill="url(#colorDisbursed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Status Split */}
          <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Application Status Distribution
            </h4>
            {statusData.length === 0 ? (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                No active application data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="40%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}
                    formatter={(value) => [`${value} Applications`]}
                  />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" fontSize={11} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 3: Bank-wise Distribution */}
          <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Lender Application Share (Top Banks)
            </h4>
            {bankData.length === 0 ? (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                No loan records submitted yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bankData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={9} interval={0} tickFormatter={(v) => v.split(' ')[0]} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}
                    formatter={(value) => [`${value} Submissions`]}
                  />
                  <Bar name="Submissions Count" dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} barSize={24}>
                    {bankData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 4: Top Agents Leaderboard */}
          <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text-primary)' }}>
              Top Performing Partner Agents (Disbursements)
            </h4>
            {agentLeaderboard.length === 0 ? (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                No agent disbursements registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={agentLeaderboard} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="var(--color-text-secondary)" fontSize={10} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                  <YAxis dataKey="name" type="category" stroke="var(--color-text-secondary)" fontSize={9} width={90} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`]}
                  />
                  <Bar name="Disbursed Volume" dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  const actualPendingAgents = pendingAgents.filter(sa => !(sa.profile_update_message && sa.profile_update_message.startsWith('REJECTED:')));
  const demotedBalances = getDemotedOutstandingBalances();
  const agentApplications = applications.filter(app => app.agent?.role !== 'user');
  const customerApplications = applications.filter(app => app.agent?.role === 'user');
  const totalNotifications = actualPendingAgents.length + 
                             payoutRequests.filter(r => r.status === 'Pending').length + 
                             applications.filter(a => a.status && a.status.toLowerCase() === 'applied').length + 
                             demotedBalances.length +
                             dbNotifications.length;

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
                      Refresh All
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
                          { id: 'notifications', label: `Notifications (${totalNotifications})` },
                          { id: 'customer_leads', label: `Customer Inquiries (${customerInquiries.length})` },
                          { id: 'agent_leads', label: `Agent Inquiries (${agentInquiries.length})` },
                          { id: 'active_agents', label: `Active Agents (${activeAgents.length})` },
                          { id: 'pending_agents', label: `Pending Approvals (${pendingAgents.length})` },
                          { id: 'revoked_agents', label: `Revoked Agents (${demotedUsers.length})` },
                          { id: 'normal_users', label: `Normal Users (${normalUsers.length})` },
                          { id: 'payouts', label: `Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                          { id: 'agent_applications', label: `Agent Applications (${agentApplications.length})` },
                          { id: 'customer_applications', label: `Customer Applications (${customerApplications.length})` },
                          { id: 'policies', label: `Bank Policies (${policies.length})` },
                          { id: 'contacts', label: `Contact Messages (${contactMessages.length})` },
                          { id: 'feedbacks', label: `Website Feedbacks (${siteFeedbacks.length})` },
                          { id: 'blogs', label: `Manage Blogs (${blogs.length})` },
                          { id: 'agreements', label: `Agent Agreements` },
                          { id: 'agent_updates', label: `Agent Updates (${agentUpdates.length})` },
                          { id: 'audit_logs', label: `Audit Logs (${auditLogs.length})` },
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
                          { id: 'notifications', label: `Notifications (${totalNotifications})` },
                          { id: 'analytics', label: `Business Analytics` },
                          { id: 'customer_leads', label: `Customer Inquiries (${customerInquiries.length})` },
                          { id: 'agent_leads', label: `Agent Inquiries (${agentInquiries.length})` },
                          { id: 'active_agents', label: `Active Agents (${activeAgents.length})` },
                          { id: 'pending_agents', label: `Pending Approvals (${pendingAgents.length})` },
                          { id: 'revoked_agents', label: `Revoked Agents (${demotedUsers.length})` },
                          { id: 'normal_users', label: `Normal Users (${normalUsers.length})` },
                          { id: 'payouts', label: `Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                          { id: 'agent_applications', label: `Agent Applications (${agentApplications.length})` },
                          { id: 'customer_applications', label: `Customer Applications (${customerApplications.length})` },
                          { id: 'policies', label: `Bank Policies (${policies.length})` },
                          { id: 'contacts', label: `Contact Messages (${contactMessages.length})` },
                          { id: 'feedbacks', label: `Website Feedbacks (${siteFeedbacks.length})` },
                          { id: 'blogs', label: `Manage Blogs (${blogs.length})` },
                          { id: 'agreements', label: `Agent Agreements` },
                          { id: 'agent_updates', label: `Agent Updates (${agentUpdates.length})` },
                          { id: 'audit_logs', label: `Audit Logs (${auditLogs.length})` },
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
                      { id: 'notifications', label: `Notifications (${totalNotifications})` },
                      { id: 'analytics', label: `Business Analytics` },
                      { id: 'customer_leads', label: `Customer Inquiries (${customerInquiries.length})` },
                      { id: 'agent_leads', label: `Agent Inquiries (${agentInquiries.length})` },
                      { id: 'active_agents', label: `Active Agents (${activeAgents.length})` },
                      { id: 'pending_agents', label: `Pending Approvals (${pendingAgents.length})` },
                      { id: 'revoked_agents', label: `Revoked Agents (${demotedUsers.length})` },
                      { id: 'normal_users', label: `Normal Users (${normalUsers.length})` },
                      { id: 'payouts', label: `Payout Requests (${payoutRequests.filter(r=>r.status==='Pending').length})` },
                      { id: 'agent_applications', label: `Agent Applications (${agentApplications.length})` },
                      { id: 'customer_applications', label: `Customer Applications (${customerApplications.length})` },
                      { id: 'policies', label: `Bank Policies (${policies.length})` },
                      { id: 'contacts', label: `Contact Messages (${contactMessages.length})` },
                      { id: 'feedbacks', label: `Website Feedbacks (${siteFeedbacks.length})` },
                      { id: 'blogs', label: `Manage Blogs (${blogs.length})` },
                      { id: 'agreements', label: `Agent Agreements` },
                      { id: 'agent_updates', label: `Agent Updates (${agentUpdates.length})` },
                      { id: 'audit_logs', label: `Audit Logs (${auditLogs.length})` },
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
 
                  {/* PANEL: BUSINESS ANALYTICS */}
                  {activeTab === 'analytics' && renderAnalytics()}

                  {/* PANEL 0: NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                   <div style={{ display: 'grid', gap: '32px' }}>
                     
                     {/* SECTION 0: Agent Activity Feed */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         🔔 Agent Activity Feed
                         <span className="badge badge-warning" style={{ fontSize: '10px', background: '#3b82f6', color: '#fff' }}>{dbNotifications.length}</span>
                       </h3>
                       {dbNotifications.length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No recent agent activity notifications.</p>
                         </div>
                       ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                           {dbNotifications.map((notif) => (
                             <div 
                               key={notif.id} 
                               style={{ 
                                 background: 'rgba(17, 24, 39, 0.4)', 
                                 border: 'var(--border-light)', 
                                 borderRadius: '12px', 
                                 padding: '16px 20px', 
                                 display: 'flex', 
                                 justifyContent: 'space-between', 
                                 alignItems: 'center', 
                                 gap: '16px',
                                 transition: 'all 0.2s',
                               }}
                             >
                               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                   <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{notif.title}</span>
                                   <ExpirationTimer createdAt={notif.created_at} />
                                 </div>
                                 <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                                   {notif.message}
                                 </p>
                                 <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                   {new Date(notif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                 </div>
                               </div>
                               <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                 {notif.activity_type && notif.reference_id && (
                                   <button
                                     onClick={() => handleFollowupNotification(notif)}
                                     className="btn btn-primary btn-sm"
                                     style={{ margin: 0, padding: '6px 14px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                   >
                                     🔍 Follow Up
                                   </button>
                                 )}
                                 <button
                                   onClick={() => {
                                     if (confirm('Delete this notification?')) {
                                       handleDeleteNotification(notif.id);
                                     }
                                   }}
                                   disabled={notificationActionLoading === notif.id}
                                   className="btn btn-secondary btn-sm"
                                   style={{ 
                                     margin: 0, 
                                     padding: '6px 10px', 
                                     backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                     border: '1px solid rgba(239, 68, 68, 0.3)', 
                                     color: '#ef4444',
                                     minWidth: '34px',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center'
                                   }}
                                 >
                                   🗑️
                                 </button>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>

                     {/* SECTION 1: Unapproved agent registrations */}
                     <div>
                       <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         Pending Agent Registrations
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
                                           onClick={() => handleApproveAgent(sa)}
                                           disabled={agentActionLoading === sa.id}
                                           className="btn btn-primary btn-sm"
                                           style={{ margin: 0 }}
                                         >
                                           {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve'}
                                         </button>
                                         <button
                                           onClick={() => handleRejectAgent(sa)}
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
                         Pending Agent Payout Requests
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
                         New Client Applications (Applied)
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
                                       <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{app.client_mobile}</div>
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
                                           <strong>Issue:</strong> {app.problem}
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
                                         <option value="not interested">Not Interested</option>
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
                         ⚖Outstanding Demoted Agent Balances
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
                                        Details 👁</button>
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
                                        Details 👁</button>
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
                      {/* Search Bar & Export */}
                      <div style={{ padding: '16px 24px', borderBottom: 'var(--border-subtle)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search active agents by name, email, phone, or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '20px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            const headers = {
                              full_name: 'Agent Name',
                              email: 'Email',
                              phone: 'Phone Number',
                              agent_code: 'Unique Code',
                              created_at: 'Approved On',
                              dob: 'Date of Birth',
                              fathers_name: "Father's Name",
                              marital_status: 'Marital Status',
                              current_address: 'Current Address',
                              permanent_address: 'Permanent Address',
                              pincode: 'Pincode',
                              city: 'City',
                              state: 'State',
                              bank_name: 'Bank Name',
                              bank_account_no: 'Account Number',
                              bank_ifsc: 'IFSC Code'
                            };
                            const dataToExport = filtered.map(agent => ({
                              ...agent,
                              created_at: new Date(agent.created_at).toLocaleDateString('en-IN')
                            }));
                            exportToCSV(dataToExport, 'active_agents.csv', headers);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            margin: 0,
                            padding: '10px 18px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--color-success)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Export to Excel (CSV)
                        </button>
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
                                        Inspect Profile 👁</button>
                                      <button
                                        onClick={() => handleDemoteAgent(agent.id)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', border: 'var(--border-error)' }}
                                      >
                                        Demote to User </button>
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

                {/* PANEL: NORMAL USERS */}
                {activeTab === 'normal_users' && (() => {
                  const filtered = normalUsers.filter(user => {
                    const query = searchTerm.toLowerCase().trim();
                    return (
                      user.full_name?.toLowerCase().includes(query) ||
                      user.email?.toLowerCase().includes(query) ||
                      user.phone?.includes(query)
                    );
                  });

                  return (
                    <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                      {/* Search Bar & Export */}
                      <div style={{ padding: '16px 24px', borderBottom: 'var(--border-subtle)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search normal users by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '20px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            const headers = {
                              full_name: 'User Name',
                              email: 'Email',
                              phone: 'Phone Number',
                              created_at: 'Signed Up On',
                              dob: 'Date of Birth',
                              fathers_name: "Father's Name",
                              marital_status: 'Marital Status',
                              current_address: 'Current Address',
                              permanent_address: 'Permanent Address',
                              pincode: 'Pincode',
                              city: 'City',
                              state: 'State',
                              bank_name: 'Bank Name',
                              bank_account_no: 'Account Number',
                              bank_ifsc: 'IFSC Code'
                            };
                            const dataToExport = filtered.map(user => ({
                              ...user,
                              created_at: new Date(user.created_at).toLocaleDateString('en-IN')
                            }));
                            exportToCSV(dataToExport, 'registered_users.csv', headers);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            margin: 0,
                            padding: '10px 18px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--color-success)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Export to Excel (CSV)
                        </button>
                      </div>

                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                          <thead>
                            <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-light)' }}>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>User Name</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Phone Number</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Signed Up On</th>
                              <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                  No normal users match your search criteria.
                                </td>
                              </tr>
                            ) : (
                              filtered.map((user) => (
                                <tr key={user.id} onClick={() => handleSelectAgent(user)} className="table-row-hover" style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }}>
                                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{user.full_name}</td>
                                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{user.email}</td>
                                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{user.phone || 'Not provided'}</td>
                                  <td style={{ padding: '16px 24px', color: 'var(--color-text-tertiary)' }}>
                                    {new Date(user.created_at).toLocaleDateString('en-IN')}
                                  </td>
                                  <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button
                                        onClick={() => handleSelectAgent(user)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                      >
                                        Inspect Profile 👁</button>
                                      <button
                                        onClick={() => handlePromoteUserToAgent(user)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                      >
                                        Promote to Agent ⚡</button>
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
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}></span>
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
                                            onClick={() => handleApproveAgent(sa)}
                                            disabled={agentActionLoading === sa.id}
                                            className="btn btn-primary btn-sm"
                                            style={{ margin: 0 }}
                                          >
                                            {agentActionLoading === sa.id ? 'Approving...' : '✓ Approve'}
                                          </button>
                                          {!isRejected && (
                                            <button
                                              onClick={() => handleRejectAgent(sa)}
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
                                    <tr key={du.id} onClick={() => handleSelectAgent(du)} className="table-row-hover" style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }}>
                                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{du.full_name}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{du.email}</td>
                                      <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                        {new Date(du.demoted_at).toLocaleDateString('en-IN')}
                                      </td>
                                      <td style={{ padding: '16px 24px', color: eligible ? 'var(--color-warning)' : 'var(--color-error)', fontWeight: 500 }}>
                                        {remainingText}
                                      </td>
                                      <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                          <button
                                            onClick={() => handleSelectAgent(du)}
                                            className="btn btn-secondary btn-sm"
                                            style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                          >
                                            Inspect Profile 👁</button>
                                          {eligible ? (
                                            <button
                                              onClick={() => handleRepromoteAgent(du.id)}
                                              disabled={agentActionLoading === du.id}
                                              className="btn btn-secondary btn-sm"
                                              style={{ margin: 0, borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                            >
                                              Restore Agent
                                            </button>
                                          ) : (
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingRight: '8px' }}>Locked</span>
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
                  </div>
                );
              })()}

                {/* PANEL 3.5: REVOKED AGENTS LIST */}
                {activeTab === 'revoked_agents' && (() => {
                  const query = searchTerm.toLowerCase().trim();
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
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}></span>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Search revoked agents by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                          />
                        </div>
                      </div>

                      {/* Demoted Re-promotions queue */}
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Revoked Agents
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
                                      No revoked agent profiles found.
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
                                      <tr key={du.id} onClick={() => handleSelectAgent(du)} className="table-row-hover" style={{ borderBottom: 'var(--border-subtle)', cursor: 'pointer' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>{du.full_name}</td>
                                        <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{du.email}</td>
                                        <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                                          {new Date(du.demoted_at).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: eligible ? 'var(--color-warning)' : 'var(--color-error)', fontWeight: 500 }}>
                                          {remainingText}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <button
                                              onClick={() => handleSelectAgent(du)}
                                              className="btn btn-secondary btn-sm"
                                              style={{ margin: 0, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                            >
                                              Inspect Profile 👁</button>
                                            {eligible ? (
                                              <button
                                                onClick={() => handleRepromoteAgent(du.id)}
                                                disabled={agentActionLoading === du.id}
                                                className="btn btn-secondary btn-sm"
                                                style={{ margin: 0, borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                              >
                                                Restore Agent
                                              </button>
                                            ) : (
                                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingRight: '8px' }}>Locked</span>
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
                          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}></span>
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
                      {/* Search Bar & Export */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}></span>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Search applications by client, mobile, bank, agent, or Application ID..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                            />
                          </div>
                          <button
                            onClick={() => handleExportApplicationsToExcel(displayApps, true)}
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 20px',
                              margin: 0,
                              whiteSpace: 'nowrap',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: 'var(--color-accent)',
                              fontWeight: 600,
                              borderRadius: 'var(--border-radius-md)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Export to Excel
                          </button>
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
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{app.client_mobile}</div>
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
                                          <strong>Issue:</strong> {app.problem}
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
                                          Inspect
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
                                          Delete</button>
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
                      {/* Search Bar & Export */}
                      <div className="form-card" style={{ padding: '16px 24px', backdropFilter: 'blur(20px)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '14px' }}></span>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Search applications by client, mobile, bank, customer, or Application ID..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ paddingLeft: '44px', margin: 0, fontSize: 'var(--text-sm)' }}
                            />
                          </div>
                          <button
                            onClick={() => handleExportApplicationsToExcel(displayApps, false)}
                            className="btn btn-secondary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 20px',
                              margin: 0,
                              whiteSpace: 'nowrap',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: 'var(--color-accent)',
                              fontWeight: 600,
                              borderRadius: 'var(--border-radius-md)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Export to Excel
                          </button>
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
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{app.client_mobile}</div>
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
                                          <strong>Issue:</strong> {app.problem}
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
                                          Inspect
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
                                          Delete</button>
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
                    { id: 'salary', label: 'Salary PL', count: salaryCount, emoji: '' },
                    { id: 'instant', label: 'Instant PL', count: instantCount, emoji: '' },
                    { id: 'business', label: 'Business Loans', count: businessCount, emoji: '' }
                  ];

                  return (
                    <div style={{ display: 'grid', gap: '24px' }}>
                      {/* Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>Bank & NBFC Policies</h3>
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
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}></div>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No policies found in this category.</p>
                          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>Click &quot;Add New Policy&quot; to define a criteria for this category.</p>
                        </div>
                      ) : (
                        <div className="form-card" style={{ padding: 0, overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
                          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
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
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>PDF</th>
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
                                        {policy.loan_type === 'PL' ? 'Personal' : 'Business'}
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
                                        {policy.employment_type === 'self_employed' ? 'Self Emp' : policy.employment_type === 'both' ? 'Both' : 'Salaried'}
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
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '11px' }}>All India</span>
                                      ) : (
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '11px' }}>Limited</span>
                                      )}
                                    </td>
                                    <td data-label="PDF" style={{ padding: '12px 10px' }}>
                                      {policy.policy_pdf ? (
                                        <span 
                                          style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }} 
                                          onClick={() => {
                                            const base64Data = policy.policy_pdf;
                                            const base64Parts = base64Data.split(';base64,');
                                            const contentType = base64Parts[0].split(':')[1] || 'application/pdf';
                                            const raw = window.atob(base64Parts[1] || base64Data);
                                            const rawLength = raw.length;
                                            const uInt8Array = new Uint8Array(rawLength);
                                            for (let i = 0; i < rawLength; ++i) {
                                              uInt8Array[i] = raw.charCodeAt(i);
                                            }
                                            const blob = new Blob([uInt8Array], { type: contentType });
                                            const blobUrl = URL.createObjectURL(blob);
                                            window.open(blobUrl, '_blank');
                                          }}
                                        >
                                          View PDF
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>None</span>
                                      )}
                                    </td>
                                    <td data-label="Actions" style={{ padding: '12px 10px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <button
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '5px 12px', fontSize: '11px' }}
                                          onClick={() => handleOpenEditPolicy(policy)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="btn btn-sm"
                                          style={{ padding: '5px 12px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.25)' }}
                                          onClick={() => handleDeletePolicy(policy.id)}
                                          disabled={agentActionLoading === 'deleting-policy'}
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
                        placeholder="Search messages by sender, email, subject, or content..."
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
                                    {msg.mobile && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{msg.mobile}</span>}
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

                {/* PANEL 8B: WEBSITE FEEDBACKS */}
                {activeTab === 'feedbacks' && (
                  <div className="form-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Website Feedbacks</h3>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          View and manage feedback submitted by website visitors.
                        </p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Search feedbacks by name, email, or content..."
                        value={feedbackSearch || ''}
                        onChange={(e) => setFeedbackSearch(e.target.value)}
                      />
                    </div>

                    {/* Feedbacks Table */}
                    {siteFeedbacks.filter((fb) => {
                      const query = (feedbackSearch || '').toLowerCase();
                      return (
                        fb.name?.toLowerCase().includes(query) ||
                        fb.email?.toLowerCase().includes(query) ||
                        fb.message?.toLowerCase().includes(query)
                      );
                    }).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No feedbacks found.
                      </div>
                    ) : (
                      <div className="table-scroll-x" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--color-text-secondary)' }}>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rating</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Sender</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Feedback Message</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Submitted On</th>
                              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {siteFeedbacks.filter((fb) => {
                              const query = (feedbackSearch || '').toLowerCase();
                              return (
                                fb.name?.toLowerCase().includes(query) ||
                                fb.email?.toLowerCase().includes(query) ||
                                fb.message?.toLowerCase().includes(query)
                              );
                            }).map((fb) => (
                              <tr key={fb.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                <td style={{ padding: '16px' }}>
                                  <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}>
                                    {'★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating)}
                                    <span style={{ marginLeft: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>({fb.rating}/5)</span>
                                  </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                  <div style={{ fontWeight: 600 }}>{fb.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Anonymous</span>}</div>
                                  {fb.email && (
                                    <div style={{ marginTop: '2px' }}>
                                      <a href={`mailto:${fb.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontSize: 'var(--text-xs)' }}>{fb.email}</a>
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '16px', maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {fb.message}
                                </td>
                                <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>
                                  {new Date(fb.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                  <button
                                    className="btn btn-danger btn-xs"
                                    onClick={() => deleteSiteFeedback(fb.id)}
                                    disabled={feedbackActionLoading}
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
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                 {/* PANEL 12: AGENT UPDATES IMAGE BOARD */}
                 {activeTab === 'agent_updates' && (
                   <div style={{ display: 'grid', gap: '32px' }}>

                     {/* Upload Form */}
                     <div className="form-card" style={{ padding: '28px', backdropFilter: 'blur(20px)' }}>
                       <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Upload New Image Update</h3>
                       <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '24px' }}>
                         Upload promotional images, loan offer banners, or policy circulars for your agents. They will appear on agent dashboards.
                       </p>

                       {uploadError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{uploadError}</div>}
                       {uploadSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{uploadSuccess}</div>}

                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                         <div style={{ display: 'grid', gap: '16px' }}>
                           <div>
                             <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Title *</label>
                             <input
                               type="text"
                               value={uploadTitle}
                               onChange={e => setUploadTitle(e.target.value)}
                               placeholder="e.g. New Loan Offer — July 2025"
                               className="form-input"
                               style={{ width: '100%' }}
                             />
                           </div>
                           <div>
                             <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Category</label>
                             <select
                               value={uploadCategory}
                               onChange={e => setUploadCategory(e.target.value)}
                               className="form-input"
                               style={{ width: '100%' }}
                             >
                               <option value="general">General</option>
                               <option value="loan_offer">Loan Offer</option>
                               <option value="policy">Policy Update</option>
                               <option value="promo">Promotion</option>
                               <option value="training">Training</option>
                             </select>
                           </div>
                           <div>
                             <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Description (optional)</label>
                             <textarea
                               value={uploadDesc}
                               onChange={e => setUploadDesc(e.target.value)}
                               placeholder="Brief details about this update..."
                               className="form-input"
                               rows={3}
                               style={{ width: '100%', resize: 'vertical' }}
                             />
                           </div>
                         </div>

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Image or PDF File * (max 5 MB)</label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={e => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    setUploadFile(f);
                                    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
                                      setUploadPreview('PDF_FILE');
                                    } else {
                                      const reader = new FileReader();
                                      reader.onload = ev => setUploadPreview(ev.target.result);
                                      reader.readAsDataURL(f);
                                    }
                                  }
                                }}
                                className="form-input"
                                style={{ width: '100%' }}
                              />
                            </div>
                            {uploadPreview === 'PDF_FILE' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '12px', gap: '8px', padding: '16px' }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadFile?.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>PDF Document</span>
                              </div>
                            ) : uploadPreview && (
                              <div style={{ borderRadius: '12px', overflow: 'hidden', border: 'var(--border-light)', maxHeight: '200px' }}>
                                <img src={uploadPreview} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                              </div>
                            )}
                           <button
                             onClick={handleUploadUpdate}
                             disabled={uploading}
                             className="btn btn-primary"
                             style={{ marginTop: 'auto', padding: '14px', fontSize: 'var(--text-sm)', fontWeight: 700 }}
                           >
                             {uploading ? 'Uploading...' : 'Upload Image'}
                           </button>
                         </div>
                       </div>
                     </div>

                     {/* Uploaded Images Grid */}
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                         <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Uploaded Images ({agentUpdates.length})</h3>
                         <button onClick={fetchAgentUpdates} className="btn btn-secondary btn-sm" disabled={updatesLoading}>
                           {updatesLoading ? 'Refreshing...' : 'Refresh'}
                         </button>
                       </div>

                       {agentUpdates.length === 0 ? (
                         <div className="form-card text-center" style={{ padding: '48px', backdropFilter: 'blur(20px)' }}>
                           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 16px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                           <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No images uploaded yet. Upload your first update above.</p>
                         </div>
                       ) : (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                           {agentUpdates.map(update => {
                             const catColors = {
                               loan_offer:  { bg: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' },
                               policy:      { bg: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)' },
                               promo:       { bg: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' },
                               training:    { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
                               general:     { bg: 'rgba(100,116,139,0.1)', color: 'var(--color-text-secondary)' },
                             };
                             const c = catColors[update.category] || catColors.general;
                             return (
                               <div key={update.id} className="form-card" style={{ padding: 0, overflow: 'hidden', opacity: update.is_active ? 1 : 0.55, backdropFilter: 'blur(20px)' }}>
                                 <div style={{ position: 'relative' }}>
                                    {update.image_url.split('?')[0].toLowerCase().endsWith('.pdf') ? (
                                      <div style={{ width: '100%', height: '180px', background: 'rgba(239, 68, 68, 0.08)', borderBottom: 'var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f87171' }}>PDF Document</span>
                                      </div>
                                    ) : (
                                      <img
                                        src={update.image_url}
                                        alt={update.title}
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                                      />
                                    )}
                                   {!update.is_active && (
                                     <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                       <span style={{ color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em' }}>HIDDEN FROM AGENTS</span>
                                     </div>
                                   )}
                                   {/* Expiration Countdown Badge */}
                                   <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                     {getExpirationCountdown(update.created_at)}
                                   </span>
                                   <span style={{ position: 'absolute', top: '10px', left: '10px', background: c.bg, color: c.color, border: `1px solid ${c.color}40`, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', backdropFilter: 'blur(8px)', textTransform: 'capitalize' }}>
                                     {update.category.replace('_', ' ')}
                                   </span>
                                 </div>
                                 <div style={{ padding: '16px' }}>
                                   <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{update.title}</div>
                                   {update.description && <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '8px', lineHeight: 1.5 }}>{update.description}</div>}
                                   <div style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', marginBottom: '16px' }}>{new Date(update.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                   <div style={{ display: 'flex', gap: '8px' }}>
                                     <button
                                       onClick={() => handleToggleUpdate(update)}
                                       className="btn btn-secondary btn-sm"
                                       style={{ flex: 1, fontSize: '12px', padding: '8px', background: update.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: update.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)', border: `1px solid ${update.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}` }}
                                     >
                                       {update.is_active ? 'Active' : 'Hidden'}
                                     </button>
                                     <button
                                       onClick={() => handleDeleteUpdate(update)}
                                       className="btn btn-secondary btn-sm"
                                       style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                     >
                                       Delete
                                     </button>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* PANEL 11: AUDIT LOGS */}
                 {activeTab === 'audit_logs' && (
                   <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                       <div>
                         <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Administrative Audit Logs</h3>
                         <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                           Chronological list of all actions performed by administrators in the control room panel.
                         </p>
                       </div>
                       <div>
                         <button onClick={fetchAuditLogs} className="btn btn-secondary btn-sm" disabled={loadingAuditLogs}>
                           {loadingAuditLogs ? 'Refreshing...' : 'Refresh Logs'}
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

                  {activeTab === 'blogs' && (
                    <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Manage Portal Blogs</h3>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                            Create, publish, edit, or delete articles that will appear publicly on the website.
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBlog(null);
                              setBlogForm({
                                title: '',
                                slug: '',
                                excerpt: '',
                                content: '',
                                published: false,
                                author: 'Admin'
                              });
                              setBlogImageFile(null);
                              setBlogImagePreview('');
                              setBlogError('');
                              setBlogSuccess('');
                              setIsBlogModalOpen(true);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ background: 'var(--gradient-primary)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}
                          >
                            + Write New Blog
                          </button>
                        </div>
                      </div>

                      {blogsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                          <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>Loading blogs...</p>
                        </div>
                      ) : blogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <h4 style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', fontWeight: 600 }}>No Blogs Found</h4>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 16px' }}>
                            Get started by writing your first educational article or news update for visitors.
                          </p>
                        </div>
                      ) : (
                        <div className="table-scroll-x" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Image</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', width: '35%' }}>Title</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Slug</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Created</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blogs.map(blog => (
                                <tr key={blog.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                  <td style={{ padding: '12px 16px' }}>
                                    {blog.cover_image ? (
                                      <img
                                        src={blog.cover_image}
                                        alt="cover"
                                        style={{ width: '48px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                                      />
                                    ) : (
                                      <div style={{ width: '48px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                        No Image
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                    {blog.title}
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                                    {blog.slug}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePublishBlog(blog)}
                                      style={{
                                        border: 'none',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: blog.published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: blog.published ? 'var(--color-success)' : '#f59e0b',
                                        border: blog.published ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                                      }}
                                    >
                                      {blog.published ? 'Published' : 'Draft'}
                                    </button>
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                    {new Date(blog.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                  </td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedBlog(blog);
                                          setBlogForm({
                                            title: blog.title,
                                            slug: blog.slug,
                                            excerpt: blog.excerpt,
                                            content: blog.content,
                                            published: blog.published,
                                            author: blog.author || 'Admin'
                                          });
                                          setBlogImageFile(null);
                                          setBlogImagePreview(blog.cover_image || '');
                                          setBlogError('');
                                          setBlogSuccess('');
                                          setIsBlogModalOpen(true);
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBlog(blog)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
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

                  {activeTab === 'agreements' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>DSA Agent Agreements Ledger</h3>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            View details, print documents, or revoke signed connector/DSA agent agreements.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Filter Pills */}
                          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            {[
                              { id: 'all', label: 'All Agreements' },
                              { id: 'active', label: 'Active' },
                              { id: 'revoked', label: 'Revoked' }
                            ].map(filter => (
                              <button
                                key={filter.id}
                                onClick={() => setAgreementFilter(filter.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 600,
                                  background: agreementFilter === filter.id ? 'var(--gradient-primary)' : 'transparent',
                                  border: 'none',
                                  color: agreementFilter === filter.id ? '#fff' : 'var(--color-text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {filter.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ width: '250px' }}>
                            <input
                              type="text"
                              placeholder="Search by name or number..."
                              className="input-field"
                              value={agreementSearch}
                              onChange={(e) => setAgreementSearch(e.target.value)}
                              style={{ margin: 0 }}
                            />
                          </div>
                        </div>
                      </div>

                      {loadingAgreements ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                          <p style={{ color: 'var(--color-text-secondary)' }}>Loading agreements database...</p>
                        </div>
                      ) : (() => {
                        const filteredAgreements = agreements.filter(a => {
                          const q = agreementSearch.toLowerCase();
                          const matchesSearch = (
                            a.agreement_no?.toLowerCase().includes(q) ||
                            a.profiles?.full_name?.toLowerCase().includes(q) ||
                            a.profiles?.phone?.includes(q) ||
                            a.profiles?.email?.toLowerCase().includes(q)
                          );
                          if (!matchesSearch) return false;
                          if (agreementFilter === 'active') return a.status === 'active';
                          if (agreementFilter === 'revoked') return a.status === 'revoked';
                          return true;
                        });

                        return (
                          <div className="table-scroll-x" style={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                              <thead>
                                <tr style={{ borderBottom: 'var(--border-subtle)', color: 'var(--color-text-tertiary)' }}>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agreement No</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agent Name</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Phone</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>{agreementFilter === 'revoked' ? 'Date Revoked' : 'Date Signed'}</th>
                                  {agreementFilter === 'revoked' && <th style={{ padding: '12px 16px', fontWeight: 600 }}>Revocation Reason</th>}
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredAgreements.map(a => (
                                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{a.agreement_no}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{a.profiles?.full_name}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{a.profiles?.phone}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{a.profiles?.email}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                                      {agreementFilter === 'revoked' && a.revoked_at
                                        ? new Date(a.revoked_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                                        : new Date(a.signed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                                      }
                                    </td>
                                    {agreementFilter === 'revoked' && (
                                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.revocation_reason}>
                                        {a.revocation_reason || 'N/A'}
                                      </td>
                                    )}
                                    <td style={{ padding: '12px 16px' }}>
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        background: a.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: a.status === 'active' ? 'var(--color-success)' : '#ef4444',
                                        textTransform: 'uppercase'
                                      }}>
                                        {a.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => {
                                          window.open(`/agreement-print?id=${a.agent_id}`, '_blank');
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ margin: 0, padding: '4px 10px', fontSize: '11px' }}
                                      >
                                        Download / Print
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (!confirm(`Are you sure you want to delete agreement ${a.agreement_no} and allow the agent to sign a new one?`)) return;
                                          try {
                                            const { error } = await supabase
                                              .from('agent_agreements')
                                              .delete()
                                              .eq('id', a.id);
                                            if (error) {
                                              alert("Failed to regenerate agreement: " + error.message);
                                            } else {
                                              alert("Agreement deleted successfully! The agent is now prompted to sign a new agreement.");
                                              logAdminAction('Regenerate Agreement', `Deleted agreement ${a.agreement_no} to allow re-signing.`);
                                              await fetchAgreementsData();
                                            }
                                          } catch(err) {
                                            console.error(err);
                                          }
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                                      >
                                        Regenerate
                                      </button>
                                      {a.status === 'active' ? (
                                        <button
                                          onClick={() => setRevokingAgreement(a)}
                                          className="btn btn-sm"
                                          style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: '#ef4444', color: '#fff' }}
                                        >
                                          Revoke
                                        </button>
                                      ) : (
                                        <button
                                          onClick={async () => {
                                            if (!confirm(`Are you sure you want to reactivate agreement ${a.agreement_no}?`)) return;
                                            try {
                                              const { error } = await supabase
                                                .from('agent_agreements')
                                                .update({ status: 'active', revoked_at: null, revocation_reason: null })
                                                .eq('id', a.id);
                                              if (error) alert(error.message);
                                              else {
                                                // Promote profile back to agent
                                                const { error: promoteErr } = await supabase
                                                  .from('profiles')
                                                  .update({ role: 'agent', demoted_at: null })
                                                  .eq('id', a.agent_id);

                                                if (promoteErr) {
                                                  console.error('Failed to promote user back to agent on agreement reactivation:', promoteErr.message);
                                                }

                                                alert('Agreement reactivated and agent restored successfully.');
                                                logAdminAction('Reactivate Agreement', `Reactivated agreement ${a.agreement_no} for agent ${a.profiles?.full_name}.`);
                                                await fetchAgreementsData();
                                                await fetchAgentsData();
                                              }
                                            } catch (err) { console.error(err); }
                                          }}
                                          className="btn btn-sm"
                                          style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                        >
                                          Reactivate
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {filteredAgreements.length === 0 && (
                                  <tr>
                                    <td colSpan={agreementFilter === 'revoked' ? 8 : 7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                      No agreements found in the database.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
          </>
            )}
          </div>
        </section>
      </main>

      {/* Revoke Agreement Modal */}
      {revokingAgreement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          overflowY: 'auto',
          padding: '40px 16px',
          zIndex: 99999,
          WebkitOverflowScrolling: 'touch'
        }} onClick={() => setRevokingAgreement(null)}>
          <div className="form-card" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', display: 'grid', gap: '20px', border: 'var(--border-accent)', background: 'var(--color-bg-tertiary)', backdropFilter: 'blur(20px)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-error)' }}>Revoke Agent Agreement</h3>
              <button onClick={() => setRevokingAgreement(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to revoke/terminate the agreement for <strong>{revokingAgreement.profiles?.full_name}</strong> (No: {revokingAgreement.agreement_no})?
              Once revoked, the agreement QR code will no longer verify on the website.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!revocationReason.trim()) return;
              setRevokingLoading(true);

              try {
                const { error } = await supabase
                  .from('agent_agreements')
                  .update({
                    status: 'revoked',
                    revoked_at: new Date().toISOString(),
                    revocation_reason: revocationReason.trim()
                  })
                  .eq('id', revokingAgreement.id);

                if (error) {
                  alert('Failed to revoke agreement: ' + error.message);
                } else {
                  // Automatically demote the agent to standard user
                  const { error: demoteErr } = await supabase
                    .from('profiles')
                    .update({
                      role: 'user',
                      demoted_at: new Date().toISOString()
                    })
                    .eq('id', revokingAgreement.agent_id);

                  if (demoteErr) {
                    console.error('Failed to demote agent on revocation:', demoteErr.message);
                  }

                  alert('Agreement revoked and agent demoted successfully.');
                  logAdminAction('Revoke Agreement', `Revoked agreement ${revokingAgreement.agreement_no} for agent ${revokingAgreement.profiles?.full_name}. Reason: ${revocationReason.trim()}`);
                  setRevokingAgreement(null);
                  setRevocationReason('');
                  await fetchAgreementsData();
                  await fetchAgentsData();
                }
              } catch (err) {
                console.error(err);
                alert('Error revoking agreement.');
              } finally {
                setRevokingLoading(false);
              }
            }} style={{ display: 'grid', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Reason for Revocation / Termination</label>
                <textarea
                  className="input-field"
                  placeholder="Explain why this agreement is being terminated..."
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRevokingAgreement(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ background: '#ef4444', color: '#fff' }} disabled={revokingLoading}>
                  {revokingLoading ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                      <option value="salaried">Salaried Only</option>
                      <option value="self_employed">Self Employed Only</option>
                      <option value="both">Both (Salaried & Self Employed)</option>
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
                    Direct Submit to Admin (Admin will apply on behalf of Agent)
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Upload Bank Policy & Process Flow PDF
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: 'var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            alert('PDF file size must be under 2MB.');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPolicyForm(prev => ({ ...prev, policy_pdf: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }}
                        style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                      />
                    </div>
                    {policyForm.policy_pdf && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ margin: 0, padding: '6px 12px', fontSize: '11px' }}
                          onClick={() => {
                            const base64Data = policyForm.policy_pdf;
                            const base64Parts = base64Data.split(';base64,');
                            const contentType = base64Parts[0].split(':')[1] || 'application/pdf';
                            const raw = window.atob(base64Parts[1] || base64Data);
                            const rawLength = raw.length;
                            const uInt8Array = new Uint8Array(rawLength);
                            for (let i = 0; i < rawLength; ++i) {
                              uInt8Array[i] = raw.charCodeAt(i);
                            }
                            const blob = new Blob([uInt8Array], { type: contentType });
                            const blobUrl = URL.createObjectURL(blob);
                            window.open(blobUrl, '_blank');
                          }}
                        >
                          👁Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ margin: 0, padding: '6px 12px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                          onClick={() => {
                            setPolicyForm(prev => ({ ...prev, policy_pdf: '' }));
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
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
                    Serves all Pincodes in India (No mapping needed)
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
                      Serviced Pincodes ({filteredPincodes.length} / {bankPincodes.length})
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
                      placeholder="Search mapped pincodes..."
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
                            Delete Selected ({selectedPincodeIds.length})
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>{selectedAgent.role === 'user' ? 'Inspect User Profile' : 'Inspect Agent Profile'}</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  {selectedAgent.role === 'user' ? `User ID: ${selectedAgent.id}` : `Agent Code: ${selectedAgent.agent_code}`} | Joined {new Date(selectedAgent.created_at).toLocaleDateString('en-IN')}
                </p>
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
                  <span style={{ fontSize: '24px' }}></span>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{selectedAgent.full_name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: selectedAgent.demoted_at ? 'var(--color-error)' : 'var(--color-text-secondary)', fontWeight: selectedAgent.demoted_at ? 600 : 400 }}>
                  {selectedAgent.role === 'user' ? 'Registered User' : (selectedAgent.demoted_at ? 'Revoked / Demoted Partner' : 'Official Partner')}
                </p>
              </div>
            </div>

            {/* Profile Lock Status */}
            {selectedAgent.role !== 'user' && (
              <>
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Lock Status</h4>
              <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Status</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_locked ? 'var(--color-error)' : 'var(--color-success)', marginTop: '4px' }}>
                    {selectedAgent.profile_locked ? 'Locked' : 'Unlocked'}
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
                  {selectedAgent.profile_locked ? 'Unlock Agent Profile' : 'Lock Agent Profile'}
                </button>
              </div>
            </div>

            {/* Agent Partner Agreement Status */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>DSA Appointment Agreement</h4>
              <div className="form-card" style={{ display: 'grid', gap: '12px', padding: '20px', background: 'var(--color-bg-card)' }}>
                {(() => {
                  const ag = agreements.find(x => x.agent_id === selectedAgent.id);
                  if (!ag) {
                    return (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No signed partner agreement found in database for this agent.
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Number:</span>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{ag.agreement_no}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Signed On:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(ag.signed_at).toLocaleDateString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Status:</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: ag.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: ag.status === 'active' ? 'var(--color-success)' : '#ef4444',
                          textTransform: 'uppercase'
                        }}>{ag.status}</span>
                      </div>
                      {ag.status !== 'active' && ag.revocation_reason && (
                        <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '10px', marginTop: '4px' }}>
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Revocation Reason:</span>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', lineHeight: '1.5' }}>{ag.revocation_reason}</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => window.open(`/agreement-print?id=${selectedAgent.id}`, '_blank')}
                          className="btn btn-secondary btn-sm"
                          style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                        >
                          Download / Print PDF
                        </button>
                        {ag.status === 'active' ? (
                          <button
                            onClick={() => {
                              setSelectedAgent(null); // close drawer to reveal modal cleanly
                              setRevokingAgreement(ag);
                            }}
                            className="btn btn-sm"
                            style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)', background: '#ef4444', color: '#fff' }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to reactivate agreement ${ag.agreement_no}?`)) return;
                              try {
                                const { error } = await supabase
                                  .from('agent_agreements')
                                  .update({ status: 'active', revoked_at: null, revocation_reason: null })
                                  .eq('id', ag.id);
                                if (error) alert(error.message);
                                else {
                                  // Promote profile back to agent
                                  const { error: promoteErr } = await supabase
                                    .from('profiles')
                                    .update({ role: 'agent', demoted_at: null })
                                    .eq('id', ag.agent_id);

                                  if (promoteErr) {
                                    console.error('Failed to promote user back to agent on agreement reactivation:', promoteErr.message);
                                  }

                                  alert('Agreement reactivated and agent restored successfully.');
                                  logAdminAction('Reactivate Agreement', `Reactivated agreement ${ag.agreement_no} for agent ${selectedAgent.full_name}.`);
                                  await fetchAgreementsData();
                                  await fetchAgentsData();

                                  // Update local selectedAgent state to reflect re-promotion
                                  setSelectedAgent(prev => prev ? { ...prev, role: 'agent', demoted_at: null } : null);
                                }
                              } catch (err) { console.error(err); }
                            }}
                            className="btn btn-sm"
                            style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this agreement and allow the agent to sign a new one? This will completely clear their current signature and agreement details.\n\nThe agent will see a re-sign prompt on their dashboard.")) return;
                            try {
                              const { error } = await supabase
                                .from('agent_agreements')
                                .delete()
                                .eq('id', ag.id);
                              if (error) {
                                alert("Failed to regenerate agreement: " + error.message);
                              } else {
                                // Create an approved admin-pushed regen request so the agent sees the re-sign prompt
                                await supabase.from('agreement_regen_requests').insert({
                                  agent_id: ag.agent_id,
                                  requested_by: 'admin',
                                  status: 'approved',
                                  admin_note: 'Agreement reset by administrator from ledger.',
                                });
                                alert("Agreement deleted successfully! The agent will now see a re-sign prompt on their dashboard.");
                                logAdminAction('Regenerate Agreement', `Deleted agreement ${ag.agreement_no} for agent ${selectedAgent.full_name} to allow re-signing.`);
                                await fetchAgreementsData();
                                await fetchRegenRequests();
                                handleSelectAgent(null);
                              }
                            } catch(err) {
                              console.error(err);
                            }
                          }}

                          className="btn btn-sm"
                          style={{
                            margin: 0,
                            flex: 1,
                            padding: '6px 12px',
                            fontSize: 'var(--text-xs)',
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }}
                        >
                          Regenerate (Re-sign) 🔄
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Regen Request Management Panel */}
            {(() => {
              const agentRegenReqs = regenRequests.filter(r => r.agent_id === selectedAgent?.id);
              return agentRegenReqs.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔄 Re-sign Requests
                    <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>{agentRegenReqs.length}</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {agentRegenReqs.map(req => (
                      <div key={req.id} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                              {req.requested_by === 'agent' ? '👤 Agent Request' : '🔧 Admin Request'}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                              {new Date(req.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase',
                            background: req.status === 'pending' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                            color: req.status === 'pending' ? '#60a5fa' : '#34d399'
                          }}>{req.status}</span>
                        </div>
                        {req.reason && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
                            Reason: &quot;{req.reason}&quot;
                          </div>
                        )}
                        {req.status === 'pending' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              type="text"
                              placeholder="Admin note (Required if rejecting)"
                              className="input-field"
                              style={{ fontSize: '11px', padding: '6px 10px' }}
                              onChange={e => setRegenAdminNote(e.target.value)}
                              value={regenAdminNote}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                disabled={regenActionLoading === req.id}
                                onClick={async () => {
                                  setRegenActionLoading(req.id);
                                  try {
                                    // Approve: delete current agreement + mark request approved
                                    await supabase.from('agent_agreements').delete().eq('agent_id', req.agent_id);
                                    const { error } = await supabase.from('agreement_regen_requests')
                                      .update({ status: 'approved', admin_note: regenAdminNote || null, resolved_at: new Date().toISOString() })
                                      .eq('id', req.id);
                                    if (error) { alert(error.message); return; }
                                    logAdminAction('Approve Regen Request', `Approved re-sign request for agent ${selectedAgent?.full_name}.`);
                                    setRegenAdminNote('');
                                    await fetchRegenRequests();
                                    await fetchAgreementsData();
                                  } catch(err) { console.error(err); }
                                  finally { setRegenActionLoading(null); }
                                }}
                                className="btn btn-sm"
                                style={{ flex: 1, margin: 0, padding: '6px 10px', fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.25)' }}
                              >
                                {regenActionLoading === req.id ? '…' : '✅ Approve'}
                              </button>
                              <button
                                disabled={regenActionLoading === req.id}
                                onClick={async () => {
                                  if (!regenAdminNote || !regenAdminNote.trim()) {
                                    alert("Please enter the reason for rejection in the Admin Note field.");
                                    return;
                                  }
                                  setRegenActionLoading(req.id);
                                  try {
                                    const { error } = await supabase.from('agreement_regen_requests')
                                      .update({ status: 'rejected', admin_note: regenAdminNote.trim(), resolved_at: new Date().toISOString() })
                                      .eq('id', req.id);
                                    if (error) { alert(error.message); return; }
                                    logAdminAction('Reject Regen Request', `Rejected re-sign request for agent ${selectedAgent?.full_name}.`);
                                    setRegenAdminNote('');
                                    await fetchRegenRequests();
                                  } catch(err) { console.error(err); }
                                  finally { setRegenActionLoading(null); }
                                }}
                                className="btn btn-sm"
                                style={{ flex: 1, margin: 0, padding: '6px 10px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                              >
                                {regenActionLoading === req.id ? '…' : '❌ Reject'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* No pending regen requests — admin can push one */
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Push Re-sign to Agent</h4>
                  <div style={{ background: 'var(--color-bg-card)', border: 'var(--border-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                      Push a re-sign request to this agent. Their current agreement will be deleted immediately and they will be prompted to upload a new signature.
                    </p>
                    <input
                      type="text"
                      placeholder="Admin note / reason (optional)"
                      className="input-field"
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      value={regenAdminNote}
                      onChange={e => setRegenAdminNote(e.target.value)}
                    />
                    <button
                      disabled={!selectedAgent}
                      onClick={async () => {
                        if (!confirm(`Push re-sign request to ${selectedAgent?.full_name}? Their current agreement will be deleted immediately.`)) return;
                        try {
                          // Delete current agreement
                          await supabase.from('agent_agreements').delete().eq('agent_id', selectedAgent.id);
                          // Create an approved admin-pushed regen request
                          await supabase.from('agreement_regen_requests').insert({
                            agent_id: selectedAgent.id,
                            requested_by: 'admin',
                            status: 'approved',
                            admin_note: regenAdminNote || null,
                          });
                          logAdminAction('Admin Push Re-sign', `Pushed re-sign request to agent ${selectedAgent?.full_name}.`);
                          setRegenAdminNote('');
                          await fetchRegenRequests();
                          await fetchAgreementsData();
                          alert(`Re-sign request pushed to ${selectedAgent?.full_name}. They will see a prompt to re-sign on their dashboard.`);
                        } catch(err) {
                          console.error(err);
                          alert('Failed to push re-sign request.');
                        }
                      }}
                      className="btn btn-sm"
                      style={{ margin: 0, padding: '8px 14px', fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}
                    >
                      🔄 Push Re-sign Request to Agent
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Profile Update Request */}

            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Update Request</h4>
              <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--color-bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Request Status</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_update_requested ? 'var(--color-warning)' : 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {selectedAgent.profile_update_requested ? 'Update Requested — Agent will see reminders every 5 min' : 'No pending request'}
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
                      Request Profile Update
                    </button>
                  </div>
                )}
              </div>
            </div>



              </>
            )}
            {/* Profile Basics */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Basics & Contact</h4>
                {selectedAgent.role !== 'user' && (
                  <button
                    onClick={() => handleDemoteAgent(selectedAgent.id)}
                    disabled={agentActionLoading === selectedAgent.id}
                    className="btn btn-secondary btn-sm"
                    style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-error)', border: 'var(--border-error)' }}
                  >
                    Demote to Normal User
                  </button>
                )}
              </div>
              {isEditingAgent ? (
                <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                      {selectedAgent.role === 'user' ? 'User Name' : 'Agent Name'}
                    </label>
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
                  {selectedAgent.role !== 'user' && (
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sub-Agent Count</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-info)', marginTop: '8px' }}>{selectedAgentSubAgents.length}</div>
                    </div>
                  )}
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
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      {selectedAgent.role === 'user' ? 'User Name' : 'Agent Name'}
                    </div>
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
                  {selectedAgent.role !== 'user' && (
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sub-Agent Count</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-info)' }}>{selectedAgentSubAgents.length}</div>
                    </div>
                  )}
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

                        {selectedAgent.role !== 'user' ? (
              <>
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
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Secondary ID Proof Type</label>
                    <select
                      className="input-field"
                      value={editAgentData.id_type_2 || 'Aadhaar Card'}
                      onChange={(e) => setEditAgentData({ ...editAgentData, id_type_2: e.target.value })}
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID Card">Voter ID Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Secondary ID Number</label>
                    <input 
                      type="text"
                      className="input-field"
                      maxLength={12}
                      value={editAgentData.id_number_2 || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, id_number_2: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-card" style={{ display: 'grid', gap: '16px', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                  {/* Selfie block (Top of IDs for better layout) */}
                  {selectedAgent.selfie && (
                    <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Agent Live Selfie</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedAgent.selfie} alt="Selfie" style={{ maxWidth: '160px', maxHeight: '160px', borderRadius: '8px', border: 'var(--border-light)', objectFit: 'cover' }} />
                    </div>
                  )}

                  <h5 style={{ fontSize: '11px', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Primary Identity Proof</h5>
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

                  {/* Secondary ID Block */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px' }}>
                    <h5 style={{ fontSize: '11px', color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>Secondary Identity Proof</h5>
                    <div className="responsive-grid-2" style={{ gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Identity Proof Type</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.id_type_2 || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Identity ID Number</div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.id_number_2 || 'N/A'}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Identity Document File</div>
                      {selectedAgent.id_file_2 ? (
                        selectedAgent.id_file_2.startsWith('data:application/pdf') || !selectedAgent.id_file_2.startsWith('data:image/') ? (
                          <a
                            href={selectedAgent.id_file_2}
                            download={`secondary-identity-${selectedAgent.id_type_2 || 'verification'}`}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            View / Download Secondary Identity Proof PDF
                          </a>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={selectedAgent.id_file_2} alt="Secondary ID Verification" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: 'var(--border-light)' }} />
                        )
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No document uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Details */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Bank & Payout Details</h4>
              {isEditingAgent ? (
                <div className="form-card responsive-grid-2" style={{ padding: '16px 20px', background: 'var(--color-bg-card)', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Bank Account Holder Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.bank_holder_name || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, bank_holder_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Bank Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.bank_name || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, bank_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Bank Account Number</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.bank_account_no || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, bank_account_no: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>IFSC Code</label>
                    <input 
                      type="text"
                      className="input-field"
                      value={editAgentData.bank_ifsc || ''}
                      onChange={(e) => setEditAgentData({ ...editAgentData, bank_ifsc: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-card" style={{ display: 'grid', gap: '16px', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                  <div className="responsive-grid-2" style={{ gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Account Holder Name</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.bank_holder_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Bank Name</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.bank_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Account Number</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.bank_account_no || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>IFSC Code</div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selectedAgent.bank_ifsc || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>Cancelled Cheque File</div>
                    {selectedAgent.cancelled_cheque ? (
                      selectedAgent.cancelled_cheque.startsWith('data:application/pdf') || !selectedAgent.cancelled_cheque.startsWith('data:image/') ? (
                        <a
                          href={selectedAgent.cancelled_cheque}
                          download={`cancelled-cheque-${selectedAgent.bank_name || 'bank'}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          View / Download Cancelled Cheque PDF
                        </a>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={selectedAgent.cancelled_cheque} alt="Cancelled Cheque" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: 'var(--border-light)' }} />
                      )
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No cheque uploaded</span>
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
                          Inspect 👁</button>
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
                            {app.problem}
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
              </>
) : (

              (() => {
                const userInquiries = inquiries.filter(inq => inq.user_id === selectedAgent.id || (inq.mobile && inq.mobile === selectedAgent.phone));
                return (
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      User Loan Inquiries ({userInquiries.length})
                    </h4>
                    {userInquiries.length === 0 ? (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No inquiries submitted by this user.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {userInquiries.map(inq => {
                          const isBl = inq.eligible_banks?.some(b => b.includes('(BL)'));
                          return (
                            <div key={inq.id} style={{ background: 'var(--color-bg-card)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {inq.name}
                                  <span className={isBl ? 'badge badge-warning' : 'badge badge-primary'} style={{ fontSize: '9px', padding: '1px 4px' }}>
                                    {isBl ? 'BL' : 'PL'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                  Salary: ₹{Number(inq.salary).toLocaleString('en-IN')} | CIBIL: {inq.credit_score} | Pincode: {inq.pincode}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                  Submitted: {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedInquiry(inq)}
                                className="btn btn-secondary btn-sm"
                                style={{ margin: 0, padding: '4px 8px', fontSize: '10px' }}
                              >
                                Details
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()

            )}


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
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-primary)' }}>{selectedApplication.bank_name} Partner Portal</div>
                    
                    {matchedPolicy.direct_submit && (
                      <div style={{ fontSize: '11px', color: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                        <strong>Direct Submission Force Enabled</strong>: The agent submitted this client directly. You must log in and submit it on the partner portal below.
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
                        <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>Login Credentials for Portal:</div>
                        {username && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>• <strong>Username / ID:</strong> {username}</span>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(username); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>Copy</button>
                          </div>
                        )}
                        {password && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>• <strong>Password / OTP:</strong> {password}</span>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(password); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>Copy</button>
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
                        Open Bank Partner Portal ↗
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
                      <option value="not interested">Not Interested</option>
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
                    Save Status Notes
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

                      {/* Modal for Creating / Editing Blogs */}
                      {isBlogModalOpen && (
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(10px)',
                          zIndex: 999999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px'
                        }}>
                          <div style={{
                            background: 'var(--color-bg-card)',
                            border: 'var(--border-light)',
                            borderRadius: 'var(--border-radius-lg)',
                            width: '100%',
                            maxWidth: '750px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-xl)',
                            padding: '32px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {selectedBlog ? 'Edit Blog Post' : 'Write New Blog Post'}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setIsBlogModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '20px' }}
                              >
                                &times;
                              </button>
                            </div>

                            {blogError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{blogError}</div>}
                            {blogSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: '8px', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{blogSuccess}</div>}

                            <form onSubmit={handleSaveBlog} style={{ display: 'grid', gap: '20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                  <label className="input-label">Title <span className="required">*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter article title"
                                    value={blogForm.title}
                                    onChange={(e) => {
                                      const title = e.target.value;
                                      const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                      setBlogForm(prev => ({ ...prev, title, slug: autoSlug }));
                                    }}
                                    required
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Slug <span className="required">*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    placeholder="url-friendly-slug"
                                    value={blogForm.slug}
                                    onChange={(e) => setBlogForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                                    required
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'end' }}>
                                <div className="input-group">
                                  <label className="input-label">Attach Cover Image (JPEG / PNG)</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="input-field"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        setBlogImageFile(file);
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setBlogImagePreview(ev.target.result);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    style={{ padding: '8px 12px' }}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Author</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={blogForm.author}
                                    onChange={(e) => setBlogForm(prev => ({ ...prev, author: e.target.value }))}
                                  />
                                </div>
                              </div>

                              {blogImagePreview && (
                                <div style={{ border: 'var(--border-light)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Cover Image Preview</p>
                                  <img src={blogImagePreview} alt="Blog Cover Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                                </div>
                              )}

                              <div className="input-group">
                                <label className="input-label">Excerpt (Brief Summary) <span className="required">*</span></label>
                                <textarea
                                  className="input-field"
                                  placeholder="Short 1-2 sentence preview summary of the post..."
                                  value={blogForm.excerpt}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                                  rows={2}
                                  required
                                />
                              </div>

                              <div className="input-group">
                                <label className="input-label">Content (Supports HTML / Raw Markdown) <span className="required">*</span></label>
                                <textarea
                                  className="input-field"
                                  placeholder="Write the full post contents here. Use standard HTML tags (e.g. <p>, <h3>, <ul>, <li>, <strong>) to format text."
                                  value={blogForm.content}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                                  rows={12}
                                  required
                                  style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6 }}
                                />
                              </div>

                              <label className="checkbox-wrapper" style={{ margin: '8px 0' }}>
                                <input
                                  type="checkbox"
                                  className="checkbox-input"
                                  checked={blogForm.published}
                                  onChange={(e) => setBlogForm(prev => ({ ...prev, published: e.target.checked }))}
                                />
                                <span className="checkbox-label" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  Publish immediately (visible to public)
                                </span>
                              </label>

                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', borderTop: 'var(--border-subtle)', paddingTop: '16px' }}>
                                <button
                                  type="button"
                                  onClick={() => setIsBlogModalOpen(false)}
                                  className="btn btn-secondary"
                                  disabled={blogUploading}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  disabled={blogUploading}
                                  style={{ background: 'var(--gradient-primary)', border: 'none', color: '#fff' }}
                                >
                                  {blogUploading ? 'Saving...' : 'Save Post'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

      <Footer />
    </>
  );
}
