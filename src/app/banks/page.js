'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BankLogo from '@/components/BankLogo';

// ─── Affiliate links (same mapping as check page) ───────────────────────────
const BANK_AFFILIATE_LINKS = {
  'POONAWALLA': 'https://instant-pocket-loan.poonawallafincorp.com/?utm_DSA_Code=PKA00192&UTM_Partner_Name=BuddyLoan&UTM_Partner_Medium=hand2handloans_bl_dsa',
  'UNITY BANK': 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=buddyloan&utm_medium=hand2handloans_bl_dsa&utm_campaign=DSA',
  'PREFR': 'https://marketplace.prefr.com/buddyloan/GetStarted?startPage=base',
  'HERO': 'https://loans.apps.herofincorp.com/en/personal-loan?utm_campaign=buddyloan_rdf_26&utm_content=hand2handloans_bl_dsa&af_xp=custom&pid=partnership_bdl&is_retargeting=true&af_reengagement_window=30d&c=buddyloan_rdf_26&utm_source=partnership_bdl',
  'BHARATPE': 'https://consumer-credit.bharatpe.in/creditHome.html?utm_campaign=trillionloan&utm_partner=BLTL&utm_content=DSA&utm_medium=swiftloans_dsa_Hand2Handloans',
  'CREDIT SEA': 'https://www.creditsea.com/onboarding/sign-up/enter-mobile?source=31697402&medium=DSA&campaign=ELDSA_dsa_Hand2Handloans',
  'DMI': 'https://play.google.com/store/apps/details?id=in.dmifinance.app&referrer=utm_source%3DMymoneymantra%26utm_medium%3DHandtohandloan%26utm_term%3D1100110011%26utm_campaign%3DEARNTRA',
  'L&T': 'https://www.moneycontrolpay.com/?utm_source=ILB&utm_campaign=RohanGupta',
  'FIBE': 'https://portal.fibe.in/easy-loan?utm_medium=hand2handloans_bl_dsa&campaignid=dsa&utm_source=BUDDYLOANPA',
  'MUTHOOT DAILY BL': 'https://creditlink.finbox.in/?partnerCode=LS_NUSHZC&agentCode=sc113356&productType=business_loan_edi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY BL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY PL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'INCRED PL': 'https://pl.incred.com/open-market-sales/login',
  'FINNABLE': 'https://partner.finnable.com/auth/login',
};

const getAffiliateLink = (bankName, loanType = 'PL', muthootSubType = 'daily', dbApplyUrl = null, directSubmit = false) => {
  if (directSubmit) return null;
  if (dbApplyUrl) return dbApplyUrl;
  if (!bankName) return null;
  const n = bankName.toUpperCase();
  if (n.includes('MUTHOOT')) {
    if (loanType === 'BL') {
      if (muthootSubType === 'monthly') return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY BL'];
      return BANK_AFFILIATE_LINKS['MUTHOOT DAILY BL'];
    }
    return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY PL'];
  }
  if (n.includes('INCRED')) return BANK_AFFILIATE_LINKS['INCRED PL'];
  if (n.includes('FINNABLE')) return BANK_AFFILIATE_LINKS['FINNABLE'];
  if (n.includes('POONAWALLA') || n.includes('POONWALA')) return BANK_AFFILIATE_LINKS['POONAWALLA'];
  if (n.includes('UNITY')) return BANK_AFFILIATE_LINKS['UNITY BANK'];
  if (n.includes('PREFR')) return BANK_AFFILIATE_LINKS['PREFR'];
  if (n.includes('HERO')) return BANK_AFFILIATE_LINKS['HERO'];
  if (n.includes('BHARATPE') || n.includes('BHARAT PE')) return BANK_AFFILIATE_LINKS['BHARATPE'];
  if (n.includes('CREDIT SEA') || n.includes('CREDITSEA')) return BANK_AFFILIATE_LINKS['CREDIT SEA'];
  if (n.includes('DMI')) return BANK_AFFILIATE_LINKS['DMI'];
  if (n.includes('L&T') || n.includes('L & T')) return BANK_AFFILIATE_LINKS['L&T'];
  if (n.includes('FIBE')) return BANK_AFFILIATE_LINKS['FIBE'];
  return null;
};

