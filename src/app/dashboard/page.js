'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        while (base64.length * 0.75 > 500 * 1024 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        if (base64.length * 0.75 > 500 * 1024) {
          reject(new Error('Unable to compress image under 500kb. Please upload a smaller image.'));
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const processPdf = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 500 * 1024) {
      reject(new Error('PDFs must be under 500kb.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
};

const BANK_AFFILIATE_LINKS = {
  'POONAWALLA': 'https://instant-pocket-loan.poonawallafincorp.com/?utm_DSA_Code=PKA00192&UTM_Partner_Name=BuddyLoan&UTM_Partner_Medium=hand2handloans_bl_dsa',
  'UNITY BANK': 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=buddyloan&utm_medium=hand2handloans_bl_dsa&utm_campaign=DSA',
  'PREFR': 'https://marketplace.prefr.com/buddyloan/GetStarted?startPage=base',
  'HERO': 'https://loans.apps.herofincorp.com/en/personal-loan?utm_campaign=buddyloan_rdf_26&utm_content=hand2handloans_bl_dsa&af_xp=custom&pid=partnership_bdl&is_retargeting=true&af_reengagement_window=30d&c=buddyloan_rdf_26&utm_source=partnership_bdl',
  'BHARATPE': 'https://consumer-credit.bharatpe.in/creditHome.html?utm_campaign=trillionloan&utm_campaign=trillionloans&utm_partner=BLTL&utm_content=DSA&utm_medium=swiftloans_dsa_Hand2Handloans',
  'CREDIT SEA': 'https://www.creditsea.com/onboarding/sign-up/enter-mobile?source=31697402&medium=DSA&campaign=ELDSA_dsa_Hand2Handloans',
  'DMI': 'https://play.google.com/store/apps/details?id=in.dmifinance.app&referrer=utm_source%3DMymoneymantra%26utm_medium%3DHandtohandloan%26utm_term%3D1100110011%26utm_campaign%3DEARNTRA',
  'L&T': 'https://www.moneycontrolpay.com/?utm_source=ILB&utm_campaign=RohanGupta',
  'FIBE': 'https://portal.fibe.in/easy-loan?utm_medium=hand2handloans_bl_dsa&campaignid=dsa&utm_source=BUDDYLOANPA',
  'MUTHOOT DAILY BL': 'https://creditlink.finbox.in/?partnerCode=LS_NUSHZC&agentCode=sc113356&productType=business_loan_edi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY BL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY PL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'INCRED PL': 'https://pl.incred.com/open-market-sales/login',
  'FINNABLE': 'https://partner.finnable.com/auth/login'
};

const getAffiliateLink = (bankName, loanType = 'PL', muthootSubType = 'daily') => {
  if (!bankName) return null;
  const normalized = bankName.toUpperCase();
  
  if (normalized.includes('MUTHOOT')) {
    if (loanType === 'BL') {
      if (muthootSubType === 'monthly') {
        return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY BL'];
      }
      return BANK_AFFILIATE_LINKS['MUTHOOT DAILY BL'];
    }
    return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY PL'];
  }
  
  if (normalized.includes('INCRED')) {
    return BANK_AFFILIATE_LINKS['INCRED PL'];
  }
  
  if (normalized.includes('FINNABLE')) {
    return BANK_AFFILIATE_LINKS['FINNABLE'];
  }

  if (normalized.includes('POONAWALLA') || normalized.includes('POONWALA')) return BANK_AFFILIATE_LINKS['POONAWALLA'];
  if (normalized.includes('UNITY')) return BANK_AFFILIATE_LINKS['UNITY BANK'];
  if (normalized.includes('PREFR')) return BANK_AFFILIATE_LINKS['PREFR'];
  if (normalized.includes('HERO')) return BANK_AFFILIATE_LINKS['HERO'];
  if (normalized.includes('BHARATPE') || normalized.includes('BHARAT PE')) return BANK_AFFILIATE_LINKS['BHARATPE'];
  if (normalized.includes('CREDIT SEA') || normalized.includes('CREDITSEA')) return BANK_AFFILIATE_LINKS['CREDIT SEA'];
  if (normalized.includes('DMI')) return BANK_AFFILIATE_LINKS['DMI'];
  if (normalized.includes('L&T') || normalized.includes('L & T') || normalized.includes('LANDT')) return BANK_AFFILIATE_LINKS['L&T'];
  if (normalized.includes('FIBE')) return BANK_AFFILIATE_LINKS['FIBE'];
  return null;
};

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normal User inquiries
  const [inquiries, setInquiries] = useState([]);
  const [policies, setPolicies] = useState([]);

  // Agent Specific Data
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileTabSelectOpen, setIsMobileTabSelectOpen] = useState(false);
  const [showDemotionPopup, setShowDemotionPopup] = useState(false);
  const [showProfileUpdatePopup, setShowProfileUpdatePopup] = useState(false);
  const [applications, setApplications] = useState([]);
  const [subAgents, setSubAgents] = useState([]);
  const [subAgentDisbursedApps, setSubAgentDisbursedApps] = useState([]);
  const [copied, setCopied] = useState(false);

  // Affiliate link pending status update modal state
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [updatingStatusState, setUpdatingStatusState] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState('applied');
  const [statusProblemText, setStatusProblemText] = useState('');

  // Application details modal state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [updatingAppDetailsState, setUpdatingAppDetailsState] = useState(false);
  const [appDetailsStatusValue, setAppDetailsStatusValue] = useState('applied');
  const [appDetailsProblemText, setAppDetailsProblemText] = useState('');

  // Sub-agent details modal state
  const [selectedSubAgent, setSelectedSubAgent] = useState(null);

  // Profile Form State
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    fathers_name: '',
    current_address: '',
    permanent_address: '',
    pincode: '',
    city: '',
    state: '',
    marital_status: '',
    avatar: '',
    id_type: '',
    id_number: '',
    id_file: '',
    id_type_2: '',
    id_number_2: '',
    id_file_2: '',
    selfie: '',
    cancelled_cheque: '',
    bank_holder_name: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: ''
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Payout Request States
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' or 'BANK'
  const [upiId, setUpiId] = useState('');
  const [accName, setAccName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [bankNameVal, setBankNameVal] = useState('');
  const [ifscVal, setIfscVal] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  const getBankLogo = (bankName) => {
    if (!bankName) return '';
    const normName = bankName.toUpperCase().replace(/\(BL\)/g, '').trim();
    const policy = policies.find(p => p.bank_name.toUpperCase().replace(/\(BL\)/g, '').trim() === normName);
    return policy ? policy.logo_url : '';
  };

  const fetchInquiries = async (userId) => {
    const { data, error } = await supabase
      .from('user_inquiries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
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
  };

  const fetchAgentData = async (userId, agentCode) => {
    // 1. Fetch submitted client applications
    const { data: appData, error: appErr } = await supabase
      .from('applications')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false });

    if (appErr) console.error('Error fetching client applications:', appErr);
    else setApplications(appData || []);

    // 2. Fetch payout requests
    const { data: payData, error: payErr } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false });

    if (payErr) console.error('Error fetching payout requests:', payErr);
    else setPayoutRequests(payData || []);

    if (agentCode) {
      // 3. Fetch referred sub-agents
      const { data: saData, error: saErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by', agentCode)
        .order('created_at', { ascending: false });

      if (saErr) console.error('Error fetching sub-agents:', saErr);
      else {
        setSubAgents(saData || []);

        // 4. Fetch sub-agent disbursed applications to calculate referral commission (0.5%)
        if (saData && saData.length > 0) {
          const saIds = saData.map(sa => sa.id);
          const { data: saApps, error: saAppsErr } = await supabase
            .from('applications')
            .select('*')
            .in('agent_id', saIds)
            .or('status.eq.Disbursed,status.eq.disbursed')
            .order('created_at', { ascending: false });

          if (saAppsErr) console.error('Error fetching subagent applications:', saAppsErr);
          else setSubAgentDisbursedApps(saApps || []);
        }
      }
    }
  };

  // Effect to check if there is a pending application status update from an affiliate link check
  useEffect(() => {
    const checkPendingUpdate = () => {
      const stored = localStorage.getItem('pending_status_update');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPendingStatusUpdate(parsed);
          setNewStatusValue('applied');
          setStatusProblemText('');
        } catch (e) {
          console.error('Error parsing pending status update:', e);
        }
      }
    };

    // Check on mount and also when tab is refocused
    checkPendingUpdate();
    window.addEventListener('focus', checkPendingUpdate);
    return () => {
      window.removeEventListener('focus', checkPendingUpdate);
    };
  }, []);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!pendingStatusUpdate) return;
    setUpdatingStatusState(true);

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatusValue,
          problem: statusProblemText.trim() || null
        })
        .eq('id', pendingStatusUpdate.appId);

      if (error) {
        alert('Failed to update application status: ' + error.message);
      } else {
        alert('Application status successfully updated!');
        localStorage.removeItem('pending_status_update');
        setPendingStatusUpdate(null);
        // Refresh applications list
        if (user) {
          fetchAgentData(user.id, profile?.agent_code);
        }
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setUpdatingStatusState(false);
    }
  };

  const handleUpdateAppDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApplication) return;
    setUpdatingAppDetailsState(true);

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: appDetailsStatusValue,
          problem: appDetailsProblemText.trim() || null
        })
        .eq('id', selectedApplication.id);

      if (error) {
        alert('Failed to update application details: ' + error.message);
      } else {
        alert('Application details updated successfully!');
        setSelectedApplication(null);
        // Refresh applications list
        if (user) {
          fetchAgentData(user.id, profile?.agent_code);
        }
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setUpdatingAppDetailsState(false);
    }
  };

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/dashboard');
          return;
        }

        setUser(session.user);

        // Fetch bank policies for resolving logos in real time
        const { data: polData } = await supabase.from('bank_policies').select('bank_name, logo_url, apply_url, portal_username, portal_password, direct_submit');
        if (polData) setPolicies(polData);

        // Fetch profile to determine role
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profErr || !prof) {
          console.error('Error fetching profile:', profErr);
          // Fallback user state
          const fallbackProfile = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
            email: session.user.email,
            role: 'user',
            approved: true
          };
          setProfile(fallbackProfile);
          await fetchInquiries(session.user.id);
        } else {
          setProfile(prof);
          setProfileFormData({
            full_name: prof.full_name || '',
            email: prof.email || '',
            phone: prof.phone || '',
            dob: prof.dob || '',
            fathers_name: prof.fathers_name || '',
            current_address: prof.current_address || '',
            permanent_address: prof.permanent_address || '',
            pincode: prof.pincode || '',
            city: prof.city || '',
            state: prof.state || '',
            marital_status: prof.marital_status || '',
            avatar: prof.avatar || '',
            id_type: prof.id_type || '',
            id_number: prof.id_number || '',
            id_file: prof.id_file || '',
            id_type_2: prof.id_type_2 || '',
            id_number_2: prof.id_number_2 || '',
            id_file_2: prof.id_file_2 || '',
            selfie: prof.selfie || '',
            cancelled_cheque: prof.cancelled_cheque || '',
            bank_holder_name: prof.bank_holder_name || '',
            bank_name: prof.bank_name || '',
            bank_account_no: prof.bank_account_no || '',
            bank_ifsc: prof.bank_ifsc || ''
          });

          if (prof.role === 'agent') {
            // Agent data fetching
            await fetchAgentData(session.user.id, prof.agent_code);
            
            // Check if profile is complete (less than 100%)
            const fieldsVal = [
              prof.full_name,
              prof.email,
              prof.phone,
              prof.dob,
              prof.fathers_name,
              prof.current_address,
              prof.permanent_address,
              prof.pincode,
              prof.marital_status,
              prof.avatar,
              prof.id_type,
              prof.id_number,
              prof.id_file,
              prof.id_type_2,
              prof.id_number_2,
              prof.id_file_2,
              prof.selfie,
              prof.cancelled_cheque,
              prof.bank_holder_name,
              prof.bank_name,
              prof.bank_account_no,
              prof.bank_ifsc
            ];
            const filled = fieldsVal.filter(f => f && f.toString().trim() !== '').length;
            const pct = Math.round((filled / fieldsVal.length) * 100);
            if (pct < 100) {
              setShowProfileUpdatePopup(true);
            }
          } else {
            // Customer data fetching
            await fetchInquiries(session.user.id);
            await fetchAgentData(session.user.id, prof.agent_code);
            if (prof.demoted_at) {
              setActiveTab('inquiries');
              
              // Check demoted popup count
              const countKey = `demoted_popup_count_${prof.id}`;
              const count = parseInt(localStorage.getItem(countKey) || '0', 10);
              if (count < 3) {
                setShowDemotionPopup(true);
              }
            }
          }
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

  const handleCopyLink = () => {
    if (!profile?.agent_code) return;
    const url = `${window.location.origin}/signup?referred_by=${profile.agent_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper status styling for applications
  const getStatusBadgeStyle = (status) => {
    if (!status) return {};
    const s = status.toLowerCase();
    switch (s) {
      case 'applied':
      case 'pending':
        return { color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', border: 'var(--border-light)' };
      case 'in progress':
      case 'in process':
      case 'kyc verification':
        return { color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: 'var(--border-warning)' };
      case 'approved':
        return { color: 'var(--color-info)', background: 'var(--color-info-bg)', border: 'var(--border-accent)' };
      case 'disbursed':
      case 'paid':
        return { color: 'var(--color-success)', background: 'var(--color-success-bg)', border: 'var(--border-success)', boxShadow: 'var(--shadow-glow-success)' };
      case 'rejected':
        return { color: 'var(--color-error)', background: 'var(--color-error-bg)', border: 'var(--border-error)' };
      default:
        return { color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', border: 'var(--border-light)' };
    }
  };

  // Calculate earnings for Agent Dashboard
  const disbursedApps = applications.filter(app => app.status && app.status.toLowerCase() === 'disbursed');
  const totalDisbursedAmount = disbursedApps.reduce((acc, app) => acc + Number(app.loan_amount), 0);
  const directCommission = disbursedApps.reduce((acc, app) => acc + Number(app.commission_amount), 0);
  const referralBonus = subAgentDisbursedApps.filter(app => app.status && app.status.toLowerCase() === 'disbursed').reduce((acc, app) => acc + (Number(app.loan_amount) * 0.005), 0);
  const totalEarnings = directCommission + referralBonus;

  // Calculate Payout Metrics
  const totalPaid = payoutRequests.filter(req => req.status === 'Paid').reduce((acc, req) => acc + Number(req.amount), 0);
  const totalPending = payoutRequests.filter(req => req.status === 'Pending').reduce((acc, req) => acc + Number(req.amount), 0);
  const availableBalance = Math.max(0, totalEarnings - totalPaid - totalPending);

  const calculateCompletionPercentage = () => {
    const fields = [
      profileFormData.full_name,
      profileFormData.email,
      profileFormData.phone,
      profileFormData.dob,
      profileFormData.fathers_name,
      profileFormData.current_address,
      profileFormData.permanent_address,
      profileFormData.pincode,
      profileFormData.marital_status,
      profileFormData.avatar,
      profileFormData.id_type,
      profileFormData.id_number,
      profileFormData.id_file,
      profileFormData.id_type_2,
      profileFormData.id_number_2,
      profileFormData.id_file_2,
      profileFormData.selfie,
      profileFormData.cancelled_cheque,
      profileFormData.bank_holder_name,
      profileFormData.bank_name,
      profileFormData.bank_account_no,
      profileFormData.bank_ifsc
    ];
    const completedCount = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((completedCount / fields.length) * 100);
  };

  const handlePincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setProfileFormData(prev => ({ ...prev, pincode: cleaned }));
    
    if (cleaned.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          if (postOffice) {
            setProfileFormData(prev => ({
              ...prev,
              city: postOffice.District || '',
              state: postOffice.State || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching pincode details:', err);
      }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileSuccess('');
      setProfileError('');
      const base64 = await compressImage(file);
      setProfileFormData(prev => ({ ...prev, avatar: base64 }));
      
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: base64 })
        .eq('id', profile.id);
      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess('Profile picture updated successfully!');
        setProfile(prev => ({ ...prev, avatar: base64 }));
        showToast('✅ Profile picture updated successfully!');
      }
    } catch (err) {
      alert(err.message);
      setProfileError(err.message);
    }
  };

  const handleIdFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileSuccess('');
      setProfileError('');
      if (file.type === 'application/pdf') {
        const base64 = await processPdf(file);
        setProfileFormData(prev => ({ ...prev, id_file: base64 }));
      } else if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        setProfileFormData(prev => ({ ...prev, id_file: base64 }));
      } else {
        alert('Please upload a valid JPEG/PNG image or PDF document.');
        setProfileError('Please upload a valid JPEG/PNG image or PDF document.');
      }
    } catch (err) {
      alert(err.message);
      setProfileError(err.message);
    }
  };

  const handleIdFile2Change = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileSuccess('');
      setProfileError('');
      if (file.type === 'application/pdf') {
        const base64 = await processPdf(file);
        setProfileFormData(prev => ({ ...prev, id_file_2: base64 }));
      } else if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        setProfileFormData(prev => ({ ...prev, id_file_2: base64 }));
      } else {
        alert('Please upload a valid JPEG/PNG image or PDF document.');
        setProfileError('Please upload a valid JPEG/PNG image or PDF document.');
      }
    } catch (err) {
      alert(err.message);
      setProfileError(err.message);
    }
  };

  const handleSelfieChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileSuccess('');
      setProfileError('');
      if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        setProfileFormData(prev => ({ ...prev, selfie: base64 }));
      } else {
        alert('Please upload a valid JPEG/PNG image for selfie.');
        setProfileError('Please upload a valid JPEG/PNG image for selfie.');
      }
    } catch (err) {
      alert(err.message);
      setProfileError(err.message);
    }
  };

  const handleCancelledChequeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setProfileSuccess('');
      setProfileError('');
      if (file.type === 'application/pdf') {
        const base64 = await processPdf(file);
        setProfileFormData(prev => ({ ...prev, cancelled_cheque: base64 }));
      } else if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        setProfileFormData(prev => ({ ...prev, cancelled_cheque: base64 }));
      } else {
        alert('Please upload a valid JPEG/PNG image or PDF document.');
        setProfileError('Please upload a valid JPEG/PNG image or PDF document.');
      }
    } catch (err) {
      alert(err.message);
      setProfileError(err.message);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    // Validation checks for all required profile and verification fields
    const requiredFields = {
      full_name: 'Full Name',
      phone: 'Phone Number',
      dob: 'Date of Birth',
      fathers_name: "Father's Name",
      current_address: 'Current Address',
      permanent_address: 'Permanent Address',
      pincode: 'Pincode',
      city: 'City',
      state: 'State',
      marital_status: 'Marital Status',
      avatar: 'Profile Picture (Avatar)',
      id_type: 'Identity Proof 1 Type',
      id_number: 'Identity Proof 1 Number',
      id_file: 'Identity Proof 1 File',
      id_type_2: 'Identity Proof 2 Type',
      id_number_2: 'Identity Proof 2 Number',
      id_file_2: 'Identity Proof 2 File',
      selfie: 'Live Selfie',
      cancelled_cheque: 'Cancelled Cheque',
      bank_holder_name: 'Bank Account Holder Name',
      bank_name: 'Bank Name',
      bank_account_no: 'Bank Account Number',
      bank_ifsc: 'Bank IFSC Code'
    };

    for (const [key, label] of Object.entries(requiredFields)) {
      if (!profileFormData[key] || profileFormData[key].toString().trim() === '') {
        setProfileError(`Validation Error: ${label} is required.`);
        setSavingProfile(false);
        return;
      }
    }

    if (profileFormData.id_type === profileFormData.id_type_2) {
      setProfileError('Validation Error: Primary Identity Proof (ID 1) and Secondary Identity Proof (ID 2) must be different document types.');
      setSavingProfile(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileFormData.full_name,
          phone: profileFormData.phone,
          dob: profileFormData.dob,
          fathers_name: profileFormData.fathers_name,
          current_address: profileFormData.current_address,
          permanent_address: profileFormData.permanent_address,
          pincode: profileFormData.pincode,
          city: profileFormData.city,
          state: profileFormData.state,
          marital_status: profileFormData.marital_status,
          avatar: profileFormData.avatar,
          id_type: profileFormData.id_type,
          id_number: profileFormData.id_number,
          id_file: profileFormData.id_file,
          id_type_2: profileFormData.id_type_2,
          id_number_2: profileFormData.id_number_2,
          id_file_2: profileFormData.id_file_2,
          selfie: profileFormData.selfie,
          cancelled_cheque: profileFormData.cancelled_cheque,
          bank_holder_name: profileFormData.bank_holder_name,
          bank_name: profileFormData.bank_name,
          bank_account_no: profileFormData.bank_account_no,
          bank_ifsc: profileFormData.bank_ifsc
        })
        .eq('id', profile.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess('Profile updated successfully!');
        setProfile(prev => ({
          ...prev,
          ...profileFormData
        }));
        showToast('✅ All details updated successfully!');

        // Auto-clear profile update request when profile is 100% complete
        const fields = [
          profileFormData.full_name, profileFormData.email, profileFormData.phone,
          profileFormData.dob, profileFormData.fathers_name, profileFormData.current_address,
          profileFormData.permanent_address, profileFormData.pincode, profileFormData.marital_status,
          profileFormData.avatar, profileFormData.id_type, profileFormData.id_number, profileFormData.id_file,
          profileFormData.id_type_2, profileFormData.id_number_2, profileFormData.id_file_2,
          profileFormData.selfie, profileFormData.cancelled_cheque,
          profileFormData.bank_holder_name, profileFormData.bank_name, profileFormData.bank_account_no, profileFormData.bank_ifsc
        ];
        const isComplete = fields.every(f => f && f.toString().trim() !== '');
        if (isComplete && profile?.profile_update_requested) {
          await supabase.from('profiles').update({ 
            profile_update_requested: false,
            profile_update_message: null
          }).eq('id', profile.id);
          setProfile(prev => ({ 
            ...prev, 
            profile_update_requested: false,
            profile_update_message: null
          }));
          setShowProfileUpdatePopup(false);
          showToast('🎉 Profile 100% complete! Update request cleared.');
        }
      }
    } catch (err) {
      setProfileError('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  // 5-minute interval popup for admin-requested profile updates
  const profileRole = profile?.role;
  const profileUpdateRequested = profile?.profile_update_requested;
  useEffect(() => {
    if (profileRole !== 'agent' || !profileUpdateRequested) return;

    const checkAndShow = () => {
      if (profileUpdateRequested) {
        setShowProfileUpdatePopup(true);
      }
    };

    // Show immediately on load
    checkAndShow();

    // Then every 5 minutes
    const intervalId = setInterval(checkAndShow, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [profileUpdateRequested, profileRole]);

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
  }, [activeTab, loading, inquiries, applications, subAgents, subAgentDisbursedApps]);

  const handleOpenPayoutModal = () => {
    setPayoutAmount('');
    setUpiId('');
    setAccName('');
    setAccNo('');
    setBankNameVal('');
    setIfscVal('');
    setPayoutError('');
    setPayoutSuccess('');
    setPayoutModalOpen(true);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess('');

    const amt = Number(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayoutError('Please enter a valid payout amount.');
      return;
    }
    if (amt > availableBalance) {
      setPayoutError(`Insufficient balance. Maximum request amount is \u20B9${availableBalance.toLocaleString('en-IN')}`);
      return;
    }

    if (paymentMethod === 'UPI') {
      if (!upiId.trim() || !accName.trim()) {
        setPayoutError('Please fill in UPI ID and Account Holder Name.');
        return;
      }
    } else {
      if (!accName.trim() || !accNo.trim() || !bankNameVal.trim() || !ifscVal.trim()) {
        setPayoutError('Please fill in all bank details fields.');
        return;
      }
    }

    setSubmittingPayout(true);

    try {
      const { error } = await supabase.from('payout_requests').insert({
        agent_id: profile.id,
        amount: amt,
        upi_id: paymentMethod === 'UPI' ? upiId.trim() : null,
        account_name: accName.trim(),
        account_no: paymentMethod === 'BANK' ? accNo.trim() : null,
        bank_name: paymentMethod === 'BANK' ? bankNameVal.trim() : null,
        ifsc_code: paymentMethod === 'BANK' ? ifscVal.trim() : null,
        status: 'Pending'
      });

      if (error) {
        setPayoutError(error.message);
      } else {
        setPayoutSuccess('Payout request submitted successfully!');
        // Refresh local data
        await fetchAgentData(profile.id, profile.agent_code);
        setTimeout(() => {
          setPayoutModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setPayoutError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setSubmittingPayout(false);
    }
  };

  const renderCustomerApplications = () => {
    return (
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>
            My Loan Applications
          </h2>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Total Applications: {applications.length}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="form-card text-center" style={{ padding: '64px 32px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>No Submitted Applications</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              Find your matched banks and apply for a loan. Once submitted, your applications will appear here.
            </p>
            <Link href="/check" className="btn btn-primary">
              Check Eligibility Now
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {applications.map((app) => (
              <div 
                key={app.id} 
                className="result-card" 
                onClick={() => {
                  setSelectedApplication(app);
                  setAppDetailsStatusValue(app.status ? app.status.toLowerCase() : 'applied');
                  setAppDetailsProblemText(app.problem || '');
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  background: 'var(--color-bg-card)',
                  border: 'var(--border-light)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '20px 24px',
                  backdropFilter: 'blur(20px)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{app.client_name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {app.client_mobile}
                  </div>
                  {app.application_id && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                      ID: {app.application_id}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BankLogo bankName={app.bank_name} logoUrl={getBankLogo(app.bank_name)} size={20} />
                    <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{app.bank_name}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Type: {(() => {
                      if (app.loan_type === 'BL') return 'Business';
                      const name = (app.bank_name || '').toLowerCase();
                      if (name.includes('instant')) return 'Instant';
                      return 'Salary';
                    })()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Loan Amount</div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                    {"\u20B9"}{Number(app.loan_amount).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ ...getStatusBadgeStyle(app.status), display: 'inline-block' }}>
                    {app.status}
                  </span>
                  {app.disbursed_at && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                      Disbursed: {new Date(app.disbursed_at).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderInquiriesHistory = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '20px' }}>
            Your Loan Eligibility History
          </h2>

          {inquiries.length === 0 ? (
            <div className="form-card text-center" style={{ padding: '64px 32px', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>
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
                          <span className="badge badge-primary" style={{ background: 'var(--gradient-primary)', color: '#ffffff' }}>
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
                          {"\u20B9"}{Number(inq.salary).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Running EMIs</div>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {"\u20B9"}{Number(inq.existing_emi).toLocaleString('en-IN')}
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
                      {inq.dob && (
                        <>
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Date of Birth</div>
                            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {inq.dob}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Calculated Age</div>
                            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {calculateAge(inq.dob) !== null ? `${calculateAge(inq.dob)} yrs` : 'N/A'}
                            </div>
                          </div>
                        </>
                      )}
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
                              <BankLogo bankName={bank} logoUrl={getBankLogo(bank)} size={16} />
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
    );
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <>
      <Header />

      {/* Toast Popup Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            padding: '16px 28px',
            background: 'rgba(16, 185, 129, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            color: 'var(--color-success)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            maxWidth: '400px',
            cursor: 'pointer'
          }}
          onClick={() => setToastMessage('')}
        >
          <span>{toastMessage}</span>
          <span style={{ opacity: 0.6, fontSize: 'var(--text-xs)' }}>✖</span>
        </div>
      )}

      {/* Pending Affiliate Link Status Update Modal */}
      {pendingStatusUpdate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(15px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="form-card" style={{
            maxWidth: '500px',
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gap: '20px',
            border: 'var(--border-accent)',
            background: 'var(--color-bg-tertiary)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Update Application Status</h3>
              <button 
                onClick={() => {
                  localStorage.removeItem('pending_status_update');
                  setPendingStatusUpdate(null);
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              You recently opened an application for <strong>{pendingStatusUpdate.clientName}</strong> at <strong>{pendingStatusUpdate.bankName}</strong>. Please report the current status and any problems faced:
            </div>

            <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Application Status <span className="required">*</span></label>
                <select
                  className="input-field"
                  value={newStatusValue}
                  onChange={(e) => setNewStatusValue(e.target.value)}
                  required
                  style={{
                    background: 'var(--color-bg-input)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="applied" style={{ background: '#111827', color: '#f3f4f6' }}>Applied</option>
                  <option value="in process" style={{ background: '#111827', color: '#f3f4f6' }}>In Process</option>
                  <option value="kyc verification" style={{ background: '#111827', color: '#f3f4f6' }}>KYC Verification</option>
                  {profile?.role === 'admin' && (
                    <>
                      <option value="disbursed" style={{ background: '#111827', color: '#f3f4f6' }}>Disbursed</option>
                      <option value="rejected" style={{ background: '#111827', color: '#f3f4f6' }}>Rejected</option>
                    </>
                  )}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Issues / Problems Faced (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Specify if you faced any issues while submitting the application, so the admin is notified."
                  value={statusProblemText}
                  onChange={(e) => setStatusProblemText(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    localStorage.removeItem('pending_status_update');
                    setPendingStatusUpdate(null);
                  }}
                >
                  Skip
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ justifyContent: 'center' }} 
                  disabled={updatingStatusState}
                >
                  {updatingStatusState ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
      <main className="main-content">
        <section className="dashboard-section">
          <div className="container" style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            {loading ? (
              <div className="text-center" style={{ padding: '80px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading Dashboard...</p>
              </div>
            ) : (
              <>
                {/* Dashboard Header Banner */}
                <div className="dashboard-header-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: (profileFormData.avatar || profile?.avatar) ? 'transparent' : 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 'var(--text-xl)',
                      color: '#fff',
                      overflow: 'hidden',
                      border: (profileFormData.avatar || profile?.avatar) ? '2px solid rgba(139, 92, 246, 0.5)' : 'none',
                      boxShadow: (profileFormData.avatar || profile?.avatar) ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none',
                      flexShrink: 0
                    }}>
                      {(profileFormData.avatar || profile?.avatar) ? (
                        <img src={profileFormData.avatar || profile?.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(profile?.full_name || user?.email)
                      )}
                    </div>
                    <div>
                      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Hello, {profile?.full_name || 'User'}
                        {profile?.role === 'agent' && (
                          <span className="badge badge-primary" style={{ background: 'var(--gradient-primary)', fontSize: '10px', verticalAlign: 'middle', color: '#ffffff' }}>
                            OFFICIAL PARTNER
                          </span>
                        )}
                      </h1>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        {profile?.email} {profile?.role === 'agent' && `• Agent Code: ${profile?.agent_code}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link href="/check" className="btn btn-primary">
                      {profile?.role === 'agent' ? '🔗 Check Client Eligibility' : '+ Check New Eligibility'}
                    </Link>
                    <button onClick={handleSignOut} className="btn btn-secondary">
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Main Content Grid */}
                {profile?.role === 'user' ? (
                  /* ========================================================
                     CUSTOMER DASHBOARD VIEW
                     ======================================================== */
                  (() => {
                    const userTabs = [
                      { id: 'inquiries', label: '📁 Inquiries' },
                      { id: 'applications', label: '📝 My Applications' },
                    ];
                    if (profile?.demoted_at) {
                      userTabs.push({ id: 'payments', label: '💸 Payments & Balance' });
                    }

                    const currentTabLabel = userTabs.find(t => t.id === activeTab)?.label || '📁 Inquiries';

                    return (
                      <div className="tabs-container">
                        {/* MOBILE TABS MENU for Customer */}
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
                              {currentTabLabel}
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
                              {userTabs.map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() => {
                                    setActiveTab(tab.id);
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

                        {/* DESKTOP TABS SIDEBAR for Customer */}
                        <div className="desktop-tabs-sidebar tabs-sidebar" style={{ marginBottom: '24px' }}>
                          {userTabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} tabs-sidebar-button`}
                              style={{
                                padding: '10px 20px',
                                fontSize: 'var(--text-sm)',
                                whiteSpace: 'nowrap',
                                background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="tabs-content">
                          {activeTab === 'inquiries' && renderInquiriesHistory()}
                          {activeTab === 'applications' && renderCustomerApplications()}

                          {activeTab === 'payments' && profile?.demoted_at && (
                            <div style={{ display: 'grid', gap: '32px' }}>
                              {/* Metrics Header */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                <div className="form-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>TOTAL COMMISSION EARNED</div>
                                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                                    {"\u20B9"}{totalEarnings.toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div className="form-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>AVAILABLE BALANCE</div>
                                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{"\u20B9"}{availableBalance.toLocaleString('en-IN')}</span>
                                    {availableBalance > 0 && (
                                      <button onClick={handleOpenPayoutModal} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '11px', margin: 0 }}>
                                        Request Payout
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="form-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>PAID PAYOUTS</div>
                                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>
                                    {"\u20B9"}{totalPaid.toLocaleString('en-IN')}
                                  </div>
                                </div>
                                <div className="form-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>PENDING PAYOUTS</div>
                                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>
                                    {"\u20B9"}{totalPending.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>

                              {/* Payout Status Ledger */}
                              <div>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '20px' }}>
                                  Payout Status Ledger
                                </h2>

                                {payoutRequests.length === 0 ? (
                                  <div className="form-card text-center" style={{ padding: '32px', backdropFilter: 'blur(20px)' }}>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No payout requests logged yet.</p>
                                  </div>
                                ) : (
                                  <div className="form-card" style={{ padding: 0, backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                                      <thead>
                                        <tr style={{ background: 'var(--color-bg-glass)', borderBottom: 'var(--border-subtle)' }}>
                                          <th style={{ padding: '12px 16px' }}>Date Requested</th>
                                          <th style={{ padding: '12px 16px' }}>Amount Requested</th>
                                          <th style={{ padding: '12px 16px' }}>Payment Method</th>
                                          <th style={{ padding: '12px 16px' }}>Details</th>
                                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {payoutRequests.map((req) => (
                                          <tr key={req.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                            <td style={{ padding: '12px 16px' }}>{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{"\u20B9"}{Number(req.amount).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '12px 16px' }}>{req.upi_id ? 'UPI' : 'Bank Transfer'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                              {req.upi_id ? (
                                                <span>UPI ID: {req.upi_id}</span>
                                              ) : (
                                                <span>Bank: {req.bank_name} | Acc: {req.account_no}</span>
                                              )}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                              <span className="badge" style={{ ...getStatusBadgeStyle(req.status), fontSize: '10px' }}>
                                                {req.status}
                                              </span>
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
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* ========================================================
                     AGENT PARTNER DASHBOARD VIEW (GLASS TABS)
                     ======================================================== */
                  <div className="tabs-container">
                    {/* MOBILE TABS MENU for Active Agent */}
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
                          {activeTab === 'profile' && '👤 Profile Code'}
                          {activeTab === 'applications' && '📝 Client Applications'}
                          {activeTab === 'earnings' && '💸 Earning & Referral'}
                          {activeTab === 'subagents' && '👥 Sub-agents'}
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
                            { id: 'profile', label: '👤 Profile Code' },
                            { id: 'applications', label: '📝 Client Applications' },
                            { id: 'earnings', label: '💸 Earning & Referral' },
                            { id: 'subagents', label: '👥 Sub-agents' },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
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

                    {/* DESKTOP TABS SIDEBAR for Active Agent */}
                    <div className="desktop-tabs-sidebar tabs-sidebar" style={{ marginBottom: '24px' }}>
                      {[
                        { 
                          id: 'profile', 
                          label: 'Profile Code',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                          )
                        },
                        { 
                          id: 'applications', 
                          label: 'Client Applications',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                          )
                        },
                        { 
                          id: 'earnings', 
                          label: 'Earning & Referral',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <circle cx="8" cy="8" r="6" /><circle cx="18" cy="18" r="4" /><path d="M12 18a6 6 0 0 0-6-6" />
                            </svg>
                          )
                        },
                        { 
                          id: 'subagents', 
                          label: 'Sub-agents',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          )
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} tabs-sidebar-button`}
                          style={{
                            padding: '10px 20px',
                            fontSize: 'var(--text-sm)',
                            whiteSpace: 'nowrap',
                            background: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-bg-card)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Panels */}
                    <div className="tabs-content">
                      
                      {/* TAB 1: Profile & Agent Code */}
                      {activeTab === 'profile' && (() => {
                        const calculatedAge = calculateAge(profileFormData.dob);
                        const completionPercentage = calculateCompletionPercentage();
                        
                        return (
                          <div className="form-card" style={{ display: 'grid', gap: '24px', backdropFilter: 'blur(20px)', border: 'var(--border-light)' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, borderBottom: 'var(--border-subtle)', paddingBottom: '12px', marginBottom: 0 }}>
                              Agent Profile Management
                            </h2>

                            {/* WhatsApp Community Join Banner */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '16px',
                              background: 'rgba(37, 211, 102, 0.08)',
                              border: '1px solid rgba(37, 211, 102, 0.3)',
                              padding: '16px 20px',
                              borderRadius: 'var(--border-radius-md)',
                              marginTop: '-8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                                <div style={{
                                  background: '#25D366',
                                  borderRadius: '50%',
                                  width: '36px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{ display: 'block' }}>
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.885-6.948C16.572 2.015 14.117 1 11.514 1 6.079 1 1.656 5.37 1.652 10.8c-.001 1.716.467 3.39 1.353 4.887l-1.008 3.684 3.77-.988z" />
                                    <path d="M17.473 14.382c-.301-.151-1.787-.882-2.063-.982-.277-.1-.478-.151-.68.151-.202.3-.779.982-.955 1.182-.176.2-.352.226-.653.076-1.355-.68-2.61-1.24-3.528-2.82-.24-.41-.04-.548.1-.735.158-.21.3-.408.4-.558.1-.15.05-.282-.025-.432-.075-.15-.68-1.637-.932-2.242-.246-.588-.497-.507-.679-.516-.174-.008-.37-.01-.568-.01-.2 0-.523.074-.797.371-.273.297-1.045 1.016-1.045 2.479 0 1.462 1.067 2.873 1.218 3.071.15.2 2.1 3.2 5.088 4.49.711.307 1.267.49 1.701.628.714.227 1.365.195 1.88.117.573-.086 1.787-.73 2.039-1.436.252-.706.252-1.312.176-1.436-.076-.124-.277-.202-.578-.352z"/>
                                  </svg>
                                </div>
                                <div>
                                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#25D366' }}>Join WhatsApp Community</div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Join the official Hand to Hand Fintech agent group for updates</div>
                                </div>
                              </div>
                              <a
                                href="https://chat.whatsapp.com/HxAz1nhORjM7oPcS3o3njl"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                                style={{
                                  background: '#25D366',
                                  color: '#fff',
                                  fontWeight: 600,
                                  fontSize: 'var(--text-xs)',
                                  border: 'none',
                                  padding: '10px 16px',
                                  borderRadius: 'var(--border-radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  textDecoration: 'none',
                                  margin: 0
                                }}
                              >
                                Join Group 💬
                              </a>
                            </div>

                            {/* Completion Tracker */}
                            <div style={{ marginBottom: '8px', padding: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Profile Completion Status</span>
                                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)' }}>{completionPercentage}%</span>
                              </div>
                              <div style={{ width: '100%', height: '10px', background: 'var(--color-bg-card)', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'var(--gradient-primary)', transition: 'width 0.3s ease' }}></div>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                              <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner Unique Code</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                  <span style={{
                                    fontSize: 'var(--text-2xl)',
                                    fontWeight: 800,
                                    background: 'var(--gradient-text)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    letterSpacing: '1px',
                                    fontFamily: 'var(--font-heading)'
                                  }}>
                                    {profile?.agent_code || 'UNASSIGNED'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Invitation Link</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                                  <button onClick={handleCopyLink} className="btn btn-secondary btn-sm" style={{ gap: '8px' }}>
                                    🔗 {copied ? 'Copied Link!' : 'Copy Referral Link'}
                                  </button>
                                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                    Invite sub-agents & earn 0.5% commission override.
                                  </span>
                                </div>
                              </div>
                            </div>

                            {profileSuccess && <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>✓ {profileSuccess}</div>}
                            {profileError && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>⚠️ {profileError}</div>}
                            
                            {profile?.profile_locked && (
                              <div style={{
                                padding: '16px 20px',
                                background: 'var(--color-warning-bg)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '8px',
                                backdropFilter: 'blur(10px)',
                                color: 'var(--color-text-primary)',
                                fontSize: 'var(--text-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                                marginBottom: '16px'
                              }}>
                                <span>🔒 Profile Verified & Locked: Your profile details have been locked by the administrator. Contact support if you need to update them. Note: You can still update your Profile Picture (Avatar).</span>
                              </div>
                            )}

                            <form onSubmit={handleProfileSave} style={{ display: 'grid', gap: '20px' }}>
                              {/* Avatar Block */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', background: 'var(--color-bg-card)', padding: '16px', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-tertiary)', border: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                  {profileFormData.avatar ? (
                                    <img src={profileFormData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                  )}
                                </div>
                                <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                  <label className="input-label">Profile Picture (Avatar)</label>
                                  <input type="file" accept="image/jpeg, image/png" onChange={handleAvatarChange} style={{ fontSize: 'var(--text-xs)' }} />
                                  <p className="input-hint">Formats: JPG, PNG. Autocompressed under 500kb.</p>
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div className="input-group">
                                  <label className="input-label">Full Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.full_name}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Email Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="email"
                                    className="input-field"
                                    value={profileFormData.email}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Phone Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="tel"
                                    className="input-field"
                                    value={profileFormData.phone}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                                    maxLength={10}
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div className="input-group">
                                  <label className="input-label">
                                    Date of Birth <span style={{ color: 'var(--color-error)' }}>*</span>{calculatedAge !== null && <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '8px' }}>(Age: {calculatedAge} yrs)</span>}
                                  </label>
                                  <input
                                    type="date"
                                    className="input-field"
                                    value={profileFormData.dob}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, dob: e.target.value }))}
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Father&apos;s Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.fathers_name}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, fathers_name: e.target.value }))}
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">Marital Status <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <select
                                    className="input-field"
                                    value={profileFormData.marital_status}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, marital_status: e.target.value }))}
                                    required
                                    disabled={profile?.profile_locked}
                                  >
                                    <option value="">Select status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                  </select>
                                </div>
                              </div>

                              <div className="responsive-grid-2" style={{ gap: '20px' }}>
                                <div className="input-group">
                                  <label className="input-label">Current Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.current_address}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, current_address: e.target.value }))}
                                    placeholder="Street address, building, apartment"
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="input-label">Permanent Address <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                      <input
                                        type="checkbox"
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setProfileFormData(prev => ({ ...prev, permanent_address: prev.current_address }));
                                          }
                                        }}
                                        style={{ width: '12px', height: '12px', cursor: 'pointer' }}
                                        disabled={profile?.profile_locked}
                                      />
                                      Same as current
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.permanent_address}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, permanent_address: e.target.value }))}
                                    placeholder="As per official documents"
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                                <div className="input-group">
                                  <label className="input-label">Pincode <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.pincode}
                                    onChange={(e) => handlePincodeChange(e.target.value)}
                                    maxLength={6}
                                    placeholder="6-digit pincode"
                                    required
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">City</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.city}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Auto-filled / District"
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                                <div className="input-group">
                                  <label className="input-label">State</label>
                                  <input
                                    type="text"
                                    className="input-field"
                                    value={profileFormData.state}
                                    onChange={(e) => setProfileFormData(prev => ({ ...prev, state: e.target.value }))}
                                    placeholder="Auto-filled"
                                    disabled={profile?.profile_locked}
                                  />
                                </div>
                              </div>

                              {/* Identity Verification Documents */}
                              <div style={{ padding: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)', display: 'grid', gap: '20px' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: 'var(--border-subtle)', paddingBottom: '8px', margin: 0 }}>Identity Verification Documents</h3>
                                
                                {/* Identity Proof 1 */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--border-radius-sm)', border: 'var(--border-light)', display: 'grid', gap: '12px' }}>
                                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Primary Identity Proof (ID 1)</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div className="input-group">
                                      <label className="input-label">ID Type <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                      <select
                                        className="input-field"
                                        value={profileFormData.id_type}
                                        onChange={(e) => setProfileFormData(prev => ({ ...prev, id_type: e.target.value }))}
                                        disabled={profile?.profile_locked}
                                      >
                                        <option value="">Select ID Type</option>
                                        <option value="Aadhaar Card">Aadhaar Card</option>
                                        <option value="PAN Card">PAN Card</option>
                                        <option value="Passport">Passport</option>
                                        <option value="Voter ID Card">Voter ID Card</option>
                                      </select>
                                    </div>
                                    <div className="input-group">
                                      <label className="input-label">ID Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                      <input
                                        type="text"
                                        className="input-field"
                                        value={profileFormData.id_number}
                                        onChange={(e) => setProfileFormData(prev => ({ ...prev, id_number: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))}
                                        placeholder="Identity proof number"
                                        maxLength={12}
                                        disabled={profile?.profile_locked}
                                      />
                                    </div>
                                  </div>
                                  <div className="input-group">
                                    <label className="input-label">Identity Document File (PDF or Image) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input type="file" accept="image/jpeg, image/png, application/pdf" onChange={handleIdFileChange} style={{ fontSize: 'var(--text-xs)' }} disabled={profile?.profile_locked} />
                                    <p className="input-hint">JPEG/PNG images will be auto-compressed. PDF size limit: 500kb.</p>
                                    {profileFormData.id_file && (
                                      <div style={{ marginTop: '8px' }}>
                                        {profileFormData.id_file.startsWith('data:application/pdf') || !profileFormData.id_file.startsWith('data:image/') ? (
                                          <a
                                            href={profileFormData.id_file}
                                            download={`identity-document-1-${profileFormData.id_type || 'proof'}`}
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                              <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                            Download / View Uploaded PDF
                                          </a>
                                        ) : (
                                          <div style={{ display: 'grid', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID File Preview:</span>
                                            <img src={profileFormData.id_file} alt="ID Document Preview" style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', border: 'var(--border-light)' }} />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Identity Proof 2 */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--border-radius-sm)', border: 'var(--border-light)', display: 'grid', gap: '12px' }}>
                                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', margin: 0 }}>Secondary Identity Proof (ID 2 - Must be different type)</h4>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div className="input-group">
                                      <label className="input-label">ID Type <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                      <select
                                        className="input-field"
                                        value={profileFormData.id_type_2}
                                        onChange={(e) => setProfileFormData(prev => ({ ...prev, id_type_2: e.target.value }))}
                                        disabled={profile?.profile_locked}
                                      >
                                        <option value="">Select ID Type</option>
                                        <option value="Aadhaar Card">Aadhaar Card</option>
                                        <option value="PAN Card">PAN Card</option>
                                        <option value="Passport">Passport</option>
                                        <option value="Voter ID Card">Voter ID Card</option>
                                      </select>
                                    </div>
                                    <div className="input-group">
                                      <label className="input-label">ID Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                      <input
                                        type="text"
                                        className="input-field"
                                        value={profileFormData.id_number_2}
                                        onChange={(e) => setProfileFormData(prev => ({ ...prev, id_number_2: e.target.value.replace(/[^a-zA-Z0-9]/g, '') }))}
                                        placeholder="Identity proof number"
                                        maxLength={12}
                                        disabled={profile?.profile_locked}
                                      />
                                    </div>
                                  </div>
                                  <div className="input-group">
                                    <label className="input-label">Identity Document File (PDF or Image) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input type="file" accept="image/jpeg, image/png, application/pdf" onChange={handleIdFile2Change} style={{ fontSize: 'var(--text-xs)' }} disabled={profile?.profile_locked} />
                                    <p className="input-hint">JPEG/PNG images will be auto-compressed. PDF size limit: 500kb.</p>
                                    {profileFormData.id_file_2 && (
                                      <div style={{ marginTop: '8px' }}>
                                        {profileFormData.id_file_2.startsWith('data:application/pdf') || !profileFormData.id_file_2.startsWith('data:image/') ? (
                                          <a
                                            href={profileFormData.id_file_2}
                                            download={`identity-document-2-${profileFormData.id_type_2 || 'proof'}`}
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                              <polyline points="14 2 14 8 20 8" />
                                            </svg>
                                            Download / View Uploaded PDF
                                          </a>
                                        ) : (
                                          <div style={{ display: 'grid', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID File Preview:</span>
                                            <img src={profileFormData.id_file_2} alt="ID Document 2 Preview" style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', border: 'var(--border-light)' }} />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Live Selfie Verification */}
                              <div style={{ padding: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)', display: 'grid', gap: '16px' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: 'var(--border-subtle)', paddingBottom: '8px', margin: 0 }}>📸 Live Selfie Verification</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                  <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', border: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {profileFormData.selfie ? (
                                      <img src={profileFormData.selfie} alt="Selfie Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                    <label className="input-label">Upload Live Selfie <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input
                                      type="file"
                                      accept="image/jpeg, image/png"
                                      capture="user"
                                      onChange={handleSelfieChange}
                                      style={{ fontSize: 'var(--text-xs)' }}
                                      disabled={profile?.profile_locked}
                                    />
                                    <p className="input-hint">On mobile devices, this opens the front camera for a live selfie. Formats: JPG, PNG.</p>
                                  </div>
                                </div>
                              </div>

                              {/* Bank Account Details & Payout Details */}
                              <div style={{ padding: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)', display: 'grid', gap: '16px' }}>
                                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: 'var(--border-subtle)', paddingBottom: '8px', margin: 0 }}>🏦 Bank Account & Payout Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                  <div className="input-group">
                                    <label className="input-label">Account Holder Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={profileFormData.bank_holder_name}
                                      onChange={(e) => setProfileFormData(prev => ({ ...prev, bank_holder_name: e.target.value }))}
                                      placeholder="Name as per bank records"
                                      disabled={profile?.profile_locked}
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label className="input-label">Bank Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={profileFormData.bank_name}
                                      onChange={(e) => setProfileFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                                      placeholder="e.g. HDFC Bank, SBI"
                                      disabled={profile?.profile_locked}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                  <div className="input-group">
                                    <label className="input-label">Account Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={profileFormData.bank_account_no}
                                      onChange={(e) => setProfileFormData(prev => ({ ...prev, bank_account_no: e.target.value.replace(/\D/g, '') }))}
                                      placeholder="Bank Account Number"
                                      disabled={profile?.profile_locked}
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label className="input-label">IFSC Code <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      value={profileFormData.bank_ifsc}
                                      onChange={(e) => setProfileFormData(prev => ({ ...prev, bank_ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                      placeholder="11-digit IFSC code"
                                      maxLength={11}
                                      disabled={profile?.profile_locked}
                                    />
                                  </div>
                                </div>
                                
                                <div className="input-group">
                                  <label className="input-label">Cancelled Cheque Image/PDF <span style={{ color: 'var(--color-error)' }}>*</span></label>
                                  <input type="file" accept="image/jpeg, image/png, application/pdf" onChange={handleCancelledChequeChange} style={{ fontSize: 'var(--text-xs)' }} disabled={profile?.profile_locked} />
                                  <p className="input-hint">Formats: JPG, PNG, PDF. Autocompressed. Limit: 500kb.</p>
                                  {profileFormData.cancelled_cheque && (
                                    <div style={{ marginTop: '12px' }}>
                                      {profileFormData.cancelled_cheque.startsWith('data:application/pdf') || !profileFormData.cancelled_cheque.startsWith('data:image/') ? (
                                        <a
                                          href={profileFormData.cancelled_cheque}
                                          download={`cancelled-cheque-${profileFormData.bank_name || 'bank'}`}
                                          className="btn btn-secondary btn-sm"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                          </svg>
                                          Download / View Uploaded PDF
                                        </a>
                                      ) : (
                                        <div style={{ display: 'grid', gap: '4px' }}>
                                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Cancelled Cheque Preview:</span>
                                          <img src={profileFormData.cancelled_cheque} alt="Cancelled Cheque Preview" style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', border: 'var(--border-light)' }} />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }} disabled={savingProfile || profile?.profile_locked}>
                                  {savingProfile ? (
                                    'Saving Changes...'
                                  ) : (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                      </svg>
                                      Save Profile Details
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      })()}

                      {/* TAB 2: Client Applications */}
                      {activeTab === 'applications' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                              Client Loan Submissions
                            </h2>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              Total Applications: {applications.length}
                            </span>
                          </div>

                          {applications.length === 0 ? (
                            <div className="form-card text-center" style={{ padding: '64px 32px', backdropFilter: 'blur(20px)' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                              </div>
                              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>No Submitted Applications</h3>
                              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                Run an eligibility inquiry for your clients and submit applications directly to match list cards.
                              </p>
                              <Link href="/check" className="btn btn-primary">
                                Apply for a Client Now
                              </Link>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                              {applications.map((app) => (
                                <div 
                                  key={app.id} 
                                  className="result-card" 
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setAppDetailsStatusValue(['disbursed', 'rejected'].includes(app.status?.toLowerCase()) ? app.status.toLowerCase() : (app.status ? app.status.toLowerCase() : 'applied'));
                                    setAppDetailsProblemText(app.problem || '');
                                  }}
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px',
                                    background: 'var(--color-bg-card)',
                                    border: 'var(--border-light)',
                                    borderRadius: 'var(--border-radius-md)',
                                    padding: '20px 24px',
                                    backdropFilter: 'blur(20px)',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{app.client_name}</div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                      </svg>
                                      {app.client_mobile}
                                    </div>
                                    {app.application_id && (
                                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                                        ID: {app.application_id}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <BankLogo bankName={app.bank_name} logoUrl={getBankLogo(app.bank_name)} size={20} />
                                      <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{app.bank_name}</span>
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                      Type: {(() => {
                                        if (app.loan_type === 'BL') return 'Business';
                                        const name = (app.bank_name || '').toLowerCase();
                                        if (name.includes('instant')) return 'Instant';
                                        return 'Salary';
                                      })()}
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Loan Amount</div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                                      {"\u20B9"}{Number(app.loan_amount).toLocaleString('en-IN')}
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Est. Commission (2.0%)</div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-accent-violet)' }}>
                                      {"\u20B9"}{Number(app.commission_amount).toLocaleString('en-IN')}
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'right' }}>
                                    <span className="badge" style={{ ...getStatusBadgeStyle(app.status), display: 'inline-block' }}>
                                      {app.status}
                                    </span>
                                    {app.disbursed_at && (
                                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                        Disbursed: {new Date(app.disbursed_at).toLocaleDateString('en-IN')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: Earnings & Payment History */}
                      {activeTab === 'earnings' && (
                        <div style={{ display: 'grid', gap: '32px' }}>
                          {/* Metrics Header */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="form-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>TOTAL COMMISSION EARNED</div>
                              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                                {"\u20B9"}{totalEarnings.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="form-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>AVAILABLE BALANCE</div>
                              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{"\u20B9"}{availableBalance.toLocaleString('en-IN')}</span>
                                {availableBalance > 0 && (
                                  <button onClick={handleOpenPayoutModal} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '11px', margin: 0 }}>
                                    Request Payout
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="form-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>PAID PAYOUTS</div>
                              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-accent)', marginTop: '8px' }}>
                                {"\u20B9"}{totalPaid.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="form-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>PENDING PAYOUTS</div>
                              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>
                                {"\u20B9"}{totalPending.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          {/* Payout Requests Log */}
                          <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '20px' }}>
                              Disbursement & Payout Requests
                            </h2>

                            {payoutRequests.length === 0 ? (
                              <div className="form-card text-center" style={{ padding: '32px', backdropFilter: 'blur(20px)' }}>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>No payout requests logged yet.</p>
                              </div>
                            ) : (
                              <div className="form-card" style={{ padding: 0, backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                                 <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                 <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--color-bg-glass)', borderBottom: 'var(--border-subtle)' }}>
                                      <th style={{ padding: '12px 16px' }}>Date Requested</th>
                                      <th style={{ padding: '12px 16px' }}>Amount Requested</th>
                                      <th style={{ padding: '12px 16px' }}>Payment Method</th>
                                      <th style={{ padding: '12px 16px' }}>Details</th>
                                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {payoutRequests.map((req) => (
                                      <tr key={req.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                        <td style={{ padding: '12px 16px' }}>{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{"\u20B9"}{Number(req.amount).toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '12px 16px' }}>{req.upi_id ? 'UPI' : 'Bank Transfer'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                          {req.upi_id ? (
                                            <span>UPI ID: {req.upi_id}</span>
                                          ) : (
                                            <span>Bank: {req.bank_name} | Acc: {req.account_no}</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                          <span className="badge" style={{ ...getStatusBadgeStyle(req.status), fontSize: '10px' }}>
                                            {req.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                  </div>
                              </div>
                            )}
                          </div>

                          {/* Payment History Calculation */}
                          <div>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '20px' }}>
                              Commission Calculation History
                            </h2>

                            {disbursedApps.length === 0 && subAgentDisbursedApps.length === 0 ? (
                              <div className="form-card text-center" style={{ padding: '48px 32px', backdropFilter: 'blur(20px)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                  </svg>
                                </div>
                                <h3 style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)' }}>No Disbursements Tracked Yet</h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                  Earnings populate here automatically as soon as loan applications are marked as &quot;Disbursed&quot; by the admin.
                                </p>
                              </div>
                            ) : (
                              <div className="form-card" style={{ padding: 0, backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                                    <thead>
                                      <tr style={{ background: 'var(--color-bg-glass)', borderBottom: 'var(--border-subtle)' }}>
                                        <th style={{ padding: '16px' }}>Date</th>
                                        <th style={{ padding: '16px' }}>Type</th>
                                        <th style={{ padding: '16px' }}>Source Client / Sub-agent</th>
                                        <th style={{ padding: '16px' }}>Bank Match</th>
                                        <th style={{ padding: '16px' }}>Disbursed Loan</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Partner Payout</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* Direct commissions */}
                                      {disbursedApps.map((app) => (
                                        <tr key={app.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                          <td style={{ padding: '16px' }}>{new Date(app.disbursed_at || app.created_at).toLocaleDateString('en-IN')}</td>
                                          <td style={{ padding: '16px' }}><span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Direct (2%)</span></td>
                                          <td style={{ padding: '16px' }}>{app.client_name}</td>
                                          <td style={{ padding: '16px' }}>{app.bank_name}</td>
                                          <td style={{ padding: '16px' }}>{"\u20B9"}{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>
                                            +{"\u20B9"}{Number(app.commission_amount).toLocaleString('en-IN')}
                                          </td>
                                        </tr>
                                      ))}

                                      {/* Referral bonuses */}
                                      {subAgentDisbursedApps.map((app) => (
                                        <tr key={`sa-${app.id}`} style={{ borderBottom: 'var(--border-subtle)' }}>
                                          <td style={{ padding: '16px' }}>{new Date(app.disbursed_at || app.created_at).toLocaleDateString('en-IN')}</td>
                                          <td style={{ padding: '16px' }}><span style={{ color: 'var(--color-info)', fontWeight: 500 }}>Referral (0.5%)</span></td>
                                          <td style={{ padding: '16px' }}>Agent Referral client ({app.client_name})</td>
                                          <td style={{ padding: '16px' }}>{app.bank_name}</td>
                                          <td style={{ padding: '16px' }}>{"\u20B9"}{Number(app.loan_amount).toLocaleString('en-IN')}</td>
                                          <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-info)' }}>
                                            +{"\u20B9"}{(Number(app.loan_amount) * 0.005).toLocaleString('en-IN')}
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

                      {/* TAB 4: Sub-Agents List */}
                      {activeTab === 'subagents' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                              Referred Sub-Agents
                            </h2>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                              Total Sub-Agents: {subAgents.length}
                            </span>
                          </div>

                          {subAgents.length === 0 ? (
                            <div className="form-card text-center" style={{ padding: '64px 32px', backdropFilter: 'blur(20px)' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                              </div>
                              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>No Referred Sub-Agents</h3>
                              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                                Share your agent registration link with other financial partners to build your network and earn referral fees.
                              </p>
                              <button onClick={handleCopyLink} className="btn btn-primary" style={{ margin: '0 auto' }}>
                                {copied ? 'Copied Invitation Link!' : 'Get Referral Link'}
                              </button>
                            </div>
                          ) : (
                            <div className="form-card" style={{ padding: 0, backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
                              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--color-bg-glass)', borderBottom: 'var(--border-subtle)' }}>
                                      <th style={{ padding: '16px' }}>Partner Name</th>
                                      <th style={{ padding: '16px' }}>Email</th>
                                      <th style={{ padding: '16px' }}>Phone</th>
                                      <th style={{ padding: '16px' }}>Sub-Agent Code</th>
                                      <th style={{ padding: '16px' }}>Referral Date</th>
                                      <th style={{ padding: '16px' }}>Status</th>
                                      <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subAgents.map((sa) => (
                                      <tr key={sa.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{sa.full_name}</td>
                                        <td style={{ padding: '16px' }}>{sa.email}</td>
                                        <td style={{ padding: '16px' }}>{sa.phone || 'N/A'}</td>
                                        <td style={{ padding: '16px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{sa.agent_code || 'PENDING'}</td>
                                        <td style={{ padding: '16px' }}>
                                          {new Date(sa.created_at).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                          <span className="badge" style={sa.approved ? { color: 'var(--color-success)', background: 'var(--color-success-bg)', border: 'var(--border-success)' } : { color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: 'var(--border-warning)' }}>
                                            {sa.approved ? 'Active' : 'Pending Approval'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                          <button 
                                            onClick={() => setSelectedSubAgent(sa)} 
                                            className="btn btn-secondary btn-sm"
                                            style={{ margin: 0, padding: '6px 12px', fontSize: '11px' }}
                                          >
                                            View Details 👁️
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
                      )}

                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Payout Request Modal */}
        {payoutModalOpen && (
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
          }} onClick={() => setPayoutModalOpen(false)}>
            <div className="form-card" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', display: 'grid', gap: '20px', border: 'var(--border-accent)', background: 'var(--color-bg-tertiary)', backdropFilter: 'blur(20px)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Request Earnings Payout</h3>
                <button onClick={() => setPayoutModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}>Ã—</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '12px 16px', borderRadius: '8px', border: 'var(--border-success)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Available Balance:</span>
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-success)' }}>â‚¹{availableBalance.toLocaleString('en-IN')}</span>
              </div>

              {payoutError && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>âš  {payoutError}</div>}
              {payoutSuccess && <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>âœ“ {payoutSuccess}</div>}

              <form onSubmit={handlePayoutSubmit} style={{ display: 'grid', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Request Amount (â‚¹)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 5000"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Disbursement Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', padding: '8px', fontSize: 'var(--text-xs)' }}
                      onClick={() => setPaymentMethod('UPI')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      UPI Payout
                    </button>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'BANK' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', padding: '8px', fontSize: 'var(--text-xs)' }}
                      onClick={() => setPaymentMethod('BANK')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <rect x="2" y="10" width="20" height="11" rx="2" />
                        <path d="M6 6v4" />
                        <path d="M10 6v4" />
                        <path d="M14 6v4" />
                        <path d="M18 6v4" />
                        <path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                      </svg>
                      Bank Account
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Account Holder Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="As registered in bank"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    required
                  />
                </div>

                {paymentMethod === 'UPI' ? (
                  <div className="input-group">
                    <label className="input-label">UPI ID (VPA)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. mobile@upi, name@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label className="input-label">Account Number</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter bank account number"
                        value={accNo}
                        onChange={(e) => setAccNo(e.target.value)}
                        required
                      />
                    </div>
                    <div className="responsive-grid-2" style={{ gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Bank Name</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. HDFC, SBI"
                          value={bankNameVal}
                          onChange={(e) => setBankNameVal(e.target.value)}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">IFSC Code</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="11-digit IFSC code"
                          value={ifscVal}
                          onChange={(e) => setIfscVal(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setPayoutModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={submittingPayout}>
                    {submittingPayout ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Profile Update Request Popup */}
        {showProfileUpdatePopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            overflowY: 'auto',
            padding: '40px 24px',
            zIndex: 99999,
            WebkitOverflowScrolling: 'touch',
            animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={() => setShowProfileUpdatePopup(false)}>
            <div className="form-card" style={{
              maxWidth: '520px',
              width: '100%',
              margin: '0 auto',
              display: 'grid',
              gap: '20px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'var(--color-bg-secondary)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 40px rgba(245, 158, 11, 0.08)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '32px'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-warning)' }}>
                    <path d="M18 8a3 3 0 0 0-3-3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3l3 3V17h4a3 3 0 0 0 3-3V8z" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="21" y1="9" x2="19" y2="10" />
                    <line x1="21" y1="15" x2="19" y2="14" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-warning)' }}>Profile Update Required</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Action requested by Administrator</p>
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', color: 'var(--color-text-primary)' }}>
                <p style={{ marginBottom: '12px' }}>
                  Dear <strong>{profile?.full_name}</strong>, the administrator has requested that you complete your profile information.
                </p>
                <p style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                  Please fill in all the missing fields in your profile section. This popup will keep appearing every <strong style={{ color: 'var(--color-warning)' }}>5 minutes</strong> until your profile is <strong style={{ color: 'var(--color-success)' }}>100% complete</strong>.
                </p>
              </div>

              {/* WhatsApp Community Mandatory Join Link */}
              <div style={{
                background: 'rgba(37, 211, 102, 0.08)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                padding: '16px',
                borderRadius: 'var(--border-radius-md)',
                marginTop: '-8px',
                marginBottom: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'var(--text-xs)',
                  color: '#25D366',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  <span>💬 MANDATORY: JOIN WHATSAPP COMMUNITY</span>
                </div>
                <p style={{
                  fontSize: 'var(--text-xs)',
                  lineHeight: '1.5',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '12px'
                }}>
                  It is mandatory for all active agents to join our official WhatsApp Community to receive real-time payouts support and platform updates.
                </p>
                <a
                  href="https://chat.whatsapp.com/HxAz1nhORjM7oPcS3o3njl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 'var(--text-xs)',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    justifyContent: 'center',
                    width: '100%',
                    margin: 0
                  }}
                >
                  Join Official WhatsApp Group 💬
                </a>
              </div>

              {profile?.profile_update_message && (
                <div style={{
                  padding: '16px',
                  background: 'var(--color-warning-bg)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginTop: '-8px',
                  marginBottom: '-4px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-warning)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px'
                  }}>
                    <span>âš  Message from Administrator:</span>
                  </div>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    lineHeight: '1.5',
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                    margin: 0
                  }}>
                    &quot;{profile.profile_update_message}&quot;
                  </p>
                </div>
              )}

              {/* Current Completion Status */}
              <div style={{ padding: '16px', background: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-md)', border: 'var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Current Progress</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: calculateCompletionPercentage() >= 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {calculateCompletionPercentage()}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--color-circle-track)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${calculateCompletionPercentage()}%`,
                    height: '100%',
                    background: calculateCompletionPercentage() >= 100 ? 'var(--gradient-success)' : 'var(--gradient-warning)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>

                {/* Missing fields list */}
                {(() => {
                  const fieldMap = [
                    { key: 'full_name', label: 'Full Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone Number' },
                    { key: 'dob', label: 'Date of Birth' },
                    { key: 'fathers_name', label: "Father's Name" },
                    { key: 'current_address', label: 'Current Address' },
                    { key: 'permanent_address', label: 'Permanent Address' },
                    { key: 'pincode', label: 'Pincode' },
                    { key: 'marital_status', label: 'Marital Status' },
                    { key: 'avatar', label: 'Profile Picture' },
                    { key: 'id_type', label: 'ID Proof Type' },
                    { key: 'id_number', label: 'ID Proof Number' },
                    { key: 'id_file', label: 'ID Document Upload' }
                  ];
                  const missing = fieldMap.filter(f => !profileFormData[f.key] || profileFormData[f.key].toString().trim() === '');
                  if (missing.length === 0) return null;
                  return (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', fontWeight: 600, marginBottom: '6px' }}>
                        âš  Missing Fields ({missing.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {missing.map(f => (
                          <span key={f.key} style={{
                            fontSize: '11px',
                            padding: '3px 10px',
                            background: 'var(--color-error-bg)',
                            color: 'var(--color-error)',
                            border: 'var(--border-error)',
                            borderRadius: 'var(--border-radius-full)',
                            fontWeight: 500
                          }}>
                            {f.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowProfileUpdatePopup(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: 'var(--text-sm)' }}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowProfileUpdatePopup(false);
                    setActiveTab('profile');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: 'var(--text-sm)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                  Go to Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demoted User Login Warning Popup Modal */}
        {showDemotionPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            overflowY: 'auto',
            padding: '40px 24px',
            zIndex: 99999,
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="form-card" style={{
              maxWidth: '640px',
              width: '95vw',
              margin: '0 auto',
              display: 'grid',
              gap: '24px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(25px)',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '32px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-error)' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-error)' }}>Account Status Update</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Notice of Agent Partnership Revocation</p>
                </div>
              </div>

              <div style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.85)' }}>
                <p style={{ marginBottom: '12px' }}>
                  Dear <strong>{profile?.full_name}</strong>,
                </p>
                <p style={{ marginBottom: '16px' }}>
                  This is to inform you that your official Agent status has been revoked, and your account has been demoted to a standard user profile due to policy violations or misbehavior.
                </p>
                <p style={{ marginBottom: '16px', fontWeight: 500, color: 'var(--color-warning)' }}>
                  All your pending and previously earned payments are secured. You can request payouts for any remaining outstanding balance, and all completed transfers are listed in your history below.
                </p>
              </div>

              {/* Payout History Ledger in Popup */}
              <div>
                <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Payout Request Ledger</h4>
                {payoutRequests.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--color-bg-card)', borderRadius: '8px', border: 'var(--border-subtle)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    No payout requests recorded.
                  </div>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: 'var(--border-subtle)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg-card)', borderBottom: 'var(--border-subtle)' }}>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Amount</th>
                          <th style={{ padding: '8px 12px' }}>Method</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutRequests.map((req) => (
                          <tr key={req.id} style={{ borderBottom: 'var(--border-subtle)' }}>
                            <td style={{ padding: '8px 12px' }}>{new Date(req.created_at).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>â‚¹{Number(req.amount).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '8px 12px' }}>{req.upi_id ? 'UPI' : 'Bank'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span className="badge" style={{ ...getStatusBadgeStyle(req.status), fontSize: '8px', padding: '2px 6px', display: 'inline-block' }}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: 'var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    const countKey = `demoted_popup_count_${profile.id}`;
                    const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10);
                    localStorage.setItem(countKey, (currentCount + 1).toString());
                    setShowDemotionPopup(false);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', background: 'var(--gradient-primary)', border: 'none', borderRadius: 'var(--border-radius-md)' }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Application Details & Lead Process Update Modal */}
        {selectedApplication && (() => {
          const matchedPolicy = policies.find(p => p.bank_name.toUpperCase().replace(/\(BL\)/g, '').trim() === selectedApplication.bank_name?.toUpperCase().replace(/\(BL\)/g, '').trim());
          const appLink = matchedPolicy?.direct_submit
            ? null
            : (matchedPolicy?.apply_url || getAffiliateLink(selectedApplication.bank_name, selectedApplication.loan_type));
          const isFinalStatus = ['disbursed', 'rejected'].includes(selectedApplication.status?.toLowerCase());

          return (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px)',
              overflowY: 'auto',
              padding: '40px 24px',
              zIndex: 99999,
              WebkitOverflowScrolling: 'touch'
            }} onClick={() => setSelectedApplication(null)}>
              <div className="form-card" style={{
                width: '95vw',
                margin: '0 auto',
                display: 'grid',
                gap: '20px',
                background: 'rgba(20, 20, 20, 0.85)',
                backdropFilter: 'blur(25px)',
                border: 'var(--border-light)',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '28px',
                color: '#fff',
                maxHeight: '90vh',
                overflowY: 'auto'
              }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BankLogo bankName={selectedApplication.bank_name} logoUrl={getBankLogo(selectedApplication.bank_name)} size={24} />
                    <div>
                      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Application Details</h3>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>Update progress & access apply portals</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Client & Loan Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: 'var(--border-subtle)' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Client Name</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>{selectedApplication.client_name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Client Mobile</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>{selectedApplication.client_mobile}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Bank Partner</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>{selectedApplication.bank_name}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Loan Category</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                      {(() => {
                        if (selectedApplication.loan_type === 'BL') return 'Business Loan';
                        const name = (selectedApplication.bank_name || '').toLowerCase();
                        if (name.includes('instant')) return 'Instant Loan';
                        return 'Salary Loan';
                      })()}
                    </div>
                  </div>
                  <div style={{ gridColumn: profile?.role === 'user' ? 'span 2' : 'span 1' }}>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Loan Amount</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>{"\u20B9"}{Number(selectedApplication.loan_amount).toLocaleString('en-IN')}</div>
                  </div>
                  {profile?.role !== 'user' && (
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Est. Commission (2%)</label>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-accent-violet)' }}>{"\u20B9"}{Number(selectedApplication.commission_amount).toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Application ID</label>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{selectedApplication.application_id || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Submission Date</label>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>{new Date(selectedApplication.created_at).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Affiliate Link / Portal Section */}
                {profile?.role !== 'user' && (() => {
                  const isFinnable = selectedApplication.bank_name?.toUpperCase()?.includes('FINNABLE');
                  const isIncred = selectedApplication.bank_name?.toUpperCase()?.includes('INCRED');
                  
                  let username = matchedPolicy?.portal_username || '';
                  let password = matchedPolicy?.portal_password || '';
                  
                  if (!username && isFinnable) username = '9389119399';
                  if (!password && isFinnable) password = 'Call 9389119399 (OTP Support)';
                  if (!username && isIncred) username = 'incredhtoh@gmail.com';
                  if (!password && isIncred) password = 'Call & Message on WhatsApp to 9389119399 (OTP Support)';
                  
                  const hasCredentials = username || password || appLink;
                  
                  if (matchedPolicy?.direct_submit) {
                    return (
                      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>📥 Admin Processing Mode</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                          This bank uses Direct Submit. The administrator is currently applying for this loan on your behalf.
                        </div>
                      </div>
                    );
                  }

                  if (hasCredentials) {
                    return (
                      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-primary)' }}>🔗 {selectedApplication.bank_name} Partner Portal</div>
                        
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
                            <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>🔑 Partner Login Details:</div>
                            {username && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>• <strong>Login User ID:</strong> {username}</span>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(username); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                              </div>
                            )}
                            {password && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>• <strong>Password / Contact:</strong> {password}</span>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(password); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                              </div>
                            )}
                          </div>
                        )}

                        {appLink && (
                          <a
                            href={appLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              textDecoration: 'none',
                              marginTop: '4px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              padding: '10px 16px'
                            }}
                          >
                            🚀 Open Apply Portal ↗
                          </a>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: 'var(--border-subtle)', padding: '12px 16px', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      ℹ️ No direct apply link or portal credentials configured for this bank.
                    </div>
                  );
                })()}

                {/* Update Process Status Form */}
                {profile?.role === 'user' ? (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: 'var(--border-subtle)',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>ℹ️ Status Info</span>
                      <span className="badge" style={{ ...getStatusBadgeStyle(selectedApplication.status), margin: 0, fontSize: '10px' }}>
                        {selectedApplication.status || 'Applied'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                      Status is updated by Admin. Direct customer applications cannot be modified.
                    </div>
                    {selectedApplication.problem && (
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                        <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>Admin Note:</span>
                        <div style={{ marginTop: '4px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '2px solid var(--color-error)', borderRadius: '4px', color: '#fff', fontSize: 'var(--text-xs)' }}>
                          {selectedApplication.problem}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(null)}
                      className="btn btn-secondary"
                      style={{ margin: '8px 0 0 auto', padding: '8px 16px', fontSize: 'var(--text-xs)', width: 'auto' }}
                    >
                      Close Details
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateAppDetailsSubmit} style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Update Lead Progress</h4>
                    
                    {isFinalStatus ? (
                      <div style={{ 
                        background: selectedApplication.status?.toLowerCase() === 'disbursed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: selectedApplication.status?.toLowerCase() === 'disbursed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: 'var(--text-xs)',
                        color: selectedApplication.status?.toLowerCase() === 'disbursed' ? 'var(--color-success)' : 'var(--color-error)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        🔒 Status locked as <strong>{selectedApplication.status?.toUpperCase()}</strong> by Admin.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Lead Status</label>
                          <select
                            value={appDetailsStatusValue}
                            onChange={(e) => setAppDetailsStatusValue(e.target.value)}
                            className="input-field"
                            style={{ marginTop: '4px' }}
                          >
                            <option value="applied">Applied</option>
                            <option value="in process">In Process</option>
                            <option value="kyc verification">KYC Verification</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Notes / Reported Issue to Admin</label>
                          <textarea
                            value={appDetailsProblemText}
                            onChange={(e) => setAppDetailsProblemText(e.target.value)}
                            placeholder="Describe any issues faced or leave a note about status updates..."
                            className="input-field"
                            style={{
                              marginTop: '4px',
                              height: '80px',
                              resize: 'none',
                              padding: '10px'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: 'var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(null)}
                      className="btn btn-secondary"
                      style={{ margin: 0 }}
                    >
                      Cancel
                    </button>
                    {!isFinalStatus && (
                      <button
                        type="submit"
                        disabled={updatingAppDetailsState}
                        className="btn btn-primary"
                        style={{ margin: 0, background: 'var(--gradient-primary)', border: 'none' }}
                      >
                        {updatingAppDetailsState ? 'Saving...' : 'Update Lead'}
                      </button>
                    )}
                  </div>
                </form>
              )}
              </div>
            </div>
          );
        })()}

      {/* Selected Sub-Agent Details Modal */}
      {selectedSubAgent && (() => {
        const saApps = subAgentDisbursedApps.filter(app => app.agent_id === selectedSubAgent.id);
        const saBonus = saApps.reduce((acc, app) => acc + (Number(app.loan_amount) * 0.005), 0);
        const saTotalBusiness = saApps.reduce((acc, app) => acc + Number(app.loan_amount), 0);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            overflowY: 'auto',
            padding: '40px 24px',
            zIndex: 99999,
            WebkitOverflowScrolling: 'touch'
          }} onClick={() => setSelectedSubAgent(null)}>
            <div className="form-card" style={{
              maxWidth: '650px',
              width: '100%',
              margin: '0 auto',
              display: 'grid',
              gap: '20px',
              background: 'var(--color-bg-secondary)',
              border: 'var(--border-light)',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '32px',
              color: '#fff'
            }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {selectedSubAgent.avatar ? (
                    <img 
                      src={selectedSubAgent.avatar} 
                      alt={selectedSubAgent.full_name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'var(--gradient-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700,
                      fontSize: 'var(--text-lg)',
                      color: '#fff'
                    }}>
                      {selectedSubAgent.full_name ? selectedSubAgent.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Sub-Agent Profile</h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>Recruited partner details & performance</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedSubAgent(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Performance Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: 'var(--color-bg-glass)', borderRadius: '8px', border: 'var(--border-subtle)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Disbursed Loans</div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>{saApps.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Business</div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{"\u20B9"}{saTotalBusiness.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Your Earning (0.5%)</div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>{"\u20B9"}{saBonus.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="responsive-grid-2" style={{ gap: '16px 24px', fontSize: 'var(--text-sm)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Full Name</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.full_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Email Address</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Phone Number</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Sub-Agent Code</div>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', color: 'var(--color-accent)', marginTop: '2px' }}>{selectedSubAgent.agent_code || 'PENDING'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Date of Birth</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedSubAgent.dob || 'Not provided'} {selectedSubAgent.dob && `(Age: ${calculateAge(selectedSubAgent.dob)} years)`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Father&apos;s Name</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.fathers_name || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Marital Status</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.marital_status || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Pincode</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedSubAgent.pincode || 'Not provided'}</div>
                </div>
                <div className="span-2-desktop">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Location</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {selectedSubAgent.city ? `${selectedSubAgent.city}, ${selectedSubAgent.state}` : selectedSubAgent.state || 'Not provided'}
                  </div>
                </div>
                <div className="span-2-desktop">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Address</div>
                  <div style={{ fontWeight: 600, marginTop: '2px', fontSize: 'var(--text-xs)' }}>{selectedSubAgent.current_address || 'Not provided'}</div>
                </div>
                <div className="span-2-desktop">
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Permanent Address</div>
                  <div style={{ fontWeight: 600, marginTop: '2px', fontSize: 'var(--text-xs)' }}>{selectedSubAgent.permanent_address || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Joined Date</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{new Date(selectedSubAgent.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Approval Status</div>
                  <div style={{ marginTop: '4px' }}>
                    <span className="badge" style={selectedSubAgent.approved ? { color: 'var(--color-success)', background: 'var(--color-success-bg)', border: 'var(--border-success)' } : { color: 'var(--color-warning)', background: 'var(--color-warning-bg)', border: 'var(--border-warning)' }}>
                      {selectedSubAgent.approved ? 'Active' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSubAgent(null)}
                  className="btn btn-secondary"
                  style={{ margin: 0 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      <Footer />
    </>
  );
}
