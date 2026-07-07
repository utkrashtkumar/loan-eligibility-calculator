'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AgreementPrintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const iframeRef = useRef(null);

  // Helper: convert base64 data URI to Uint8Array
  function dataUriToBytes(dataUri) {
    const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  // Helper: fetch image as Uint8Array
  async function fetchImageBytes(url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  // Helper: mask Aadhaar
  function maskAadhaar(num) {
    if (!num) return 'N/A';
    const clean = num.toString().replace(/\D/g, '');
    return clean.length >= 12 ? `XXXX-XXXX-${clean.slice(-4)}` : `XXXX-XXXX-${clean}`;
  }

  // Helper: wrap text to fit width
  function wrapText(text, maxWidth, fontSize, font) {
    if (!text) return ['N/A'];
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : ['N/A'];
  }

  async function generatePdf(prof, agr) {
    setGenerating(true);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
      const fontkit = (await import('@pdf-lib/fontkit')).default;

      // ---- 1. Load the new base 11-page agreement PDF ----
      const basePdfRes = await fetch('/HandToHand_Loans_DSA_Agreement_2026_.pdf');
      if (!basePdfRes.ok) throw new Error('Failed to load HandToHand_Loans_DSA_Agreement_2026_.pdf');
      const basePdfBytes = await basePdfRes.arrayBuffer();
      const pdfDoc = await PDFDocument.load(basePdfBytes);
      pdfDoc.registerFontkit(fontkit);

      // ---- 2. Embed fonts ----
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const timesNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      const pages = pdfDoc.getPages();
      const page2 = pages[1]; // Page 2 (index 1)
      const page11 = pages[10]; // Page 11 (index 10)

      // ---- 3. If revoked — stamp REVOKED watermark on pages (except page 10) ----
      const isRevoked = agr.status === 'revoked';
      if (isRevoked) {
        for (let i = 0; i < pages.length; i++) {
          if (i === 9) continue; // Skip Page 10 (index 9)
          const pg = pages[i];
          const { width, height } = pg.getSize();
          pg.drawText('REVOKED', {
            x: width / 2 - 130,
            y: height / 2,
            size: 100,
            font: timesBold,
            color: rgb(0.94, 0.27, 0.27),
            opacity: 0.07,
            rotate: degrees(-45),
          });
        }
      }

      // ---- 4. Setup colors and data ----
      const green = rgb(0.04, 0.47, 0.34);
      const darkText = rgb(0.1, 0.1, 0.1);
      const midText = rgb(0.35, 0.35, 0.35);
      const lightText = rgb(0.55, 0.55, 0.55);
      const lightGreen = rgb(0.93, 0.98, 0.96);
      const borderGreen = rgb(0.7, 0.9, 0.82);

      const agentName = prof.full_name || 'N/A';
      const agentPhone = prof.phone || 'N/A';
      const agentEmail = prof.email || 'N/A';
      const agentPAN = prof.id_type === 'PAN Card' ? prof.id_number :
                       prof.id_type_2 === 'PAN Card' ? prof.id_number_2 : 'N/A';
      const agentAadhaar = prof.id_type === 'Aadhaar Card' ? maskAadhaar(prof.id_number) :
                           prof.id_type_2 === 'Aadhaar Card' ? maskAadhaar(prof.id_number_2) : 'N/A';

      const agreementNo = agr.agreement_no || 'N/A';
      const signedDate = new Date(agr.signed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      const signedDateTime = `${signedDate} at ${new Date(agr.signed_at).toLocaleTimeString('en-IN', { hour12: false })}`;
      const joiningDateObj = prof.created_at ? new Date(prof.created_at) : null;
      const joiningDateStr = joiningDateObj ? joiningDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
      const joiningDateTime = joiningDateObj ? `${joiningDateStr} at ${joiningDateObj.toLocaleTimeString('en-IN', { hour12: false })}` : 'N/A';
      const bankDetails = [
        prof.bank_name ? `Bank: ${prof.bank_name}` : '',
        prof.bank_account_no ? `A/c: ${prof.bank_account_no}` : '',
        prof.bank_ifsc ? `IFSC: ${prof.bank_ifsc}` : '',
      ].filter(Boolean).join(' | ') || 'N/A';

      // ---- 5. Overlay agent details on Page 2 ----
      // Clear placeholders helper with exact vertical centering
      const clearRowOnPage2 = (yCenter) => {
        // No-op to avoid drawing solid white boxes that obscure the background watermark
      };

      // Agreement Date
      clearRowOnPage2(660.5);
      page2.drawText(signedDateTime, { x: 222.2, y: 660.5, size: 11, font: timesNormal, color: darkText });

      // Agreement No.
      clearRowOnPage2(609.8);
      page2.drawText(agreementNo, { x: 222.2, y: 609.8, size: 11, font: timesBold, color: green });

      // Agent / DSA Name
      clearRowOnPage2(559.0);
      page2.drawText(agentName, { x: 222.2, y: 559.0, size: 11, font: timesBold, color: darkText });

      // PAN Number
      clearRowOnPage2(508.4);
      page2.drawText(agentPAN, { x: 222.2, y: 508.4, size: 11, font: timesNormal, color: darkText });

      // Aadhaar Number (masked)
      clearRowOnPage2(457.8);
      page2.drawText(agentAadhaar, { x: 222.2, y: 457.8, size: 11, font: timesNormal, color: darkText });

      // Business / Firm Name
      clearRowOnPage2(407.1);
      page2.drawText('Individual', { x: 222.2, y: 407.1, size: 11, font: timesNormal, color: darkText });

      // Registered / Residential Address (clears address placeholder area)
      clearRowOnPage2(363.4);
      clearRowOnPage2(349.6);
      const addrText = [prof.current_address, prof.city, prof.state, prof.pincode].filter(Boolean).join(', ') || 'N/A';
      const addrLines = wrapText(addrText, 310, 9.5, timesNormal);
      addrLines.slice(0, 2).forEach((line, index) => {
        page2.drawText(line, { x: 222.2, y: 363.4 - index * 10, size: 9.5, font: timesNormal, color: darkText });
      });

      // Mobile Number
      clearRowOnPage2(305.8);
      page2.drawText(agentPhone, { x: 222.2, y: 305.8, size: 11, font: timesNormal, color: darkText });

      // Email Address
      clearRowOnPage2(255.1);
      page2.drawText(agentEmail, { x: 222.2, y: 255.1, size: 11, font: timesNormal, color: darkText });

      // Bank Account Details
      clearRowOnPage2(211.5);
      clearRowOnPage2(197.7);
      page2.drawText(bankDetails, { x: 222.2, y: 204.6, size: 10, font: timesNormal, color: darkText });

      // Joining Date
      clearRowOnPage2(160.8);
      page2.drawText(joiningDateTime, { x: 222.2, y: 160.8, size: 11, font: timesNormal, color: darkText });


      // ---- 6. Overlay agent signature & details on Page 11 ----
      // Clear Agent Name placeholder on page 11 (original label 'Agent Name' at y=524.7)
      // page11.drawRectangle({ x: 62, y: 520, width: 220, height: 16, color: rgb(1, 1, 1) });
      page11.drawText(agentName, { x: 65.1, y: 524.7, size: 11, font: timesBold, color: darkText });

      // Clear DSA Partner designation placeholder on page 11 (original label at y=514.5)
      // page11.drawRectangle({ x: 62, y: 510, width: 220, height: 10, color: rgb(1, 1, 1) });
      page11.drawText('DSA Partner', { x: 65.1, y: 514.5, size: 9, font: timesNormal, color: midText });

      // Draw Date next to the label 'Date:' at y=497.9 (no placeholder needs clearing)
      page11.drawText(signedDateTime, { x: 98.0, y: 497.9, size: 11, font: timesNormal, color: darkText });

      // Embed agent signature image
      if (agr.signature_base64) {
        try {
          const sigBytes = dataUriToBytes(agr.signature_base64);
          let sigImg;
          const sigUri = agr.signature_base64;
          if (sigUri.includes('image/png') || sigUri.startsWith('iVBOR')) {
            sigImg = await pdfDoc.embedPng(sigBytes);
          } else {
            sigImg = await pdfDoc.embedJpg(sigBytes);
          }
          // The DSA Signature label is at y=633.5, the Name label is at y=570.3.
          // Place signature image nicely centered at y = 582 with height = 40.
          const sigDims = sigImg.scaleToFit(160, 40);
          page11.drawImage(sigImg, {
            x: 75,
            y: 582,
            width: sigDims.width,
            height: sigDims.height,
          });
        } catch (e) {
          console.warn('Signature embed failed:', e);
          page11.drawText('[Signature]', { x: 65, y: 590, size: 10, font: timesItalic, color: midText });
        }
      }

      // Draw QR Code block on the right side of Page 11
      const rightColX = 370;
      const rightColY = 560;
      const rightColW = 120;
      const rightColH = 135;

      page11.drawRectangle({
        x: rightColX,
        y: rightColY,
        width: rightColW,
        height: rightColH,
        color: lightGreen,
        borderColor: borderGreen,
        borderWidth: 1,
      });

      page11.drawText('DIGITAL VERIFICATION', {
        x: rightColX + 10,
        y: rightColY + rightColH - 15,
        size: 7.5,
        font: timesBold,
        color: green,
      });

      const verificationUrl = `${window.location.origin}/verify-agreement?no=${agreementNo}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}&format=png`;
      try {
        const qrBytes = await fetchImageBytes(qrApiUrl);
        const qrImg = await pdfDoc.embedPng(qrBytes);
        const qrDims = qrImg.scaleToFit(90, 90);
        page11.drawImage(qrImg, {
          x: rightColX + (rightColW - qrDims.width) / 2,
          y: rightColY + 15,
          width: qrDims.width,
          height: qrDims.height,
        });
      } catch (e) {
        console.warn('QR embed failed:', e);
        page11.drawText('[QR Code]', { x: rightColX + 30, y: rightColY + 50, size: 9, font: timesNormal, color: midText });
      }

      page11.drawText('Scan to verify authenticity', {
        x: rightColX + 10,
        y: rightColY + 5,
        size: 7,
        font: timesNormal,
        color: lightText,
      });

      // ---- 7. Save & display ----
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`Failed to generate agreement PDF: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/agreement-print');
          return;
        }

        const queryParams = new URLSearchParams(window.location.search);
        const targetAgentId = queryParams.get('id');

        const { data: currentUser, error: userErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userErr || !currentUser) {
          setError('User profile not found.');
          setLoading(false);
          return;
        }

        let profileId = session.user.id;
        if (targetAgentId) {
          if (currentUser.role === 'admin') {
            profileId = targetAgentId;
          } else if (targetAgentId !== session.user.id) {
            setError('Access denied. You do not have permission to view this agreement.');
            setLoading(false);
            return;
          }
        }

        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profErr || !prof) {
          setError('Agent profile not found.');
          setLoading(false);
          return;
        }
        setProfile(prof);

        const { data: agree, error: agreeErr } = await supabase
          .from('agent_agreements')
          .select('*')
          .eq('agent_id', profileId)
          .order('signed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (agreeErr || !agree) {
          setError('No signed agreement found for this agent.');
          setLoading(false);
          return;
        }
        setAgreement(agree);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load agreement data.');
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  useEffect(() => {
    if (!loading && profile && agreement && !pdfUrl) {
      setTimeout(() => {
        generatePdf(profile, agreement);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, agreement]);

  function handleDownload() {
    if (!pdfUrl || !agreement) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `DSA-Agreement-${agreement.agreement_no || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handlePrint() {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.print();
  }

  // ---- Loading screens ----
  if (loading || generating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0f1d', color: '#fff', fontFamily: 'Inter, sans-serif', gap: '20px' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
          <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(16,185,129,0.15)', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>
            {loading ? 'Loading Agreement Data…' : 'Generating Your PDF…'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
            {loading ? 'Fetching your profile and agreement from the database.' : 'Building PDF with your signature and verification QR code.'}
          </p>
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0f1d', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center', gap: '20px' }}>
        <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⚠️</div>
        <div>
          <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Unable to Load Agreement</p>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, maxWidth: '360px' }}>{error}</p>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ padding: '10px 24px', background: '#10b981', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Top Action Bar ── */}
      <div style={{
        position: 'sticky', top: 0, width: '100%', zIndex: 9999,
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.2px' }}>DSA Partner Agreement</div>
            <div style={{ color: '#10b981', fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
              {agreement?.agreement_no} &nbsp;·&nbsp; {profile?.full_name}
            </div>
          </div>
          {agreement?.status === 'revoked' && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>REVOKED</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            disabled={!pdfUrl}
            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: pdfUrl ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', opacity: pdfUrl ? 1 : 0.5, transition: 'opacity 0.2s' }}
          >
            ↓ Download PDF
          </button>
          <button
            onClick={handlePrint}
            disabled={!pdfUrl}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: pdfUrl ? 'pointer' : 'not-allowed', opacity: pdfUrl ? 1 : 0.5 }}
          >
            🖨 Print
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* ── PDF Viewer ── */}
      <div style={{ background: '#111827', minHeight: 'calc(100vh - 53px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px', gap: '16px' }}>
        {pdfUrl ? (
          <>
            <div style={{ color: '#6b7280', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              {profile?.full_name} — {agreement?.agreement_no} — Generated {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <iframe
              ref={iframeRef}
              src={pdfUrl + '#toolbar=1&navpanes=1&scrollbar=1'}
              style={{
                width: '100%', maxWidth: '900px',
                height: 'calc(100vh - 130px)', minHeight: '700px',
                border: 'none', borderRadius: '10px',
                boxShadow: '0 8px 50px rgba(0,0,0,0.6)',
              }}
              title="DSA Agreement PDF"
            />
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>📄</span>
            <p>PDF is loading…</p>
          </div>
        )}
      </div>
    </>
  );
}