// ─── Category badge ───────────────────────────────────────────────────────────
const CategoryBadge = ({ category, loanType }) => {
  const cat = category || (loanType === 'BL' ? 'business' : 'salary');
  const map = {
    salary: { label: '💼 Salary Loan', color: 'var(--color-primary)', bg: 'rgba(99, 102, 241, 0.1)' },
    instant: { label: '⚡ Instant Loan', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' },
    business: { label: '🏢 Business Loan', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.15)' },
  };
  const m = map[cat] || map.salary;
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', color: m.color, background: m.bg, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
};

// ─── Single Bank Card ────────────────────────────────────────────────────────
function BankCard({ bank, pincodeResult, onApply, userRole }) {
  const affiliateLink = userRole === 'user' ? null : getAffiliateLink(bank.bank_name, bank.loan_type, 'daily', bank.apply_url, bank.direct_submit);
  const [expanded, setExpanded] = useState(false);

  // pincodeResult: null = not searched, true = available, false = not available
  const available = pincodeResult === true;
  const notAvailable = pincodeResult === false;
  const showPincodeStatus = pincodeResult !== null && pincodeResult !== undefined;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: showPincodeStatus
        ? (available ? '1.5px solid var(--color-success)' : '1.5px solid var(--color-error)')
        : 'var(--border-subtle)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      transition: 'all 0.25s ease',
      boxShadow: available ? '0 0 18px rgba(74,222,128,0.12)' : 'var(--shadow-sm)',
      opacity: notAvailable ? 0.55 : 1,
    }}>
      {/* Card Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '10px', overflow: 'hidden', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BankLogo bankName={bank.bank_name} logoUrl={bank.logo_url} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {bank.bank_name}
            </h3>
            <CategoryBadge category={bank.policy_category} loanType={bank.loan_type} />
          </div>
          {/* Key stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {bank.min_salary > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Min Salary: <strong style={{ color: 'var(--color-text-primary)' }}>₹{Number(bank.min_salary).toLocaleString('en-IN')}</strong>
              </span>
            )}
            {bank.min_cibil > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                CIBIL: <strong style={{ color: 'var(--color-text-primary)' }}>≥{bank.min_cibil}</strong>
              </span>
            )}
            {bank.foir_max > 0 && bank.foir_max < 100 && (
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                FOIR Max: <strong style={{ color: 'var(--color-text-primary)' }}>{bank.foir_max}%</strong>
              </span>
            )}
            {bank.all_pincodes && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)', background: 'rgba(74,222,128,0.1)', padding: '1px 7px', borderRadius: '99px' }}>
                🌐 All Pincodes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pincode availability badge */}
      {showPincodeStatus && (
        <div style={{ margin: '0 20px 12px', padding: '8px 12px', borderRadius: '8px', background: available ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: available ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>{available ? '✅' : '❌'}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: available ? 'var(--color-success)' : 'var(--color-error)' }}>
            {available ? 'Available at searched pincode' : 'Not available at searched pincode'}
          </span>
        </div>
      )}

      {/* Expandable Details */}
      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: expanded ? '12px' : 0 }}
        >
          {expanded ? '▲ Hide Details' : '▼ View Policy Details'}
        </button>

        {expanded && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              ['Min Salary', bank.min_salary > 0 ? `₹${Number(bank.min_salary).toLocaleString('en-IN')}` : 'N/A'],
              ['Min CIBIL', bank.min_cibil > 0 ? bank.min_cibil : 'N/A'],
              ['FOIR Max', bank.foir_max > 0 ? `${bank.foir_max}%` : 'N/A'],
              ['Min Age', bank.min_age || 21],
              ['Max Age', bank.max_age || 60],
              ['Loan Category', (bank.policy_category || (bank.loan_type === 'BL' ? 'business' : 'salary')).toUpperCase()],
              ['Company Category', bank.company_category || 'ALL TYPES'],
              ['PF Required', bank.pf_required || 'No'],
              ['Min Experience', bank.min_experience || 'N/A'],
              ['Min Residence', bank.min_residence_stability || 'N/A'],
              ['Emp. Type', (bank.employment_type || 'salaried').replace('_', ' ').toUpperCase()],
              ['All Pincodes', bank.all_pincodes ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</div>
              </div>
            ))}
            {bank.special_notes && (
              <div style={{ gridColumn: '1 / -1', background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Special Notes</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{bank.special_notes}</div>
              </div>
            )}
            {userRole !== 'user' && !bank.direct_submit && (() => {
              const isFinnable = bank.bank_name?.toUpperCase()?.includes('FINNABLE');
              const isIncred = bank.bank_name?.toUpperCase()?.includes('INCRED');
              
              let username = bank.portal_username || '';
              let password = bank.portal_password || '';
              
              if (!username && isFinnable) username = '9389119399';
              if (!password && isFinnable) password = 'Call 9389119399 (OTP Support)';
              if (!username && isIncred) username = 'incredhtoh@gmail.com';
              if (!password && isIncred) password = 'Call & Message on WhatsApp to 9389119399 (OTP Support)';
              
              const hasCredentials = username || password || affiliateLink;
              if (!hasCredentials) return null;
              
              return (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>🔑 Partner Portal Login Credentials:</div>
                  <div style={{ display: 'grid', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {username && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>• <strong>Login ID / Username:</strong> {username}</span>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(username); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                      </div>
                    )}
                    {password && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>• <strong>Password / OTP Contact:</strong> {password}</span>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(password); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                      </div>
                    )}
                    {affiliateLink && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>• <strong>Portal Link:</strong> <a href={affiliateLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>Open Partner Link ↗</a></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Apply Button */}
        <button
          onClick={() => onApply(bank)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '10px 0',
            borderRadius: 'var(--border-radius-sm)',
            background: (affiliateLink || userRole === 'user') ? 'var(--gradient-primary)' : 'rgba(99, 102, 241, 0.15)',
            border: (affiliateLink || userRole === 'user') ? 'none' : '1px solid rgba(99, 102, 241, 0.3)',
            color: (affiliateLink || userRole === 'user') ? '#fff' : 'var(--color-primary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            if (affiliateLink || userRole === 'user') {
              e.currentTarget.style.opacity = '0.88';
            } else {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
            }
          }}
          onMouseLeave={e => {
            if (affiliateLink || userRole === 'user') {
              e.currentTarget.style.opacity = '1';
            } else {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
            }
          }}
        >
          {(affiliateLink || userRole === 'user') ? '🚀 Apply Now' : '📩 Apply for Client'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BanksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Pincode check
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResults, setPincodeResults] = useState(null); // { bankName: true/false }
  const [pincodeSearched, setPincodeSearched] = useState('');

  // Client Application Modal States
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [muthootSubType, setMuthootSubType] = useState('daily');

  // Auth — agents, admins, and customers
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login?redirect=/banks');
        return;
      }
      // Fetch role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role || 'customer';
      if (role !== 'agent' && role !== 'admin' && role !== 'user') {
        // Customer — no access
        router.push('/?error=agent_only');
        return;
      }
      setUser(session.user);
      setUserRole(role);
      setUserProfile(profile);
      setCheckingAuth(false);
    });
  }, [router]);

  // Fetch all bank policies
  useEffect(() => {
    if (checkingAuth) return;
    const fetchBanks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_policies')
        .select('*')
        .order('bank_name', { ascending: true });
      if (!error && data) setBanks(data);
      setLoading(false);
    };
    fetchBanks();
  }, [checkingAuth]);

  // Pincode search: check which banks serve this pincode
  const handlePincodeSearch = useCallback(async () => {
    const pin = pincodeInput.trim();
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeChecking(true);
    setPincodeResults(null);

    // Get banks from bank_pincodes table for this pincode
    const { data: pincodeRows } = await supabase
      .from('bank_pincodes')
      .select('bank_name')
      .eq('pincode', pin)
      .eq('is_active', true);

    const availableBankNames = new Set(pincodeRows?.map(r => r.bank_name) || []);

    // Banks with all_pincodes = true are always available
    const result = {};
    banks.forEach(b => {
      if (b.all_pincodes) {
        result[b.bank_name] = true;
      } else {
        result[b.bank_name] = availableBankNames.has(b.bank_name);
      }
    });

    setPincodeResults(result);
    setPincodeSearched(pin);
    setPincodeChecking(false);
  }, [pincodeInput, banks]);

  // Client Application handlers (same as check/page.js)
  const handleOpenApplyModal = (bank) => {
    setSelectedBank(bank);
    setClientName(userRole === 'user' ? (userProfile?.name || '') : '');
    setClientMobile(userRole === 'user' ? (userProfile?.phone || '') : '');
    setLoanAmount('');
    setApplySuccess('');
    setApplyError('');
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientMobile.trim() || !loanAmount) {
      setApplyError('Please fill in all fields.');
      return;
    }
    if (!/^\d{10}$/.test(clientMobile.trim())) {
      setApplyError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (Number(loanAmount) <= 0) {
      setApplyError('Please enter a valid loan amount.');
      return;
    }

    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const affiliateLink = userRole === 'user' ? null : getAffiliateLink(selectedBank.bank_name, selectedBank.loan_type, muthootSubType, selectedBank.apply_url, selectedBank.direct_submit);

      if (affiliateLink) {
        // Direct redirection bank portal -> store in localStorage as pending bank application
        const pendingData = {
          clientName: clientName.trim(),
          clientMobile: clientMobile.trim(),
          bankName: selectedBank.bank_name,
          loanAmount: Number(loanAmount),
          loanType: selectedBank.loan_type,
          affiliateLink: affiliateLink
        };
        localStorage.setItem('pending_bank_application', JSON.stringify(pendingData));
        setApplySuccess(`Opening portal link in a new tab...`);
        window.open(affiliateLink, '_blank');
      } else {
        // No link -> Offline application, insert immediately
        const uniqueAppId = `H2H-APP-${Math.floor(100000 + Math.random() * 900000)}`;
        const { error } = await supabase.from('applications').insert({
          agent_id: user.id,
          client_name: clientName.trim(),
          client_mobile: clientMobile.trim(),
          bank_name: selectedBank.bank_name,
          loan_amount: Number(loanAmount),
          loan_type: selectedBank.loan_type,
          commission_rate: 2.00,
          commission_amount: Number(loanAmount) * 0.02,
          status: 'Applied',
          application_id: uniqueAppId
        });

        if (error) {
          setApplyError(error.message);
        } else {
          setApplySuccess(`Successfully applied to ${selectedBank.bank_name} for ${clientName}! Application ID: ${uniqueAppId}`);
        }
      }
      setTimeout(() => {
        setApplyModalOpen(false);
      }, 2000);
    } catch (err) {
      setApplyError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  // Derived filtered list
  const filteredBanks = banks.filter(b => {
    const nameMatch = b.bank_name.toLowerCase().includes(searchName.toLowerCase());
    const catMatch = filterCategory === 'ALL' || b.policy_category === filterCategory;
    return nameMatch && catMatch;
  });

  // Stats
  const totalBanks = banks.length;
  const salaryBanks = banks.filter(b => b.policy_category === 'salary').length;
  const instantBanks = banks.filter(b => b.policy_category === 'instant').length;
  const businessBanks = banks.filter(b => b.policy_category === 'business').length;

  if (checkingAuth) {
    return (
      <>
        <Header />
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Verifying Account…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content">
        {/* ── Hero Section ── */}
        <section style={{ background: 'var(--gradient-bg-mesh)', borderBottom: 'var(--border-subtle)', padding: '48px 24px 40px' }}>
          <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-primary)', background: 'rgba(45,212,191,0.1)', padding: '4px 14px', borderRadius: '99px' }}>
                {userRole === 'user' ? 'Customer Portal' : 'Agent Portal'}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px', lineHeight: 1.15 }}>
              🏦 All Partner Banks
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', maxWidth: '560px', lineHeight: 1.6 }}>
              Browse all available bank policies, check pincode serviceability, and apply directly.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '28px' }}>
              {[
                { label: 'Total Banks', value: totalBanks, color: 'var(--color-primary)' },
                { label: 'Salary Loans', value: salaryBanks, color: 'var(--color-accent)' },
                { label: 'Instant Loans', value: instantBanks, color: 'var(--color-success)' },
                { label: 'Business Loans', value: businessBanks, color: 'var(--color-warning)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--color-bg-card)', border: 'var(--border-subtle)', borderRadius: 'var(--border-radius-md)', padding: '14px 20px', minWidth: '120px', backdropFilter: 'blur(12px)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Filters & Pincode Search ── */}
        <section style={{ padding: '28px 24px', background: 'var(--color-bg-secondary)', borderBottom: 'var(--border-subtle)', position: 'sticky', top: 'var(--header-height)', zIndex: 50 }}>
          <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>

            {/* Bank name search */}
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Search Bank</label>
              <input
                type="text"
                placeholder="Type bank name…"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-bg-input)', border: 'var(--border-subtle)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}
              />
            </div>

            {/* Loan Category Filter */}
            <div style={{ flex: '0 1 200px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Loan Category</label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-bg-input)', border: 'var(--border-subtle)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">All Categories</option>
                <option value="salary">💼 Salary Loans</option>
                <option value="instant">⚡ Instant Loans</option>
                <option value="business">🏢 Business Loans</option>
              </select>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '40px', background: 'var(--border-default)', alignSelf: 'flex-end', marginBottom: '0' }} />

            {/* Pincode search */}
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                📍 Pincode Availability Check
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={e => { setPincodeInput(e.target.value.replace(/\D/g, '')); if (pincodeResults) { setPincodeResults(null); setPincodeSearched(''); } }}
                  onKeyDown={e => e.key === 'Enter' && handlePincodeSearch()}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-bg-input)', border: 'var(--border-subtle)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}
                />
                <button
                  onClick={handlePincodeSearch}
                  disabled={pincodeChecking || pincodeInput.length !== 6}
                  style={{ padding: '10px 18px', borderRadius: 'var(--border-radius-sm)', background: pincodeInput.length === 6 ? 'var(--gradient-primary)' : 'var(--color-bg-tertiary)', border: 'none', color: pincodeInput.length === 6 ? '#fff' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '13px', cursor: pincodeInput.length === 6 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                >
                  {pincodeChecking ? '⏳' : '🔍 Check'}
                </button>
              </div>
            </div>

            {/* Clear pincode */}
            {pincodeResults && (
              <button
                onClick={() => { setPincodeResults(null); setPincodeSearched(''); setPincodeInput(''); }}
                style={{ alignSelf: 'flex-end', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'transparent', border: 'var(--border-subtle)', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Pincode result summary bar */}
          {pincodeResults && (
            <div style={{ maxWidth: 'var(--container-max)', margin: '16px auto 0', padding: '12px 16px', background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                📍 Pincode {pincodeSearched} Results:
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                ✅ {Object.values(pincodeResults).filter(Boolean).length} banks available
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
                ❌ {Object.values(pincodeResults).filter(v => !v).length} banks not available
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                (Cards highlighted — green = available, dimmed = not available)
              </span>
            </div>
          )}
        </section>

        {/* ── Bank Grid ── */}
        <section style={{ padding: '32px 24px 64px', maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          {/* Result count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredBanks.length}</strong> of <strong style={{ color: 'var(--color-text-primary)' }}>{totalBanks}</strong> banks
              {pincodeResults && <span style={{ color: 'var(--color-primary)', marginLeft: '8px' }}>for pincode <strong>{pincodeSearched}</strong></span>}
            </p>
            {(searchName || filterCategory !== 'ALL') && (
              <button onClick={() => { setSearchName(''); setFilterCategory('ALL'); }} style={{ fontSize: '12px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ✕ Clear Filters
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading bank policies…</p>
            </div>
          ) : filteredBanks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>No banks found</h3>
              <p style={{ fontSize: 'var(--text-sm)' }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '20px' }}>
              {filteredBanks.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  pincodeResult={pincodeResults ? pincodeResults[bank.bank_name] : null}
                  onApply={handleOpenApplyModal}
                  userRole={userRole}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Client Application Modal for Agents */}
      {applyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="form-card" style={{ maxWidth: 'min(480px, 96vw)', width: '100%', margin: '0 auto', display: 'grid', gap: '20px', border: 'var(--border-accent)', background: 'var(--color-bg-tertiary)', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{userRole === 'user' ? 'Apply for Loan' : 'Apply for Client'}</h3>
              <button onClick={() => setApplyModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BankLogo bankName={selectedBank?.bank_name} logoUrl={selectedBank?.logo_url} size={32} />
              <div>
                <h4 style={{ fontWeight: 600 }}>{selectedBank?.bank_name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Type: {selectedBank?.policy_category === 'salary' ? 'Salary Loan' : selectedBank?.policy_category === 'instant' ? 'Instant Loan' : 'Business Loan'}
                </p>
              </div>
            </div>

            {applyError && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>⚠ {applyError}</div>}
            {applySuccess && <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>✓ {applySuccess}</div>}

            <form onSubmit={handleApplySubmit} style={{ display: 'grid', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">{userRole === 'user' ? 'Your Name' : 'Client Name'}</label>
                <input
                  type="text"
                  className="input-field"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">{userRole === 'user' ? 'Your Mobile Number' : 'Client Mobile Number'}</label>
                <input
                  type="tel"
                  className="input-field"
                  value={clientMobile}
                  onChange={(e) => setClientMobile(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Requested Loan Amount</label>
                <div className="input-wrapper">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    className="input-field has-prefix"
                    value={loanAmount}
                    placeholder="e.g. 500000"
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {selectedBank?.bank_name?.toUpperCase()?.includes('MUTHOOT') && selectedBank?.loan_type === 'BL' && (
                <div className="input-group" style={{ marginTop: '16px' }}>
                  <label className="input-label">Muthoot Business Loan Product <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      <input 
                        type="radio" 
                        name="muthoot_type" 
                        checked={muthootSubType === 'daily'} 
                        onChange={() => setMuthootSubType('daily')} 
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      Daily EMI
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      <input 
                        type="radio" 
                        name="muthoot_type" 
                        checked={muthootSubType === 'monthly'} 
                        onChange={() => setMuthootSubType('monthly')} 
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      Monthly EMI
                    </label>
                  </div>
                </div>
              )}

              {userRole !== 'user' && (() => {
                const isFinnable = selectedBank?.bank_name?.toUpperCase()?.includes('FINNABLE');
                const isIncred = selectedBank?.bank_name?.toUpperCase()?.includes('INCRED');
                
                let username = selectedBank?.portal_username || '';
                let password = selectedBank?.portal_password || '';
                
                if (!username && isFinnable) username = '9389119399';
                if (!password && isFinnable) password = 'Call 9389119399 (OTP Support)';
                if (!username && isIncred) username = 'incredhtoh@gmail.com';
                if (!password && isIncred) password = 'Call & Message on WhatsApp to 9389119399 (OTP Support)';
                
                const hasCredentials = username || password;
                
                if (selectedBank?.direct_submit) {
                  return null;
                }

                if (hasCredentials) {
                  return (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: 'var(--border-subtle)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      marginTop: '16px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      display: 'grid',
                      gap: '6px'
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>🔑 Partner Login Details:</div>
                      {username && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>• <strong>Login ID / Username:</strong> {username}</span>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(username); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                        </div>
                      )}
                      {password && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>• <strong>Password / OTP Contact:</strong> {password}</span>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(password); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {(() => {
                const hasLink = userRole !== 'user' && getAffiliateLink(selectedBank?.bank_name, selectedBank?.loan_type, muthootSubType, selectedBank?.apply_url, selectedBank?.direct_submit);
                if (hasLink) return null;
                
                return (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    lineHeight: '1.4'
                  }}>
                    <span>
                      📥 Direct Submission: This application will be submitted directly to the administrator who will apply for you on the partner portal.
                    </span>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setApplyModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={applying}>
                  {applying ? 'Submitting...' : (userRole !== 'user' && getAffiliateLink(selectedBank?.bank_name, selectedBank?.loan_type, muthootSubType, selectedBank?.apply_url, selectedBank?.direct_submit)) ? 'Submit & Open Link ↗' : 'Submit to Admin'}
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
