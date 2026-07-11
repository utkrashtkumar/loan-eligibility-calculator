'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmiCalculator from '@/components/EmiCalculator';
import BankLogo from '@/components/BankLogo';
import { supabase } from '@/lib/supabase';

function AnimatedCounter({ target, duration = 1500, suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return <span ref={setElement}>{count.toFixed(decimals)}{suffix}</span>;
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', mobile: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [creditCards, setCreditCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [user, setUser] = useState(null);

  // Verification and QR Scanner State
  const [agreementNo, setAgreementNo] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningError, setScanningError] = useState('');

  const isScanningRef = useRef(isScanning);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  const loadHtml5Qrcode = () => {
    return new Promise((resolve, reject) => {
      if (window.Html5Qrcode) {
        resolve(window.Html5Qrcode);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.async = true;
      script.onload = () => resolve(window.Html5Qrcode);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  const handleVerifyAgent = async (codeToVerify) => {
    const code = (codeToVerify || agreementNo).trim().toUpperCase();
    if (!code) {
      alert("Please enter or scan an Agreement Number.");
      return;
    }
    setVerificationLoading(true);
    setVerificationError('');
    setVerificationResult(null);

    try {
      const { data: agreementData, error: fetchErr } = await supabase
        .from('agent_agreements')
        .select('*')
        .eq('agreement_no', code)
        .maybeSingle();

      if (fetchErr) {
        setVerificationError('Query error: ' + fetchErr.message);
      } else if (!agreementData) {
        setVerificationError(`Agreement number "${code}" is invalid or does not exist in our official records.`);
      } else {
        const { data: profileData, error: profErr } = await supabase
          .from('profiles')
          .select('full_name, phone, created_at')
          .eq('id', agreementData.agent_id)
          .single();

        if (profErr) {
          setVerificationError('Failed to fetch agent profile details.');
        } else {
          setVerificationResult({
            agreement: agreementData,
            profile: profileData
          });
        }
      }
    } catch (err) {
      console.error(err);
      setVerificationError('An unexpected error occurred during verification.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const startScanner = async () => {
    setScanningError('');
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    try {
      const Html5QrcodeLib = await loadHtml5Qrcode();
      scanTimeoutRef.current = setTimeout(async () => {
        if (!isScanningRef.current) return;
        try {
          const html5QrCode = new Html5QrcodeLib("home-qr-reader");
          window.homeQrScannerInstance = html5QrCode;
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              let refNo = decodedText;
              try {
                if (decodedText.includes('verify-agreement') || decodedText.includes('no=')) {
                  const urlObj = new URL(decodedText.startsWith('http') ? decodedText : `http://localhost/${decodedText}`);
                  const noParam = urlObj.searchParams.get('no');
                  if (noParam) {
                    refNo = noParam;
                  }
                }
              } catch (e) {
                // ignore parsing error
              }
              setAgreementNo(refNo);
              setIsScanning(false);
              handleVerifyAgent(refNo);
            },
            (errorMessage) => {
              // silent scanning errors
            }
          );
        } catch (initErr) {
          console.error("Camera init error:", initErr);
          setScanningError("Could not initialize camera scanner. Please check device permissions.");
          setIsScanning(false);
        }
      }, 300);
    } catch (err) {
      console.error("Library load error:", err);
      setScanningError("Failed to load QR scanner library.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (window.homeQrScannerInstance) {
      try {
        if (window.homeQrScannerInstance.isScanning) {
          await window.homeQrScannerInstance.stop();
        }
        window.homeQrScannerInstance = null;
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
  };

  useEffect(() => {
    let timer;
    if (isScanning) {
      timer = setTimeout(() => {
        startScanner();
      }, 0);
    } else {
      stopScanner();
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Fetch banks
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase
          .from('bank_policies')
          .select('*')
          .order('bank_name', { ascending: true });
        if (!error && data) {
          setBanks(data);
        }
      } catch (err) {
        console.error('Error fetching banks:', err);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();

    // Fetch credit cards
    const fetchCreditCards = async () => {
      try {
        const { data, error } = await supabase
          .from('credit_cards')
          .select('*')
          .order('bank_name', { ascending: true });
        if (!error && data) {
          setCreditCards(data);
        }
      } catch (err) {
        console.error('Error fetching credit cards:', err);
      } finally {
        setLoadingCards(false);
      }
    };
    fetchCreditCards();

    // Handle hash change for categories
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#banks-instant') {
        setActiveCategory('instant');
        setTimeout(() => {
          document.getElementById('banks')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (hash === '#banks-salary') {
        setActiveCategory('salary');
        setTimeout(() => {
          document.getElementById('banks')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (hash === '#banks-business') {
        setActiveCategory('business');
        setTimeout(() => {
          document.getElementById('banks')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Trigger initially if hash is already present

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setFormState((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.mobile || !formState.message) {
      alert('Please fill in all mandatory fields.');
      return;
    }
    if (!/^\d{10}$/.test(formState.mobile)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formState.name,
          email: formState.email,
          mobile: formState.mobile,
          subject: formState.subject || null,
          message: formState.message
        }]);

      if (error) throw error;

      setIsSubmitted(true);
      setFormState({ name: '', email: '', mobile: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error submitting contact form:', err);
      alert('Failed to send message: ' + (err.message || 'Unknown network error. Make sure migrations are run.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: "What is HandToHand Loans?",
      a: "HandToHand Loans is an intelligent platform that lets you check your loan eligibility for Salary, Instant, and Business loans across 100+ major Indian banks and NBFCs in under 60 seconds. We analyze your credit profile, salary, location, and existing liabilities against complex bank lending rules to find your best matches."
    },
    {
      q: "Is checking my eligibility free, and does it affect my CIBIL score?",
      a: "Yes, our eligibility check is 100% free and always will be. Checking your eligibility on our platform is a \"soft search\" and does not impact your CIBIL credit score in any way."
    },
    {
      q: "What documents are required to apply for a loan after matching?",
      a: "Typically, you will need your PAN card, Aadhaar card, last 3 months' bank statements, salary slips (for salaried individuals), or business proof (for self-employed individuals)."
    },
    {
      q: "How accurate are the eligibility scores?",
      a: "Our matching engine uses real-time bank policies, credit criteria, FOIR calculations, and location mapping. While highly accurate (90%+ alignment with bank decisions), the final loan approval and interest rates are determined solely by the partner bank/NBFC after physical document verification."
    },
    {
      q: "How can I earn commissions as a Referral Agent?",
      a: "You can sign up as a Referral Agent, check eligibility for your clients, submit their applications, and track progress on your Agent Dashboard. You earn payouts/commissions for every successfully disbursed loan."
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            "name": "Hand to Hand Fintech Loan Checker & EMI Calculator",
            "description": "Calculate loan EMIs and check eligibility for Personal, Business, and Instant loans in collaboration with PNB.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            }
          })
        }}
      />
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content visible">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Trusted by 10,000+ borrowers
          </div>

          <h1 className="hero-title">
            Start Your Journey as a
            <span className="hero-title-gradient"> Loan DSA Agent &amp; Empowering Borrowers</span>
          </h1>

          <p className="hero-subtitle" style={{ maxWidth: '750px' }}>
            Join India&apos;s fastest-growing fintech distribution ecosystem. Sign up as a DSA Partner to check eligibility, submit files, and earn high commissions, or customer check your eligibility instantly.
          </p>

          <div className="hero-cta-wrapper" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link href="/signup?role=agent" className="btn btn-primary hero-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow-purple)', color: '#ffffff', border: 'none' }}>
              Become a DSA Partner
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </Link>
            <Link href="/check" className="btn btn-secondary hero-cta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Check Eligibility
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Floating Stats */}
          <div className="hero-stats" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <path d="M3 21h18" />
                  <path d="M3 10h18" />
                  <path d="M5 6h14" />
                  <path d="M4 10v11" />
                  <path d="M20 10v11" />
                  <path d="M8 14v3" />
                  <path d="M12 14v3" />
                  <path d="M16 14v3" />
                  <path d="M12 2L2 7h20L12 2z" />
                </svg>
              </span>
              <span className="hero-stat-value">100+</span>
              <span className="hero-stat-label">Banks & NBFCs</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span className="hero-stat-value">60s</span>
              <span className="hero-stat-label">Instant Results</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </span>
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Free Forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Component 1: Stats Header & Multiple Advantages */}
      <section className="section light-section" style={{ borderBottom: '1px solid #e2e8f0', padding: '60px 0' }}>
        <div className="container">
          {/* Top Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            textAlign: 'center',
            paddingBottom: '48px',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '48px',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                <AnimatedCounter target={50} suffix="K+" />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginTop: '4px' }}>
                ACTIVE DSA PARTNERS
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                ₹<AnimatedCounter target={500} suffix="Cr+" />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginTop: '4px' }}>
                LOANS DISBURSED
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                <AnimatedCounter target={4.9} suffix="/5" decimals={1} />
              </div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginTop: '4px' }}>
                PARTNER RATING
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="light-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
              Multiple Advantages <span style={{ color: '#10b981' }}>At One Platform</span>
            </h2>
            <p className="light-subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)' }}>
              Everything you need to succeed as a loan DSA partner, all in one place
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
            gap: '24px'
          }}>
            {/* Easy Onboarding */}
            <div className="white-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--color-accent-light)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Easy Onboarding</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Get started in minutes with our fully digital verification process. No paperwork hassle.
              </p>
            </div>

            {/* Same Day Payout */}
            <div className="white-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--color-primary-light)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12" />
                  <path d="M6 8h12" />
                  <path d="M6 13h3" />
                  <path d="M9 13c6.667 0 6.667-10 0-10" />
                  <path d="m9 13 9 9" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Payout</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Earn commissions instantly with our automated same-day payout system. No delays.
              </p>
            </div>

            {/* Zero Investment */}
            <div className="white-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Zero Investment</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Start earning without any upfront investment. Completely free to join and operate.
              </p>
            </div>

            {/* Pan India Working */}
            <div className="white-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Pan India Working</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Serve customers across India with our nationwide network of banking partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Component 2: Who Can Join & Performance Tiers */}
      <section className="section light-section-subtle" style={{ borderBottom: '1px solid #e2e8f0', padding: '60px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'start'
          }}>
            {/* Left Column: Who Can Join */}
            <div>
              <span className="light-tag" style={{ color: '#10b981' }}>WHO CAN JOIN</span>
              <h2 className="light-title" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', color: 'var(--color-text-primary)', marginBottom: '32px', marginTop: '8px' }}>
                Anyone Can Be<br />a HandToHand Partner
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Pill 1 */}
                <div className="white-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Financial Consultants & Loan Connectors</span>
                </div>
                {/* Pill 2 */}
                <div className="white-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Insurance Agents — natural cross-sell opportunity</span>
                </div>
                {/* Pill 3 */}
                <div className="white-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Chartered Accountants — finance-ready client base</span>
                </div>
                {/* Pill 4 */}
                <div className="white-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Students and Homemakers — passive income</span>
                </div>
                {/* Pill 5 */}
                <div className="white-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '20px' }}></span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Real Estate Agents — connect buyers to loans</span>
                </div>
              </div>
            </div>

            {/* Right Column: Performance Tiers */}
            <div>
              <span className="light-tag" style={{ color: '#10b981' }}>INCENTIVE PROGRAM</span>
              <h2 className="light-title" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', color: 'var(--color-text-primary)', marginBottom: '32px', marginTop: '8px' }}>
                Performance Tiers
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Silver Tier */}
                <div className="white-card tier-card-silver" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                    Silver
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    ₹<AnimatedCounter target={0} /> - ₹<AnimatedCounter target={25} suffix="L/mo" /> monthly disbursal
                  </div>
                </div>
                {/* Gold Tier */}
                <div className="white-card tier-card-gold" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-warning)' }}>
                    Gold
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 500 }}>
                    ₹<AnimatedCounter target={25} />L - ₹<AnimatedCounter target={75} suffix="L/mo" /> monthly disbursal
                  </div>
                </div>
                {/* Platinum Tier */}
                <div className="white-card tier-card-platinum" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-accent)' }}>
                    Platinum
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 500 }}>
                    ₹<AnimatedCounter target={75} suffix="L+" /> — Unlimited monthly disbursal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantage Metrics Section */}
      <section className="section metrics-section" style={{ borderBottom: 'var(--border-subtle)', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle glassmorphic glows */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="hero-badge" style={{ margin: '0 auto 16px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', color: 'var(--color-accent)' }}>
              <span className="hero-badge-dot" style={{ backgroundColor: 'var(--color-accent)' }}></span>
              Optimized for Highest Payouts & Success
            </div>
            <h2 className="section-title">
              Our Core <span className="text-gradient">Advantage Metrics</span>
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '650px', margin: '12px auto 0' }}>
              Real-time numbers driving India&apos;s leading fintech referral network. We deliver high payouts, unmatched approval speed, and complete operational transparency.
            </p>
          </div>

          <div className="metrics-grid">
            {/* Active Lender Partnerships */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <line x1="6" y1="21" x2="6" y2="17" />
                    <line x1="10" y1="21" x2="10" y2="17" />
                    <line x1="14" y1="21" x2="14" y2="17" />
                    <line x1="18" y1="21" x2="18" y2="17" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={30} suffix="+" />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Active Lender Partnerships
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Direct integrations with over 30 leading Indian banks and NBFCs. We match your clients across the widest pool of financial policies to secure the best interest rates and low processing fees.
                </p>
              </div>
            </div>

            {/* Approval Rates */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 8 8 12 12 16" />
                    <line x1="16" y1="12" x2="8" y2="12" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={97.8} suffix="%" decimals={1} />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Industry-High Approval Rates
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Our main mission is to achieve the highest approval rate. By dynamically checking CIBIL, FOIR, and age thresholds beforehand, we route files only to matching policy criteria to yield 97.8% approval success.
                </p>
              </div>
            </div>

            {/* Commission Structure */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12" />
                    <path d="M6 8h12" />
                    <path d="M6 13h3" />
                    <path d="M9 13c6.667 0 6.667-10 0-10" />
                    <path d="m9 13 9 9" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={3.5} suffix="%" decimals={1} />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Unmatched Commission Structure
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Earn payouts up to 3.5% commission on successfully disbursed loan files. Our tiered agent program ensures higher loan volumes translate directly to premium slab rates.
                </p>
              </div>
            </div>

            {/* Payout Speed within 24 hours */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={24} suffix="h" />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Payout Speed Within 24h
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Stop waiting months for bank payouts. Once a loan is marked disbursed, request a payout and receive your referral commission directly to your UPI or bank account in under 24 hours.
                </p>
              </div>
            </div>

            {/* Lead Quality */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(99, 102, 241, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={99.2} suffix="%" decimals={1} />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Elite Lead Quality Validation
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Our advanced eligibility matching filters out ineligible applicants instantly. That means DSAs submit highly pre-qualified leads, ensuring a 99.2% policy match alignment with final bank terms.
                </p>
              </div>
            </div>

            {/* Agent Support */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={24.7} suffix="" decimals={1} />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  24/7 Dedicated Agent Support
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Our agent portal connects you to highly expert relationship managers who handle bank escalations, follow up on pending approvals, and troubleshoot any customer document issues.
                </p>
              </div>
            </div>

            {/* Transparency of Agreements */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  <AnimatedCounter target={100} suffix="%" />
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  100% Agreement &amp; Operational Transparency
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  No hidden clauses. All terms, payout structures, slab thresholds, and client applications are tracked dynamically. You see exactly what is approved, what is pending, and your exact payout calculations in real-time.
                </p>
              </div>
            </div>

            {/* Real-Time Application Tracking */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 20px rgba(16, 185, 129, 0.05)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(99, 102, 241, 0.15)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M9 14h6" />
                    <path d="M9 18h6" />
                    <path d="M9 10h6" />
                  </svg>
                </div>
                <div style={{
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: 'Outfit, var(--font-sans)',
                  lineHeight: 1
                }}>
                  Live
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Real-Time Application Tracking
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: '#475569', lineHeight: 1.6 }}>
                  Monitor your leads from submission to disbursal with instant status updates. View exact stage progress, bottleneck alerts, and bank communications instantly on your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Component 3: Our Business Success in Numbers */}
      <section style={{ position: 'relative' }}>
        {/* Dark Blue Header Band */}
        <div style={{
          background: '#004899',
          padding: '80px 0 60px 0',
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
              Our Business Success in Numbers
            </h2>
            <p style={{ color: '#e2e8f0', fontSize: 'var(--text-base)', maxWidth: '600px', margin: '0 auto' }}>
              We connect people with the best financial solutions across India.
            </p>
          </div>
        </div>

        {/* Overlapping Pill Badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '-24px',
          position: 'relative',
          zIndex: 10,
          padding: '0 16px'
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)',
            border: '2px solid #10b981',
            borderRadius: '9999px',
            padding: '12px 32px',
            fontWeight: 700,
            color: '#10b981',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontSize: 'var(--text-sm)',
            textAlign: 'center'
          }}>
            Over ₹<AnimatedCounter target={1.5} decimals={1} suffix=" Lakh Crores" /> Loans Disbursed Annually
          </div>
        </div>

        {/* Cards Section */}
        <div style={{
          background: 'var(--color-bg-primary)',
          padding: '60px 0',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '24px'
            }}>
              {/* Card 1 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={4000} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Serviceable Across All<br />Pan India PIN Codes
                </div>
              </div>

              {/* Card 2 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={250} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Branch Network
                </div>
              </div>

              {/* Card 3 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="11" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={150} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Trusted Bank Partners
                </div>
              </div>

              {/* Card 4 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={5000} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Employees
                </div>
              </div>

              {/* Card 5 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={10000} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Active Loan Agents
                </div>
              </div>

              {/* Card 6 */}
              <div className="white-card" style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--color-accent)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  <AnimatedCounter target={25000} suffix="+" />
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                  Financial Expert<br />Advisors
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Banks Section */}
      <section id="banks" className="section banks-section" style={{ borderTop: 'var(--border-subtle)', background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="hero-badge" style={{ margin: '0 auto 16px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
              <span className="hero-badge-dot" style={{ backgroundColor: 'var(--color-primary)' }}></span>
              Our Financial Network
            </div>
            <h2 className="section-title">
              Available <span className="text-gradient">Partner Banks</span>
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '650px', margin: '12px auto 0' }}>
              We partner with India&apos;s leading banks and NBFCs to offer you the best loan deals. Check the details and apply.
            </p>
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all', label: 'All Partners' },
              { id: 'instant', label: 'Instant Loans' },
              { id: 'salary', label: 'Salary Loans' },
              { id: 'business', label: 'Business Loans' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  if (tab.id === 'all') {
                    window.history.replaceState(null, '', ' ');
                  } else {
                    window.history.replaceState(null, '', `#banks-${tab.id}`);
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: activeCategory === tab.id ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
                  background: activeCategory === tab.id ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.02)',
                  color: activeCategory === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  if (activeCategory !== tab.id) {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeCategory !== tab.id) {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingBanks ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading partner banks…</p>
            </div>
          ) : banks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              No partner banks configured yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
              {(() => {
                const filteredBanks = activeCategory === 'all'
                  ? banks
                  : banks.filter(bank => (bank.policy_category || 'salary') === activeCategory);
                if (filteredBanks.length === 0) {
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', background: 'var(--color-bg-card)', border: 'var(--border-subtle)', borderRadius: 'var(--border-radius-lg)' }}>
                      No partner banks match the selected category.
                    </div>
                  );
                }
                return filteredBanks.map((bank) => (
                  <div key={bank.id} style={{
                    background: 'var(--color-bg-card)',
                    border: 'var(--border-subtle)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BankLogo bankName={bank.bank_name} logoUrl={bank.logo_url} size={32} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                          {bank.bank_name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '99px',
                          color: bank.policy_category === 'salary' ? 'var(--color-primary)' : bank.policy_category === 'instant' ? 'var(--color-success)' : 'var(--color-warning)',
                          background: bank.policy_category === 'salary' ? 'rgba(99, 102, 241, 0.1)' : bank.policy_category === 'instant' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.15)',
                          textTransform: 'uppercase'
                        }}>
                          {bank.policy_category || 'salary'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', borderTop: 'var(--border-subtle)', paddingTop: '12px' }}>
                        {bank.min_salary > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Min Salary:</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>₹{Number(bank.min_salary).toLocaleString('en-IN')}</strong>
                          </div>
                        )}
                        {bank.min_cibil > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Min CIBIL:</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{bank.min_cibil}</strong>
                          </div>
                        )}
                        {bank.foir_max > 0 && bank.foir_max < 100 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Max FOIR:</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{bank.foir_max}%</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/banks"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '12px', background: 'var(--gradient-primary)', border: 'none', color: '#ffffff' }}
                    >
                      Apply Now
                    </Link>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Available Credit Cards Section */}
      <section id="home-credit-cards" className="section credit-cards-section" style={{ borderTop: 'var(--border-subtle)', background: 'var(--color-bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="hero-badge" style={{ margin: '0 auto 16px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)' }}>
              <span className="hero-badge-dot" style={{ backgroundColor: 'var(--color-primary)' }}></span>
              Exclusive Card Offers
            </div>
            <h2 className="section-title">
              Featured <span className="text-gradient">Partner Credit Cards</span>
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '650px', margin: '12px auto 0' }}>
              Explore premium credit cards from our verified banking partners and apply instantly.
            </p>
          </div>

          {loadingCards ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading credit card partners...</p>
            </div>
          ) : creditCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              No credit card partners configured yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
              {creditCards.map((card) => (
                <div key={card.id} style={{
                  background: 'var(--color-bg-card)',
                  border: 'var(--border-subtle)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BankLogo bankName={card.bank_name} logoUrl={card.logo_url} size={32} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                        {card.bank_name}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/credit-cards"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '12px', background: 'var(--gradient-primary)', border: 'none', color: '#ffffff' }}
                  >
                    Apply Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EMI Calculator Section */}
      <section id="emi-calculator" className="section emi-calculator-section" style={{ borderTop: 'var(--border-subtle)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">
              Calculate Your <span className="text-gradient">Loan EMIs</span>
            </h2>
            <p className="section-subtitle">
              Check your monthly payments instantly using fixed or reducing interest rate structures.
            </p>
          </div>
          <EmiCalculator />
        </div>
      </section>

      {/* Why HandToHand? Section */}
      <section className="section features-section" style={{ paddingBottom: '32px' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '48px' }}>
            Why <span className="text-gradient">HandToHand?</span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
            gap: '24px'
          }}>
            {/* Faster Approvals */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Faster Approvals
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                API integrations directly with lenders cut processing times by 80%.
              </p>
            </div>

            {/* Smart Matching */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Smart Matching
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Say goodbye to rejections. Apply only where approval probability is high.
              </p>
            </div>

            {/* Human + AI */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Human + AI
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                The efficiency of algorithms backed by expert human relationship managers.
              </p>
            </div>

            {/* 100% Transparent */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                100% Transparent
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Real-time tracking for every file, payout, and status update.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Loan Solutions Section */}
      <section className="section solutions-section" style={{ paddingTop: '32px', borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">
              Smart <span className="text-gradient">Loan Solutions</span>
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '600px', margin: '8px auto 0' }}>
              Instant AI-driven loan infrastructure for every financial need.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '24px'
          }}>
            {/* Salary Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Salary Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Tailored loan matches for salaried individuals with steady employment at top banks.
                </p>
              </div>
              <Link href="/banks/salary" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                View Available Banks
              </Link>
            </div>

            {/* Business Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Business Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Smart capital infrastructure for startups, MSMEs, and growing enterprises.
                </p>
              </div>
              <Link href="/banks/business" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                View Available Banks
              </Link>
            </div>

            {/* Instant Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Instant Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Real-time digital verification with ultra-fast AI-powered approvals.
                </p>
              </div>
              <Link href="/banks/instant" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                View Available Banks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Component 5: The HandToHand Lead Journey */}
      <section className="section light-section-subtle" style={{ borderBottom: '1px solid var(--border-default)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="light-tag" style={{ color: '#10b981' }}>THE PROCESS</span>
            <h2 className="light-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-text-primary)', marginBottom: '12px', marginTop: '8px' }}>
              The HandToHand Lead Journey
            </h2>
            <p className="light-subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)' }}>
              End-to-end support from file login to account credit. Every step tracked, automated, and transparent.
            </p>
          </div>

          {/* Timeline Steps */}
          <div className="process-timeline-wrapper">
            {/* Step 1 */}
            <div className="timeline-card" style={{ flex: '1 1 180px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg-primary)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#3b82f6'
              }}>
                01
              </div>
              <div style={{ color: '#3b82f6', margin: '8px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="16" y1="11" x2="22" y2="11" />
                </svg>
              </div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Lead Entry</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Agent enters basic customer details — Salary, CIBIL score, Loan Amount, and Pincode via the React Dashboard.
              </p>
            </div>

            {/* Step 2 */}
            <div className="timeline-card" style={{ flex: '1 1 180px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg-primary)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#10b981'
              }}>
                02
              </div>
              <div style={{ color: '#10b981', margin: '8px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>AI Bank Matching</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                50+ bank policies scanned in real time. Top-3 bank matches with confidence scores are instantly generated.
              </p>
            </div>

            {/* Step 3 */}
            <div className="timeline-card" style={{ flex: '1 1 180px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg-primary)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#d97706'
              }}>
                03
              </div>
              <div style={{ color: '#d97706', margin: '8px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Document Upload & QC</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                KYC, income proof, and bank statements uploaded. AI QC immediately checks document quality and completeness.
              </p>
            </div>

            {/* Step 4 */}
            <div className="timeline-card" style={{ flex: '1 1 180px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg-primary)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#a855f7'
              }}>
                04
              </div>
              <div style={{ color: '#a855f7', margin: '8px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Bank Login</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Pre-filtered &quot;Disbursement-Ready&quot; profile submitted to the bank via API. Parallel processing for borderline profiles.
              </p>
            </div>

            {/* Step 5 */}
            <div className="timeline-card" style={{ flex: '1 1 180px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg-primary)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: '#10b981'
              }}>
                05
              </div>
              <div style={{ color: '#10b981', margin: '8px 0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 8 8 12 12 16" />
                  <line x1="16" y1="12" x2="8" y2="12" />
                </svg>
              </div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Disbursement & Payout</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Loan credited to customer. Real-time Socket.io notification updates agent wallet. Override commission auto-calculated.
              </p>
            </div>
          </div>

          {/* 3 Dark Stats Cards Below */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '56px'
          }}>
            {/* Stat Block 1 */}
            <div className="dark-stat-block">
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
                <AnimatedCounter target={15} suffix=" min" />
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                File Submission
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8' }}>
                vs 4 hours industry average
              </div>
            </div>

            {/* Stat Block 2 */}
            <div className="dark-stat-block">
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
                <AnimatedCounter target={40} suffix="%" />
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Faster TAT
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8' }}>
                Turn Around Time reduced
              </div>
            </div>

            {/* Stat Block 3 */}
            <div className="dark-stat-block">
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#10b981', fontFamily: 'Outfit, sans-serif', marginBottom: '8px' }}>
                <AnimatedCounter target={70} suffix="%" />
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Rejection Reduction
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8' }}>
                Target through AI matching
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Find Your Perfect Loan?</h2>
            <p className="cta-subtitle">
              Join thousands of borrowers who found their ideal loan match in under a minute.
            </p>
            <Link
              href="/check"
              className="btn btn-primary btn-lg"
              style={{
                marginTop: '16px',
                padding: '16px 36px',
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-glow-purple), 0 8px 24px rgba(251, 146, 60, 0.35)',
                transform: 'translateY(0)',
                transition: 'all var(--transition-base)'
              }}
            >
              Start Free Check
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Component 4: Full Agent Support Ecosystem */}
      <section className="section light-section" style={{ borderBottom: '1px solid var(--border-default)', padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="light-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
              Full Agent Support Ecosystem
            </h2>
            <p className="light-subtitle" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)' }}>
              Everything you need to succeed — built in.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {/* Card 1: AI Chatbot */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                AI Chatbot 24/7
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Any policy question answered instantly in Hinglish. Zero dependency on human training.
              </p>
            </div>

            {/* Card 2: Dedicated RM */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                Dedicated RM
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Each major agent gets a Relationship Manager — one call away for any issue.
              </p>
            </div>

            {/* Card 3: Weekly Webinars */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                Weekly Webinars
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                3-4 training sessions weekly on new bank policies, product updates, and case studies.
              </p>
            </div>

            {/* Card 4: Agent Academy */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                Agent Academy
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Pre-recorded video tutorials for beginners. Step-by-step guides to close files fast.
              </p>
            </div>

            {/* Card 5: Marketing Kit */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                Marketing Kit
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Authorized Partner posters, social media banners, digital content — personal branding managed.
              </p>
            </div>

            {/* Card 6: Community Forums */}
            <div className="white-card" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                Community Forums
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                WhatsApp groups + forums for agents to share knowledge and best practices.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Become a Partner Section */}
      <section className="section partner-banner-section" style={{ padding: '40px 0', borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <div style={{
            background: '#0a101f',
            borderRadius: '24px',
            padding: '60px 40px',
            textAlign: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255, 255, 255, 0.03)'
          }}>
            <span style={{
              color: '#10b981',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              display: 'inline-block',
              marginBottom: '16px',
              textTransform: 'uppercase'
            }}>
              BECOME A PARTNER
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '16px',
              lineHeight: 1.2
            }}>
              Zero Investment.<br />Unlimited Earning.
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: 'var(--text-sm)',
              maxWidth: '650px',
              margin: '0 auto 32px',
              lineHeight: 1.6
            }}>
              HandToHand mein zero investment hai — sirf mehnat chahiye. Join India&apos;s fastest-growing loan distribution network and earn up to 2% on every disbursement.
            </p>
            <Link
              href="/signup?role=agent"
              className="btn btn-primary"
              style={{
                background: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Register as Agent </Link>
          </div>
        </div>
      </section>

      {/* Verify Agent Partner Agreement Section */}
      <section className="section verify-partner-section" id="verify-partner" style={{ borderTop: 'var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)', padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '640px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 className="light-title" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-text-primary)', marginBottom: '12px' }}>
              Verify <span style={{ color: 'var(--color-primary)' }}>Agent Partner</span>
            </h2>
            <p className="light-subtitle" style={{ maxWidth: '580px', margin: '0 auto', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Scan the QR code on an agent&apos;s agreement or manually enter their Agreement Reference Number to verify their active DSA status.
            </p>
          </div>

          <div className="form-card" style={{ backdropFilter: 'blur(25px)', border: 'var(--border-light)', padding: '28px 24px', borderRadius: '16px' }}>

            {/* Toggle Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsScanning(false);
                  setScanningError('');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: !isScanning ? '2px solid var(--color-primary)' : 'var(--border-light)',
                  background: !isScanning ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-bg-input)',
                  color: !isScanning ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: isScanning ? '2px solid var(--color-accent)' : 'var(--border-light)',
                  background: isScanning ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-input)',
                  color: isScanning ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Scan QR Code
              </button>
            </div>

            {/* Manual Entry View */}
            {!isScanning && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyAgent(); }} style={{ display: 'flex', gap: '10px', textAlign: 'left' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter Agreement No (e.g. H2H-DSA-13147)"
                    value={agreementNo}
                    onChange={(e) => setAgreementNo(e.target.value)}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '100%', padding: '12px 24px' }} disabled={verificationLoading}>
                  {verificationLoading ? 'Searching...' : 'Verify'}
                </button>
              </form>
            )}

            {/* QR Scanner View */}
            {isScanning && (
              <div style={{ textAlign: 'center', display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Point your camera at the QR code printed on the agent&apos;s agreement document.
                </p>
                <div id="home-qr-reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}></div>
                {scanningError && (
                  <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>{scanningError}</p>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ justifySelf: 'center', marginTop: '8px' }}
                  onClick={() => setIsScanning(false)}
                >
                  Cancel Scan
                </button>
              </div>
            )}

            {/* Verification Loading */}
            {verificationLoading && (
              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Verifying agreement details...</p>
              </div>
            )}

            {/* Verification Failure / Error */}
            {!verificationLoading && verificationError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                color: '#ef4444',
                margin: '20px 0'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></span>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Verification Failed</div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5' }}>{verificationError}</p>
              </div>
            )}

            {/* Verification Success Results */}
            {!verificationLoading && verificationResult && (
              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                {verificationResult.agreement.status === 'active' ? (
                  /* Active Success Banner */
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px auto',
                      color: '#10b981',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Verified Active Partner
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      This agent partner agreement is active and officially recognized by HandToHand Loans.
                    </p>
                  </div>
                ) : (
                  /* Revoked/Terminated Banner */
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px auto',
                      color: '#ef4444',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
                      ✕
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Agreement Revoked / Terminated
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      This agreement has been revoked or terminated by the administrator and is no longer valid.
                    </p>
                  </div>
                )}

                {/* Details Table */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: 'var(--border-light)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'grid',
                  gap: '10px',
                  fontSize: 'var(--text-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Agent Name:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{verificationResult.profile.full_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Agent Mobile Number:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{verificationResult.profile.phone}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Number:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{verificationResult.agreement.agreement_no}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Agent Agreement Date:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      {(() => {
                        const d = new Date(verificationResult.agreement.signed_at);
                        const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                        const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                        return `${datePart} at ${timePart}`;
                      })()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Valid Upto Date:</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      {(() => {
                        const d = new Date(verificationResult.agreement.signed_at);
                        d.setFullYear(d.getFullYear() + 1);
                        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                      })()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Status:</span>
                    <strong style={{ color: verificationResult.agreement.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>{verificationResult.agreement.status}</strong>
                  </div>

                  {verificationResult.agreement.status !== 'active' && verificationResult.agreement.revocation_reason && (
                    <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Revocation Reason:</span>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', lineHeight: '1.4' }}>{verificationResult.agreement.revocation_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq-section" style={{ borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <h2 className="section-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="section-subtitle">
            Find answers to common questions about eligibility checks, credit scores, and agent partnerships
          </p>

          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                <button className="faq-header" onClick={() => handleFaqToggle(idx)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div className="faq-body">
                  <div className="faq-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="section contact-section" style={{ borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <h2 className="section-title">
            Contact <span className="text-gradient">Our Team</span>
          </h2>
          <p className="section-subtitle">
            Have queries, partnership requests, or need support? We are here to help.
          </p>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-card-info">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Email Us</h4>
                    <p className="contact-info-text">handtohandloans@gmail.com</p>
                    <p className="contact-info-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>We reply within 24 hours</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Helpline Hours</h4>
                    <p className="contact-info-text">Monday to Saturday</p>
                    <p className="contact-info-text">9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Secure & Encrypted</h4>
                    <p className="contact-info-text">Your personal and financial information is fully protected under bank-grade security protocols.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              {isSubmitted ? (
                <div className="contact-success-card">
                  <div className="contact-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="contact-success-title">Message Sent!</h3>
                  <p className="contact-success-text">
                    Thank you for reaching out. We have received your inquiry and our support team will contact you shortly.
                  </p>
                  <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="responsive-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                      <input
                        type="text"
                        name="name"
                        className="input-field"
                        placeholder="Your Name"
                        required
                        value={formState.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Email <span style={{ color: 'var(--color-error)' }}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        className="input-field"
                        placeholder="Your Email"
                        required
                        value={formState.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Mobile Number <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <input
                      type="tel"
                      name="mobile"
                      className="input-field"
                      placeholder="Enter your 10-digit mobile number"
                      required
                      maxLength={10}
                      value={formState.mobile}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Subject</label>
                    <input
                      type="text"
                      name="subject"
                      className="input-field"
                      placeholder="Subject (e.g. Agent Query, Eligibility Help)"
                      value={formState.subject}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Message <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <textarea
                      name="message"
                      className="input-field"
                      placeholder="Type your message here..."
                      rows="4"
                      required
                      value={formState.message}
                      onChange={handleInputChange}
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
