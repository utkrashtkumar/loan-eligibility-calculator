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

const getAffiliateLink = (bankName, loanType = 'PL') => {
  if (!bankName) return null;
  const n = bankName.toUpperCase();
  if (n.includes('MUTHOOT')) {
    if (loanType === 'BL') return BANK_AFFILIATE_LINKS['MUTHOOT DAILY BL'];
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

// ─── Employment type badge ───────────────────────────────────────────────────
const EmpBadge = ({ type }) => {
  const map = {
    salaried: { label: '💼 Salary Loan', color: 'var(--color-primary)', bg: 'rgba(45,212,191,0.1)' },
    self_employed: { label: '⚡ Instant Loan', color: 'var(--color-accent)', bg: 'rgba(251,146,60,0.1)' },
    both: { label: '🔄 Both', color: 'var(--color-warning)', bg: 'rgba(251,191,36,0.1)' },
  };
  const m = map[type] || map.salaried;
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', color: m.color, background: m.bg, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
};

// ─── Single Bank Card ────────────────────────────────────────────────────────
function BankCard({ bank, pincodeResult }) {
  const affiliateLink = getAffiliateLink(bank.bank_name, bank.loan_type);
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
          <BankLogo bankName={bank.bank_name} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {bank.bank_name}
            </h3>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: bank.loan_type === 'BL' ? 'rgba(251,191,36,0.15)' : 'rgba(45,212,191,0.1)', color: bank.loan_type === 'BL' ? 'var(--color-warning)' : 'var(--color-primary)', letterSpacing: '0.05em' }}>
              {bank.loan_type || 'PL'}
            </span>
            <EmpBadge type={bank.employment_type || 'salaried'} />
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
              ['Loan Type', bank.loan_type || 'PL'],
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
          </div>
        )}

        {/* Apply Button */}
        {affiliateLink ? (
          <a
            href={affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', width: '100%', textAlign: 'center', padding: '10px 0', borderRadius: 'var(--border-radius-sm)', background: 'var(--gradient-primary)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', letterSpacing: '0.02em', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            🚀 Apply Now
          </a>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0', borderRadius: 'var(--border-radius-sm)', background: 'rgba(100,124,121,0.15)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '13px' }}>
            Contact Admin to Apply
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BanksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterLoanType, setFilterLoanType] = useState('ALL');
  const [filterEmpType, setFilterEmpType] = useState('ALL');

  // Pincode check
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResults, setPincodeResults] = useState(null); // { bankName: true/false }
  const [pincodeSearched, setPincodeSearched] = useState('');

  // Auth — agents & admins only
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login?redirect=/banks');
        return;
      }
      // Fetch role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approved')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role || 'customer';
      if (role !== 'agent' && role !== 'admin') {
        // Customer — no access
        router.push('/?error=agent_only');
        return;
      }
      setUser(session.user);
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

  // Derived filtered list
  const filteredBanks = banks.filter(b => {
    const nameMatch = b.bank_name.toLowerCase().includes(searchName.toLowerCase());
    const loanMatch = filterLoanType === 'ALL' || b.loan_type === filterLoanType;
    const empMatch = filterEmpType === 'ALL' || (b.employment_type || 'salaried') === filterEmpType;
    return nameMatch && loanMatch && empMatch;
  });

  // Stats
  const totalBanks = banks.length;
  const plBanks = banks.filter(b => b.loan_type === 'PL').length;
  const blBanks = banks.filter(b => b.loan_type === 'BL').length;
  const instantBanks = banks.filter(b => (b.employment_type || 'salaried') !== 'salaried').length;

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
                Agent Portal
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
                { label: 'Personal Loan', value: plBanks, color: 'var(--color-accent)' },
                { label: 'Business Loan', value: blBanks, color: 'var(--color-warning)' },
                { label: 'Instant Loan', value: instantBanks, color: 'var(--color-success)' },
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

            {/* Loan type filter */}
            <div style={{ flex: '0 1 150px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Loan Type</label>
              <select
                value={filterLoanType}
                onChange={e => setFilterLoanType(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-bg-input)', border: 'var(--border-subtle)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">All Types</option>
                <option value="PL">Personal Loan</option>
                <option value="BL">Business Loan</option>
              </select>
            </div>

            {/* Emp type filter */}
            <div style={{ flex: '0 1 165px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Loan Category</label>
              <select
                value={filterEmpType}
                onChange={e => setFilterEmpType(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-bg-input)', border: 'var(--border-subtle)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">All Categories</option>
                <option value="salaried">💼 Salary Loans</option>
                <option value="self_employed">⚡ Instant Loans</option>
                <option value="both">🔄 Both</option>
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
            {(searchName || filterLoanType !== 'ALL' || filterEmpType !== 'ALL') && (
              <button onClick={() => { setSearchName(''); setFilterLoanType('ALL'); setFilterEmpType('ALL'); }} style={{ fontSize: '12px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
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
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
