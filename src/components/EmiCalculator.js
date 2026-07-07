'use client';

import { useState, useEffect } from 'react';

// ─── Lazy Initializers for URL Parameter Sync (Server-Side Safe) ───────────
function getInitialAmount() {
  if (typeof window === 'undefined') return 500000;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('amount');
  return val ? Math.min(100000000, Math.max(10000, Number(val))) : 500000;
}

function getInitialRate() {
  if (typeof window === 'undefined') return 10.5;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('rate');
  return val ? Math.min(50, Math.max(1, Number(val))) : 10.5;
}

function getInitialTenureType() {
  if (typeof window === 'undefined') return 'months';
  const params = new URLSearchParams(window.location.search);
  const val = params.get('tenureType');
  return val === 'years' ? 'years' : 'months';
}

function getInitialTenure() {
  if (typeof window === 'undefined') return 36;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('tenure');
  const type = params.get('tenureType') === 'years' ? 'years' : 'months';
  const maxT = type === 'years' ? 30 : 360;
  return val ? Math.min(maxT, Math.max(1, Number(val))) : 36;
}

function getInitialIncome() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('income') || '';
}

function getInitialExistingEmi() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('existingEmi') || '';
}

export default function EmiCalculator() {
  // State initialization via lazy initializers (fully safe for SSR + effect lint rules)
  const [loanAmount, setLoanAmount]       = useState(getInitialAmount);
  const [interestRate, setInterestRate]   = useState(getInitialRate);
  const [tenureType, setTenureType]       = useState(getInitialTenureType);
  const [tenure, setTenure]               = useState(getInitialTenure);
  const [monthlyIncome, setMonthlyIncome] = useState(getInitialIncome);
  const [existingEmi, setExistingEmi]     = useState(getInitialExistingEmi);
  
  // Interactive UI states
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationTab, setAmortizationTab]   = useState('reducing'); // 'reducing' or 'flat'
  const [copied, setCopied]                     = useState(false);
  const [generatingPdf, setGeneratingPdf]       = useState(false);

  // ─── Calculator math variables ──────────────────────────────────────────
  const P = Number(loanAmount) || 0;
  const R = Number(interestRate) || 0;
  const N = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure);

  // ─── Reducing Balance Calculations ───────────────────────────────────────
  let reducingEmi = 0;
  let reducingTotalInterest = 0;
  let reducingTotalPayment = 0;
  let reducingPrincipalPercent = 100;
  let reducingInterestPercent = 0;
  let reducingSchedule = [];

  if (P > 0 && R > 0 && N > 0) {
    const monthlyRate = R / 12 / 100;
    const emiVal = (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1);
    const totalPayVal = emiVal * N;
    const totalIntVal = totalPayVal - P;

    reducingEmi = Math.round(emiVal);
    reducingTotalInterest = Math.round(totalIntVal);
    reducingTotalPayment = Math.round(totalPayVal);
    reducingPrincipalPercent = Math.round((P / reducingTotalPayment) * 100);
    reducingInterestPercent = 100 - reducingPrincipalPercent;

    // Generate reducing schedule
    let remainingPrincipal = P;
    for (let i = 1; i <= N; i++) {
      const openingBal = remainingPrincipal;
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = emiVal - interestPayment;
      remainingPrincipal -= principalPayment;

      reducingSchedule.push({
        month: i,
        opening: Math.round(openingBal),
        emi: Math.round(emiVal),
        interest: Math.round(interestPayment),
        principal: Math.round(principalPayment),
        closing: Math.max(0, Math.round(remainingPrincipal))
      });
    }
  }

  // ─── Flat Rate Calculations ──────────────────────────────────────────────
  let flatEmi = 0;
  let flatTotalInterest = 0;
  let flatTotalPayment = 0;
  let flatPrincipalPercent = 100;
  let flatInterestPercent = 0;
  let flatSchedule = [];

  if (P > 0 && R > 0 && N > 0) {
    const tenureInYears = N / 12;
    const totalIntVal = P * (R / 100) * tenureInYears;
    const totalPayVal = P + totalIntVal;
    const emiVal = totalPayVal / N;

    flatEmi = Math.round(emiVal);
    flatTotalInterest = Math.round(totalIntVal);
    flatTotalPayment = Math.round(totalPayVal);
    flatPrincipalPercent = Math.round((P / flatTotalPayment) * 100);
    flatInterestPercent = 100 - flatPrincipalPercent;

    // Generate flat schedule
    const monthlyInterest = totalIntVal / N;
    const monthlyPrincipal = P / N;
    let remainingPrincipal = P;
    for (let i = 1; i <= N; i++) {
      const openingBal = remainingPrincipal;
      remainingPrincipal -= monthlyPrincipal;

      flatSchedule.push({
        month: i,
        opening: Math.round(openingBal),
        emi: Math.round(emiVal),
        interest: Math.round(monthlyInterest),
        principal: Math.round(monthlyPrincipal),
        closing: Math.max(0, Math.round(remainingPrincipal))
      });
    }
  }

  // ─── FOIR / Eligibility Calculation ──────────────────────────────────────
  const incomeNum = Number(monthlyIncome) || 0;
  const currentEmiNum = Number(existingEmi) || 0;
  const newEmi = reducingEmi; // Default check against reducing rate
  const totalObligations = currentEmiNum + newEmi;
  const foir = incomeNum > 0 ? parseFloat(((totalObligations / incomeNum) * 100).toFixed(1)) : 0;

  let eligibilityStatus = 'none'; // 'low', 'medium', 'high', 'none'
  if (incomeNum > 0) {
    if (foir <= 50) eligibilityStatus = 'high';
    else if (foir <= 65) eligibilityStatus = 'medium';
    else eligibilityStatus = 'low';
  }

  // ─── Action Handlers ─────────────────────────────────────────────────────
  const handleAmountChange = (val) => {
    const num = Number(val);
    setLoanAmount(num > 100000000 ? 100000000 : num);
  };

  const handleRateChange = (val) => {
    const num = Number(val);
    setInterestRate(num > 50 ? 50 : num);
  };

  const handleTenureChange = (val) => {
    const num = Number(val);
    const maxTenure = tenureType === 'years' ? 30 : 360;
    setTenure(num > maxTenure ? maxTenure : num);
  };

  const toggleTenureType = (type) => {
    if (type === tenureType) return;
    setTenureType(type);
    if (type === 'years') {
      setTenure(Math.max(1, Math.round(tenure / 12)));
    } else {
      setTenure(Math.min(360, tenure * 12));
    }
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.origin + '/');
      url.searchParams.set('amount', loanAmount.toString());
      url.searchParams.set('rate', interestRate.toString());
      url.searchParams.set('tenure', tenure.toString());
      url.searchParams.set('tenureType', tenureType);
      if (monthlyIncome) url.searchParams.set('income', monthlyIncome);
      if (existingEmi) url.searchParams.set('existingEmi', existingEmi);
      url.hash = 'emi-calculator';

      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy share link:', e);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helveticaNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Page size configuration (A4)
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - 50;
      
      // Helpers
      const drawHeader = (pg) => {
        pg.drawText('Hand to Hand Loans - Loan Calculation & EMI Summary', {
          x: 40,
          y: pageHeight - 30,
          size: 8,
          font: helveticaNormal,
          color: rgb(0.5, 0.5, 0.5)
        });
        pg.drawLine({
          start: { x: 40, y: pageHeight - 34 },
          end: { x: pageWidth - 40, y: pageHeight - 34 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8)
        });
      };
      
      const checkPageBreak = (neededHeight) => {
        if (y - neededHeight < 40) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 75;
          drawHeader(page);
          return true;
        }
        return false;
      };
      
      // Draw Page 1 header
      drawHeader(page);
      
      // Draw Title on page 1
      page.drawText('LOAN CALCULATION & EMI REPORT', {
        x: 40,
        y: y,
        size: 16,
        font: helveticaBold,
        color: rgb(0.04, 0.47, 0.34)
      });
      y -= 20;
      
      // Draw Date
      const dateStr = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
      page.drawText(`Generated on: ${dateStr}`, {
        x: 40,
        y: y,
        size: 9,
        font: helveticaNormal,
        color: rgb(0.4, 0.4, 0.4)
      });
      y -= 25;
      
      // 1. Inputs Summary Section
      page.drawText('1. Input Parameter Summary', { x: 40, y: y, size: 11, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 15;
      
      const inputs = [
        { label: 'Loan Amount', val: `Rs. ${P.toLocaleString('en-IN')}` },
        { label: 'Interest Rate', val: `${R}% p.a.` },
        { label: 'Loan Tenure', val: `${tenure} ${tenureType}` },
      ];
      if (monthlyIncome) {
        inputs.push({ label: 'Monthly Income', val: `Rs. ${Number(monthlyIncome).toLocaleString('en-IN')}` });
      }
      if (existingEmi) {
        inputs.push({ label: 'Existing Monthly EMIs', val: `Rs. ${Number(existingEmi).toLocaleString('en-IN')}` });
      }
      
      inputs.forEach(item => {
        page.drawText(item.label, { x: 50, y: y, size: 9.5, font: helveticaNormal, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(item.val, { x: 220, y: y, size: 9.5, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 15;
      });
      
      y -= 10;
      
      // 2. Comparison Summary Table
      page.drawText('2. EMI Calculation Summary Comparison', { x: 40, y: y, size: 11, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 25;
      
      // Draw Table Header
      const colX = [40, 200, 380];
      page.drawRectangle({
        x: colX[0],
        y: y - 5,
        width: pageWidth - colX[0] - 40,
        height: 20,
        color: rgb(0.93, 0.98, 0.96)
      });
      page.drawText('Metric', { x: colX[0] + 10, y: y, size: 9.5, font: helveticaBold, color: rgb(0.04, 0.47, 0.34) });
      page.drawText('Reducing Balance Method', { x: colX[1] + 10, y: y, size: 9.5, font: helveticaBold, color: rgb(0.04, 0.47, 0.34) });
      page.drawText('Flat Rate Method', { x: colX[2] + 10, y: y, size: 9.5, font: helveticaBold, color: rgb(0.04, 0.47, 0.34) });
      y -= 25;
      
      const comparisonRows = [
        { label: 'Monthly EMI', red: `Rs. ${reducingEmi.toLocaleString('en-IN')}`, flat: `Rs. ${flatEmi.toLocaleString('en-IN')}` },
        { label: 'Total Interest Payable', red: `Rs. ${reducingTotalInterest.toLocaleString('en-IN')}`, flat: `Rs. ${flatTotalInterest.toLocaleString('en-IN')}` },
        { label: 'Total Payment (P + I)', red: `Rs. ${reducingTotalPayment.toLocaleString('en-IN')}`, flat: `Rs. ${flatTotalPayment.toLocaleString('en-IN')}` },
      ];
      
      if (monthlyIncome) {
        comparisonRows.push({
          label: 'Obligation FOIR %',
          red: `${foir}% (${eligibilityStatus.toUpperCase()})`,
          flat: 'N/A'
        });
      }
      
      comparisonRows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          page.drawRectangle({
            x: colX[0],
            y: y - 5,
            width: pageWidth - colX[0] - 40,
            height: 20,
            color: rgb(0.97, 0.97, 0.97)
          });
        }
        page.drawText(row.label, { x: colX[0] + 10, y: y, size: 9.5, font: helveticaNormal, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(row.red, { x: colX[1] + 10, y: y, size: 9.5, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(row.flat, { x: colX[2] + 10, y: y, size: 9.5, font: helveticaNormal, color: rgb(0.2, 0.2, 0.2) });
        y -= 20;
      });
      
      y -= 15;
      
      // 3. Detailed Amortization Monthly Breakup Schedule
      page.drawText('3. Monthly Amortization Breakup Schedule', { x: 40, y: y, size: 11, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 30;
      
      // Coordinates for 9 columns: Mth | Red EMI | Red Int | Red Prin | Red Bal | Flat EMI | Flat Int | Flat Prin | Flat Bal
      const schedX = [40, 65, 120, 175, 230, 290, 345, 400, 455];
      
      const drawTableHeader = (pg, currentY) => {
        pg.drawRectangle({
          x: schedX[0],
          y: currentY - 5,
          width: pageWidth - schedX[0] - 40,
          height: 25,
          color: rgb(0.04, 0.47, 0.34)
        });
        
        pg.drawText('Mth', { x: schedX[0] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Red. EMI', { x: schedX[1] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Red. Int', { x: schedX[2] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Red. Prin', { x: schedX[3] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Red. Bal', { x: schedX[4] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Flat EMI', { x: schedX[5] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Flat Int', { x: schedX[6] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Flat Prin', { x: schedX[7] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
        pg.drawText('Flat Bal', { x: schedX[8] + 2, y: currentY + 7, size: 7.5, font: helveticaBold, color: rgb(1, 1, 1) });
      };
      
      drawTableHeader(page, y);
      y -= 20;
      
      for (let i = 0; i < N; i++) {
        const redRow = reducingSchedule[i] || { emi: 0, interest: 0, principal: 0, closing: 0 };
        const flatRow = flatSchedule[i] || { emi: 0, interest: 0, principal: 0, closing: 0 };
        
        const didBreak = checkPageBreak(18);
        if (didBreak) {
          drawTableHeader(page, y);
          y -= 20;
        }
        
        if (i % 2 === 1) {
          page.drawRectangle({
            x: schedX[0],
            y: y - 3,
            width: pageWidth - schedX[0] - 40,
            height: 14,
            color: rgb(0.96, 0.98, 0.97)
          });
        }
        
        page.drawText(String(i + 1), { x: schedX[0] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.2, 0.2, 0.2) });
        page.drawText(redRow.emi.toLocaleString('en-IN'), { x: schedX[1] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(redRow.interest.toLocaleString('en-IN'), { x: schedX[2] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(redRow.principal.toLocaleString('en-IN'), { x: schedX[3] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(redRow.closing.toLocaleString('en-IN'), { x: schedX[4] + 2, y: y, size: 7, font: helveticaBold, color: rgb(0.04, 0.47, 0.34) });
        page.drawText(flatRow.emi.toLocaleString('en-IN'), { x: schedX[5] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(flatRow.interest.toLocaleString('en-IN'), { x: schedX[6] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(flatRow.principal.toLocaleString('en-IN'), { x: schedX[7] + 2, y: y, size: 7, font: helveticaNormal, color: rgb(0.3, 0.3, 0.3) });
        page.drawText(flatRow.closing.toLocaleString('en-IN'), { x: schedX[8] + 2, y: y, size: 7, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
        
        y -= 14;
      }
      
      // Draw footers with page numbers
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const pg = pages[i];
        pg.drawText(`Page ${i + 1} of ${pages.length}`, {
          x: pageWidth - 90,
          y: 20,
          size: 8,
          font: helveticaNormal,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HandToHand-EMI-Breakup-${Math.round(P)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate EMI PDF:', err);
      alert('Failed to generate EMI Breakup PDF: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="form-card" style={{
      padding: 'clamp(16px, 3vw, 32px)',
      background: 'var(--color-bg-glass-heavy)',
      backdropFilter: 'blur(20px)',
      border: 'var(--border-light)',
      borderRadius: 'var(--border-radius-xl)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <style jsx>{`
        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 24px;
        }
        .eligibility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 32px;
          padding: 24px 0;
          border-top: 1px dashed var(--border-default);
        }
        @media (max-width: 992px) {
          .inputs-grid, .eligibility-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          border-top: 1px solid var(--border-default);
          padding-top: 32px;
        }
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-title {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .slider-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .slider-input {
          background: var(--color-bg-secondary) !important;
          border: var(--border-light) !important;
          color: var(--color-text-primary) !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          font-size: var(--text-sm) !important;
          font-weight: 600 !important;
          width: 120px !important;
          text-align: right !important;
          outline: none !important;
        }
        .slider-input:focus {
          border-color: var(--color-primary) !important;
        }
        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-bg-secondary);
          outline: none;
          border: var(--border-subtle);
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-primary);
          border: none;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .donut-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .donut-chart {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--shadow-md);
        }
        .donut-center {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--color-bg-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: absolute;
          border: var(--border-subtle);
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          display: inline-block;
        }
        .result-card-inner {
          background: var(--color-bg-card);
          border-radius: 16px;
          padding: 24px;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .result-card-inner:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .result-card-reducing {
          border: 1px solid rgba(45, 212, 191, 0.2);
          box-shadow: 0 0 15px rgba(45, 212, 191, 0.03);
        }
        .result-card-reducing:hover {
          border-color: rgba(45, 212, 191, 0.4);
          box-shadow: var(--shadow-glow-indigo);
        }
        .result-card-flat {
          border: 1px solid rgba(251, 146, 60, 0.2);
          box-shadow: 0 0 15px rgba(251, 146, 60, 0.03);
        }
        .result-card-flat:hover {
          border-color: rgba(251, 146, 60, 0.4);
          box-shadow: var(--shadow-glow-purple);
        }
        .amortization-table-container {
          max-height: 380px;
          overflow-y: auto;
          border: var(--border-light);
          border-radius: 12px;
          background: var(--color-bg-card);
        }
        .amortization-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: var(--text-xs);
        }
        .amortization-table th {
          position: sticky;
          top: 0;
          background: var(--color-bg-secondary);
          padding: 12px 16px;
          font-weight: 700;
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--border-default);
          z-index: 10;
        }
        .amortization-table td {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          color: var(--color-text-primary);
        }
      `}</style>

      <div>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '6px' }}>
              Advanced EMI & Eligibility Calculator
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              Calculate EMIs, compare flat vs reducing methods, and check income obligations in real-time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              style={{
                padding: '8px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                color: '#10b981',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                cursor: generatingPdf ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                opacity: generatingPdf ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if (!generatingPdf) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
              onMouseLeave={(e) => { if (!generatingPdf) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
            >
              {generatingPdf ? 'Generating PDF...' : '📄 Generate PDF'}
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                padding: '8px 16px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
            >
              🔗 {copied ? 'Link Copied!' : 'Share Link'}
            </button>
          </div>
        </div>

        {/* ─── Top Section: Main Calculator Inputs ──────────────────────────── */}
        <div className="inputs-grid">
          {/* Principal Amount Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Loan Amount (₹)</span>
              <div className="slider-input-wrapper">
                <input
                  type="number"
                  min="10000"
                  max="100000000"
                  className="slider-input"
                  value={loanAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="20000000"
              step="10000"
              className="range-slider"
              value={loanAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹10,000</span>
              <span>₹2 Cr</span>
            </div>
          </div>

          {/* Interest Rate Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Interest Rate (% P.A.)</span>
              <div className="slider-input-wrapper">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.05"
                  className="slider-input"
                  value={interestRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                />
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              step="0.05"
              className="range-slider"
              value={interestRate}
              onChange={(e) => handleRateChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>1%</span>
              <span>36%</span>
            </div>
          </div>

          {/* Tenure Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Loan Tenure</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max={tenureType === 'years' ? 30 : 360}
                  className="slider-input"
                  value={tenure}
                  onChange={(e) => handleTenureChange(e.target.value)}
                  style={{ width: '65px' }}
                />
                <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', border: 'var(--border-light)', borderRadius: '6px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => toggleTenureType('years')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: tenureType === 'years' ? 'var(--gradient-primary)' : 'transparent',
                      color: tenureType === 'years' ? '#ffffff' : 'var(--color-text-secondary)'
                    }}
                  >
                    Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTenureType('months')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: tenureType === 'months' ? 'var(--gradient-primary)' : 'transparent',
                      color: tenureType === 'months' ? '#ffffff' : 'var(--color-text-secondary)'
                    }}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={tenureType === 'years' ? 30 : 120}
              step="1"
              className="range-slider"
              value={tenure}
              onChange={(e) => handleTenureChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>1 {tenureType === 'years' ? 'Year' : 'Month'}</span>
              <span>{tenureType === 'years' ? '30 Years' : '10 Years'}</span>
            </div>
          </div>
        </div>

        {/* ─── Middle Section: Optional Eligibility Checks ─────────────────── */}
        <div className="eligibility-grid">
          {/* Monthly Net Salary Input */}
          <div className="slider-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Monthly Income (Net) <span style={{ fontSize: '9px', opacity: 0.6 }}>(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                className="slider-input"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              className="range-slider"
              value={monthlyIncome || 0}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹0</span>
              <span>₹5 Lakhs</span>
            </div>
          </div>

          {/* Existing EMIs Input */}
          <div className="slider-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slider-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Existing Monthly EMIs <span style={{ fontSize: '9px', opacity: 0.6 }}>(Optional)</span>
              </span>
              <input
                type="number"
                placeholder="e.g. 10000"
                className="slider-input"
                value={existingEmi}
                onChange={(e) => setExistingEmi(e.target.value)}
              />
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="2000"
              className="range-slider"
              value={existingEmi || 0}
              onChange={(e) => setExistingEmi(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹0</span>
              <span>₹1.5 Lakhs</span>
            </div>
          </div>
        </div>

        {/* ─── Real-Time FOIR Eligibility Output Card ──────────────────────── */}
        {eligibilityStatus !== 'none' && (
          <div style={{
            marginBottom: '32px',
            borderRadius: '16px',
            padding: '20px',
            border: eligibilityStatus === 'high' 
              ? '1px solid rgba(16, 185, 129, 0.25)' 
              : eligibilityStatus === 'medium'
              ? '1px solid rgba(245, 158, 11, 0.25)'
              : '1px solid rgba(239, 68, 68, 0.25)',
            background: eligibilityStatus === 'high' 
              ? 'rgba(16, 185, 129, 0.05)' 
              : eligibilityStatus === 'medium'
              ? 'rgba(245, 158, 11, 0.05)'
              : 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <strong style={{
                fontSize: '13px',
                color: eligibilityStatus === 'high' ? 'var(--color-primary)' : eligibilityStatus === 'medium' ? 'var(--color-warning)' : 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {eligibilityStatus === 'high' && 'High Eligibility (Low Risk)'}
                {eligibilityStatus === 'medium' && 'Moderate Eligibility (Medium Risk)'}
                {eligibilityStatus === 'low' && 'Low Eligibility (High Debt Risk)'}
              </strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Your Income Obligations (FOIR): <strong>{foir}%</strong>
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {eligibilityStatus === 'high' && `Excellent! Your total EMIs (₹${totalObligations.toLocaleString('en-IN')}) consume only ${foir}% of your monthly income. Most lenders prefer a FOIR below 50%. You have a strong chance of approval.`}
              {eligibilityStatus === 'medium' && `Your total monthly EMIs consume ${foir}% of your income. While still eligible, lenders may inspect your file more carefully. Consider reducing the loan amount or increasing the tenure to drop the FOIR below 50% for premium interest rates.`}
              {eligibilityStatus === 'low' && `Attention: Your total EMIs consume ${foir}% of your monthly salary. Lenders rarely approve files with a FOIR above 65% as it indicates high debt-to-income stress. We suggest applying for a smaller loan amount or arranging a co-applicant to increase eligible income.`}
            </p>
          </div>
        )}

        {/* ─── Comparison Grid (Reducing vs Flat) ──────────────────────────── */}
        <div className="comparison-grid">
          {/* Reducing Balance Method Card */}
          <div className="result-card-inner result-card-reducing">
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              Reducing Balance Method
            </h4>
            
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid rgba(45, 212, 191, 0.15)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Loan EMI
              </div>
              <div style={{
                fontSize: 'var(--text-2xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                marginTop: '4px'
              }}>
                ₹{reducingEmi.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="donut-container">
              <div className="donut-chart" style={{
                background: `conic-gradient(var(--color-primary) 0% ${reducingPrincipalPercent}%, var(--color-accent) ${reducingPrincipalPercent}% 100%)`
              }}>
                <div className="donut-center">
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Payment</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    ₹{reducingTotalPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                  Principal Amount
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{loanAmount.toLocaleString('en-IN')} ({reducingPrincipalPercent}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                  Total Interest
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{reducingTotalInterest.toLocaleString('en-IN')} ({reducingInterestPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Flat Rate Method Card */}
          <div className="result-card-inner result-card-flat">
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              Flat / Fixed Rate Method
            </h4>
            
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid rgba(251, 146, 60, 0.15)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Loan EMI
              </div>
              <div style={{
                fontSize: 'var(--text-2xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: 'var(--color-accent)',
                marginTop: '4px'
              }}>
                ₹{flatEmi.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="donut-container">
              <div className="donut-chart" style={{
                background: `conic-gradient(var(--color-primary) 0% ${flatPrincipalPercent}%, var(--color-accent) ${flatPrincipalPercent}% 100%)`
              }}>
                <div className="donut-center">
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Payment</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    ₹{flatTotalPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                  Principal Amount
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{loanAmount.toLocaleString('en-IN')} ({flatPrincipalPercent}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                  Total Interest
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{flatTotalInterest.toLocaleString('en-IN')} ({flatInterestPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Action: Amortization Schedule ────────────────────────── */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          {/* Toggle repayment schedule button */}
          <button
            onClick={() => setShowAmortization(!showAmortization)}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {showAmortization ? 'Hide Repayment Schedule' : 'Show Month-by-Month Repayment Schedule'}
          </button>
        </div>

        {showAmortization && (
          <div style={{ marginTop: '24px', animation: 'pwa-slide-up 0.3s ease-out' }}>
            {/* Tab Selector for reducing vs flat schedule */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <button
                onClick={() => setAmortizationTab('reducing')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  background: amortizationTab === 'reducing' ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                  color: amortizationTab === 'reducing' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                Reducing Balance Schedule
              </button>
              <button
                onClick={() => setAmortizationTab('flat')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  background: amortizationTab === 'flat' ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
                  color: amortizationTab === 'flat' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
              >
                Flat Rate Schedule
              </button>
            </div>

            {/* Table Container */}
            <div className="amortization-table-container">
              <table className="amortization-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Month</th>
                    <th>Opening Bal</th>
                    <th>Payment (EMI)</th>
                    <th>Interest Paid</th>
                    <th>Principal Paid</th>
                    <th>Closing Bal</th>
                  </tr>
                </thead>
                <tbody>
                  {(amortizationTab === 'reducing' ? reducingSchedule : flatSchedule).map((row) => (
                    <tr key={row.month}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{row.month}</td>
                      <td>₹{row.opening.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{row.emi.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-error)' }}>₹{row.interest.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-success)' }}>₹{row.principal.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        ₹{row.closing.toLocaleString('en-IN')}
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
  );
}
