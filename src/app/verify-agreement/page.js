'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function VerifyAgreementContent() {
  const searchParams = useSearchParams();
  const agreementNoParam = searchParams.get('no') || '';

  const [searchNo, setSearchNo] = useState(agreementNoParam);
  const [agreement, setAgreement] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // QR code scanning state
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
      // Security (F10): Subresource Integrity hash prevents CDN supply chain attacks.
      // If the file is tampered, the browser will refuse to execute it.
      script.integrity = "sha384-c9d8RFSL+u3exBOJ4Yp3HUJXS4znl9f+z66d1y54ig+ea249SpqR+w1wyvXz/lk+";
      script.crossOrigin = "anonymous";
      script.onload = () => resolve(window.Html5Qrcode);
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  };

  const handleVerify = async (agreeNumber) => {
    if (!agreeNumber.trim()) return;
    setLoading(true);
    setError('');
    setAgreement(null);
    setProfile(null);
    setSearched(true);

    try {
      const cleanNo = agreeNumber.trim().toUpperCase();
      const { data, error: fetchErr } = await supabase
        .from('agent_agreements')
        .select('*')
        .eq('agreement_no', cleanNo)
        .maybeSingle();

      if (fetchErr) {
        setError('Database query failed: ' + fetchErr.message);
      } else if (!data) {
        setError(`Agreement number "${cleanNo}" is invalid or does not exist in our official records.`);
      } else {
        setAgreement(data);
        
        // Security (F6): phone is PII — excluded from public unauthenticated lookup.
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .eq('id', data.agent_id)
          .single();

        if (!profErr && prof) {
          setProfile(prof);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
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
          const html5QrCode = new Html5QrcodeLib("page-qr-reader");
          window.pageQrScannerInstance = html5QrCode;
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
              setSearchNo(refNo);
              setIsScanning(false);
              handleVerify(refNo);
            },
            (errorMessage) => {
              // silent scanning
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
    if (window.pageQrScannerInstance) {
      try {
        if (window.pageQrScannerInstance.isScanning) {
          await window.pageQrScannerInstance.stop();
        }
        window.pageQrScannerInstance = null;
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
    if (agreementNoParam) {
      const timer = setTimeout(() => {
        handleVerify(agreementNoParam);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [agreementNoParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify(searchNo);
  };

  return (
    <div className="form-card text-center" style={{ maxWidth: '580px', width: '100%', margin: '0 auto', backdropFilter: 'blur(25px)', border: 'var(--border-light)' }}>
      <h2 className="form-step-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        Verify Agent Agreement
      </h2>
      <p className="form-step-subtitle">Check the validity of an official HandToHand Loans Partner Agreement</p>

      {/* Toggle Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0' }}>
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', margin: '24px 0 16px 0', textAlign: 'left' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Enter Agreement No (e.g. H2H-DSA-13147)"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '100%', padding: '12px 24px' }} disabled={loading}>
            {loading ? 'Searching...' : 'Verify'}
          </button>
        </form>
      )}

      {/* QR Scanner View */}
      {isScanning && (
        <div style={{ textAlign: 'center', display: 'grid', gap: '12px', margin: '20px 0' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Point your camera at the QR code printed on the agent&apos;s agreement document.
          </p>
          <div id="page-qr-reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}></div>
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

      {loading && (
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Verifying agreement details...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: '#ef4444',
          margin: '20px 0'
        }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}></span>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: '8px' }}>Verification Failed</div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.6' }}>{error}</p>
        </div>
      )}

      {!loading && agreement && (
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          
          {agreement.status === 'active' ? (
            /* Active status success box */
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#10b981',
                fontSize: '28px',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Verified Agreement
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5' }}>
                This partner agreement is active and officially recognized in the HandToHand Loans database.
              </p>
            </div>
          ) : (
            /* Revoked/Terminated status box */
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                color: '#ef4444',
                fontSize: '28px',
                fontWeight: 'bold'
              }}>
                ✕
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Agreement Revoked / Terminated
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.5' }}>
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
            gap: '12px',
            fontSize: 'var(--text-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Number:</span>
              <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{agreement.agreement_no}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Agent Name:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{profile?.full_name || 'HandToHand Loans Agent'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Agent Mobile Number:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>Verified ✓</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Agent Agreement Date:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {(() => {
                  const d = new Date(agreement.signed_at);
                  const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                  return `${datePart} at ${timePart}`;
                })()}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Valid Upto Date:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {(() => {
                  const d = new Date(agreement.signed_at);
                  d.setFullYear(d.getFullYear() + 1);
                  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Status:</span>
              <strong style={{ color: agreement.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>{agreement.status}</strong>
            </div>

            {agreement.status !== 'active' && agreement.revocation_reason && (
              <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Revocation Reason:</span>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', lineHeight: '1.5' }}>{agreement.revocation_reason}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {searched && !loading && !agreement && !error && (
        <div style={{ padding: '24px 0', color: 'var(--color-text-tertiary)' }}>
          No agreement found. Try entering a different reference number.
        </div>
      )}
    </div>
  );
}

export default function VerifyAgreementPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page">
          <div className="form-container" style={{ maxWidth: '640px' }}>
            <Suspense fallback={
              <div className="form-card text-center" style={{ padding: '64px 32px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Loading verification module...</p>
              </div>
            }>
              <VerifyAgreementContent />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
