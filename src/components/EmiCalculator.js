'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function EmiCalculator({
  defaultAmount,
  defaultRate,
  defaultTenure,
  defaultTenureType
} = {}) {
  // State initialization via lazy initializers (fully safe for SSR + effect lint rules)
  const [loanAmount, setLoanAmount]       = useState(() => {
    if (defaultAmount !== undefined) return defaultAmount;
    return getInitialAmount();
  });
  const [interestRate, setInterestRate]   = useState(() => {
    if (defaultRate !== undefined) return defaultRate;
    return getInitialRate();
  });
  const [tenureType, setTenureType]       = useState(() => {
    if (defaultTenureType !== undefined) return defaultTenureType;
    return getInitialTenureType();
  });
  const [tenure, setTenure]               = useState(() => {
    if (defaultTenure !== undefined) return defaultTenure;
    return getInitialTenure();
  });
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
    <div className="calculator-container" style={{
      background: 'var(--color-bg-glass, rgba(15, 23, 42, 0.03))',
      border: 'var(--border-light, 1px solid rgba(255, 255, 255, 0.08))',
      borderRadius: '20px',
      padding: 'clamp(20px, 4vw, 36px)',
      boxShadow: 'var(--shadow-xl)',
      color: 'var(--color-text-primary, #ffffff)'
    }}>
      <style jsx>{`
        .calculator-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
        }
        @media (max-width: 992px) {
          .calculator-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .inputs-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .input-row-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .input-label {
          font-size: var(--text-sm, 14px);
          font-weight: 700;
          color: var(--color-text-primary, rgba(255, 255, 255, 0.9));
          font-family: 'Outfit', sans-serif;
        }
        .input-box-wrapper {
          display: flex;
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.2));
          border-radius: 8px;
          overflow: hidden;
          background: var(--color-bg-input, rgba(0, 0, 0, 0.25));
          height: 38px;
          align-items: center;
          transition: border-color 0.2s;
        }
        .input-box-wrapper:focus-within {
          border-color: var(--color-primary, #00d756);
        }
        .badge-prefix, .badge-suffix {
          background: var(--color-text-primary, #ffffff);
          color: var(--color-bg-secondary, #090d16);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 100%;
          font-weight: 800;
          font-size: 13px;
        }
        .dropdown-select {
          background: transparent;
          border: none;
          color: var(--color-text-primary, #ffffff);
          outline: none;
          padding: 0 8px;
          font-size: 12px;
          font-weight: 700;
          height: 100%;
          cursor: pointer;
          border-right: 1px solid var(--border-default, rgba(255, 255, 255, 0.15));
        }
        .dropdown-select option {
          background: var(--color-bg-secondary, #0f1422);
          color: var(--color-text-primary, #ffffff);
        }
        .raw-input {
          background: transparent;
          border: none;
          color: var(--color-text-primary, #ffffff);
          outline: none;
          padding: 0 12px;
          font-size: 14px;
          font-weight: 700;
          text-align: right;
          width: 120px;
          height: 100%;
        }
        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--border-default, rgba(255, 255, 255, 0.15));
          outline: none;
          cursor: pointer;
          margin-top: 4px;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-bg-secondary, #ffffff);
          border: 3px solid var(--color-primary, #00d756);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 215, 86, 0.6);
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }
        .limits-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
          margin-top: 2px;
        }
        .results-column {
          display: flex;
          flex-direction: column;
        }
        .tab-toggles {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--color-text-primary, #ffffff);
          color: var(--color-bg-secondary, #090d16);
          border: 1px solid var(--color-text-primary, #ffffff);
        }
        .tab-btn.inactive {
          background: transparent;
          color: var(--color-text-primary, #ffffff);
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.3));
        }
        .tab-btn.inactive:hover {
          background: var(--color-bg-card-hover, rgba(255, 255, 255, 0.05));
        }
        .results-white-card {
          background: var(--color-bg-secondary, #ffffff);
          border-radius: 16px;
          padding: 24px;
          color: var(--color-text-primary, #090d16);
          border: var(--border-light);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
          min-height: 380px;
        }
        .stat-label-small {
          font-size: 9px;
          font-weight: 800;
          color: var(--color-text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value-large {
          font-size: 22px;
          font-weight: 800;
          color: var(--color-text-primary, #090d16);
          margin-top: 4px;
        }
        .stat-label-tiny {
          font-size: 8px;
          font-weight: 800;
          color: var(--color-text-secondary, #64748b);
          text-transform: uppercase;
        }
        .stat-value-medium {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary, #090d16);
          margin-top: 4px;
        }
        .card-divider {
          border: none;
          border-top: 1px solid var(--border-default, #e2e8f0);
          margin: 0;
        }
        .donut-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin: 8px 0;
        }
        @media (max-width: 480px) {
          .donut-section {
            flex-direction: column;
            gap: 16px;
          }
        }
        .legend-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
          text-align: left;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .download-btn {
          width: 100%;
          padding: 12px 0;
          background: var(--color-text-primary, #090d16);
          color: var(--color-bg-secondary, #ffffff);
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: auto;
          transition: opacity 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .download-btn:hover {
          opacity: 0.9;
        }
        .schedule-table-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 250px;
        }
        .schedule-scroll {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--border-default, #e2e8f0);
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
          text-align: left;
        }
        .schedule-table th {
          background: var(--color-bg-secondary, #f8fafc);
          border-bottom: 1px solid var(--border-default, #e2e8f0);
          position: sticky;
          top: 0;
          padding: 8px 10px;
          font-weight: 700;
          color: var(--color-text-secondary, #475569);
        }
        .schedule-table td {
          padding: 6px 10px;
          border-bottom: 1px solid var(--border-default, #f1f5f9);
          color: var(--color-text-primary, #090d16);
        }
      `}</style>

      <div className="calculator-grid">
        {/* Left Column: Input Sliders */}
        <div className="inputs-column">
          {/* Loan Amount Input */}
          <div className="input-row-group">
            <div className="input-label-container">
              <span className="input-label">Loan Amount</span>
              <div className="input-box-wrapper">
                <div className="badge-prefix">₹</div>
                <input
                  type="text"
                  className="raw-input"
                  value={loanAmount.toLocaleString('en-IN')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/,/g, '');
                    if (!isNaN(clean) && clean !== '') handleAmountChange(Number(clean));
                    else if (clean === '') setLoanAmount('');
                  }}
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max={P > 20000000 ? 100000000 : 20000000}
              step="10000"
              className="range-slider"
              value={Number(loanAmount) || 0}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <div className="limits-row">
              <span>Min ₹10K</span>
              <span>Max {P > 20000000 ? '₹10 Cr' : '₹2 Cr'}</span>
            </div>
          </div>

          {/* Interest Rate Input */}
          <div className="input-row-group">
            <div className="input-label-container">
              <span className="input-label">Rate of Interest (p.a)</span>
              <div className="input-box-wrapper">
                <input
                  type="number"
                  step="0.05"
                  className="raw-input"
                  value={interestRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                />
                <div className="badge-suffix">%</div>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="0.05"
              className="range-slider"
              value={Number(interestRate) || 0}
              onChange={(e) => handleRateChange(e.target.value)}
            />
            <div className="limits-row">
              <span>Min 5%</span>
              <span>Max 25%</span>
            </div>
          </div>

          {/* Loan Tenure Input */}
          <div className="input-row-group">
            <div className="input-label-container">
              <span className="input-label">Loan Tenure</span>
              <div className="input-box-wrapper">
                <select
                  value={tenureType}
                  onChange={(e) => toggleTenureType(e.target.value)}
                  className="dropdown-select"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
                <input
                  type="number"
                  className="raw-input"
                  value={tenure}
                  onChange={(e) => handleTenureChange(e.target.value)}
                  style={{ width: '60px' }}
                />
              </div>
            </div>
            <input
              type="range"
              min={tenureType === 'years' ? 1 : 3}
              max={tenureType === 'years' ? 30 : 120}
              step="1"
              className="range-slider"
              value={Number(tenure) || 0}
              onChange={(e) => handleTenureChange(e.target.value)}
            />
            <div className="limits-row">
              <span>{tenureType === 'years' ? 'Min 1 Yr' : 'Min 3 Months'}</span>
              <span>{tenureType === 'years' ? 'Max 30 Yrs' : 'Max 120 Months'}</span>
            </div>
          </div>

          {/* Optional Eligibility Check Toggle */}
          <div style={{ borderTop: '1px solid var(--border-default, rgba(255, 255, 255, 0.08))', paddingTop: '20px', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary, #00d756)', letterSpacing: '0.5px', display: 'block', marginBottom: '16px', textTransform: 'uppercase' }}>
              Eligibility Check (Optional)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.7))', display: 'block', marginBottom: '6px' }}>Monthly Income (Net)</span>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  className="raw-input"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid var(--border-default, rgba(255,255,255,0.15))', borderRadius: '6px', padding: '0 12px', background: 'var(--color-bg-input, rgba(0,0,0,0.2))' }}
                />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.7))', display: 'block', marginBottom: '6px' }}>Existing Monthly EMIs</span>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  className="raw-input"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid var(--border-default, rgba(255,255,255,0.15))', borderRadius: '6px', padding: '0 12px', background: 'var(--color-bg-input, rgba(0,0,0,0.2))' }}
                />
              </div>
            </div>
          </div>

          {/* Real-time FOIR Eligibility Indicator */}
          {eligibilityStatus !== 'none' && (
            <div style={{
              borderRadius: '10px',
              padding: '12px 16px',
              border: eligibilityStatus === 'high' 
                ? '1px solid rgba(16, 185, 129, 0.2)' 
                : eligibilityStatus === 'medium'
                ? '1px solid rgba(245, 158, 11, 0.2)'
                : '1px solid rgba(239, 68, 68, 0.2)',
              background: eligibilityStatus === 'high' 
                ? 'rgba(16, 185, 129, 0.05)' 
                : eligibilityStatus === 'medium'
                ? 'rgba(245, 158, 11, 0.05)'
                : 'rgba(239, 68, 68, 0.05)',
              fontSize: '11px',
              textAlign: 'left'
            }}>
              <strong style={{ color: eligibilityStatus === 'high' ? '#10b981' : eligibilityStatus === 'medium' ? '#f59e0b' : '#ef4444' }}>
                {eligibilityStatus === 'high' && 'High Eligibility (Low Risk)'}
                {eligibilityStatus === 'medium' && 'Moderate Eligibility (Medium Risk)'}
                {eligibilityStatus === 'low' && 'Low Eligibility (High Debt Risk)'}
              </strong>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                Your debt-to-income ratio (FOIR) is <strong>{foir}%</strong>. 
                {eligibilityStatus === 'high' && ' Lenders typically prefer a FOIR under 50%. You have a strong chance of fast approval.'}
                {eligibilityStatus === 'medium' && ' Try increasing the tenure or lowering the amount to reduce FOIR below 50%.'}
                {eligibilityStatus === 'low' && ' High risk profile. Consider paying off existing liabilities first.'}
              </div>
            </div>
          )}

          {/* CTA Actions */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
            <Link href="/check" className="btn btn-primary" style={{
              fontWeight: 800,
              fontSize: '12px',
              textTransform: 'uppercase',
              borderRadius: '8px',
              padding: '12px 28px',
              textAlign: 'center'
            }}>
              Apply Now
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: 'transparent',
                color: 'var(--color-text-primary, #ffffff)',
                border: '1px solid var(--border-default, rgba(255, 255, 255, 0.3))',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-bg-card-hover, rgba(255, 255, 255, 0.05))'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              🔗 {copied ? 'Link Copied!' : 'Share Link'}
            </button>
          </div>
        </div>

        {/* Right Column: Tabbed Output display */}
        <div className="results-column">
          <div className="tab-toggles">
            <button
              type="button"
              className={`tab-btn ${!showAmortization ? 'active' : 'inactive'}`}
              onClick={() => setShowAmortization(false)}
            >
              Visual Breakdown
            </button>
            <button
              type="button"
              className={`tab-btn ${showAmortization ? 'active' : 'inactive'}`}
              onClick={() => setShowAmortization(true)}
            >
              EMI Schedule
            </button>
          </div>

          {/* Results Display White Card */}
          <div className="results-white-card">
            {!showAmortization ? (
              <>
                {/* Block 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'center' }}>
                  <div style={{ borderRight: '1px solid var(--border-default, #e2e8f0)', paddingRight: '8px' }}>
                    <span className="stat-label-small">YOUR MONTHLY EMI</span>
                    <div className="stat-value-large">
                      ₹{reducingEmi.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="stat-label-small">TOTAL AMOUNT PAYABLE</span>
                    <div className="stat-value-large">
                      ₹{reducingTotalPayment.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <hr className="card-divider" />

                {/* Block 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <span className="stat-label-tiny">LOAN AMOUNT</span>
                    <div className="stat-value-medium">
                      ₹{Number(loanAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-default, #e2e8f0)', borderRight: '1px solid var(--border-default, #e2e8f0)' }}>
                    <span className="stat-label-tiny">TOTAL INTEREST</span>
                    <div className="stat-value-medium">
                      ₹{reducingTotalInterest.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span className="stat-label-tiny">TENURE</span>
                    <div className="stat-value-medium">
                      {tenure} {tenureType === 'years' ? 'Yr' : 'Mo'}
                    </div>
                  </div>
                </div>

                <hr className="card-divider" />

                {/* Block 3 */}
                <div className="donut-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', gap: '12px' }}>
                    {/* Donut 1: Reducing */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-text-secondary, #64748b)', textTransform: 'uppercase' }}>Reducing Method</span>
                      <svg width="85" height="85" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-bg-tertiary, #f1f5f9)" strokeWidth="4.2" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--border-default, #e2e8f0)"
                          strokeWidth="4.2"
                          strokeDasharray={`${reducingPrincipalPercent} ${100 - reducingPrincipalPercent}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--color-primary, #00d756)"
                          strokeWidth="4.2"
                          strokeDasharray={`${reducingInterestPercent} ${100 - reducingInterestPercent}`}
                          strokeDashoffset={`${100 - reducingPrincipalPercent}`}
                        />
                      </svg>
                      <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {reducingPrincipalPercent}% P / {reducingInterestPercent}% I
                      </span>
                    </div>

                    {/* Donut 2: Flat Rate */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-text-secondary, #64748b)', textTransform: 'uppercase' }}>Flat Rate Method</span>
                      <svg width="85" height="85" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-bg-tertiary, #f1f5f9)" strokeWidth="4.2" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--border-default, #e2e8f0)"
                          strokeWidth="4.2"
                          strokeDasharray={`${flatPrincipalPercent} ${100 - flatPrincipalPercent}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--color-primary, #00d756)"
                          strokeWidth="4.2"
                          strokeDasharray={`${flatInterestPercent} ${100 - flatInterestPercent}`}
                          strokeDashoffset={`${100 - flatPrincipalPercent}`}
                        />
                      </svg>
                      <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {flatPrincipalPercent}% P / {flatInterestPercent}% I
                      </span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="legend-list" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '16px', fontSize: '10px' }}>
                    <div className="legend-item">
                      <span className="legend-bullet" style={{ background: 'var(--border-default, #e2e8f0)' }}></span>
                      <span style={{ color: 'var(--color-text-secondary, #475569)', fontWeight: 600 }}>Principal (P)</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-bullet" style={{ background: 'var(--color-primary, #00d756)' }}></span>
                      <span style={{ color: 'var(--color-text-secondary, #475569)', fontWeight: 600 }}>Interest (I)</span>
                    </div>
                  </div>
                </div>

                <hr className="card-divider" />

                {/* Method Comparison Table */}
                <div style={{ textAlign: 'left', fontSize: '10px' }}>
                  <span className="stat-label-tiny" style={{ display: 'block', marginBottom: '8px', fontSize: '9px', fontWeight: 800 }}>Flat vs Reducing Comparison</span>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-default, #e2e8f0)', color: 'var(--color-text-secondary, #64748b)' }}>
                          <th style={{ padding: '6px 4px', fontWeight: 700 }}>Method</th>
                          <th style={{ padding: '6px 4px', fontWeight: 700 }}>Monthly EMI</th>
                          <th style={{ padding: '6px 4px', fontWeight: 700 }}>Total Interest</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-default, #f1f5f9)' }}>
                          <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>Reducing Balance</td>
                          <td style={{ padding: '6px 4px' }}>₹{reducingEmi.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '6px 4px' }}>₹{reducingTotalInterest.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-default, #f1f5f9)' }}>
                          <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>Flat Rate</td>
                          <td style={{ padding: '6px 4px' }}>₹{flatEmi.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '6px 4px' }}>₹{flatTotalInterest.toLocaleString('en-IN')}</td>
                        </tr>
                        {flatTotalInterest - reducingTotalInterest > 0 && (
                          <tr>
                            <td colSpan="3" style={{ padding: '8px 4px 0 4px', color: '#16a34a', fontWeight: 'bold', fontSize: '9px' }}>
                              💡 Reducing method saves you ₹{(flatTotalInterest - reducingTotalInterest).toLocaleString('en-IN')} in total interest!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Download PDF Button */}
                <button
                  type="button"
                  className="download-btn"
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf}
                >
                  {generatingPdf ? 'GENERATING...' : <>DOWNLOAD <span style={{ fontSize: '12px' }}>📥</span></>}
                </button>
              </>
            ) : (
              <div className="schedule-table-wrapper">
                {/* Repayment Schedule Tab Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setAmortizationTab('reducing')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: amortizationTab === 'reducing' ? 'var(--color-text-primary, #090d16)' : 'transparent',
                      color: amortizationTab === 'reducing' ? 'var(--color-bg-secondary, #ffffff)' : 'var(--color-text-secondary, #64748b)',
                      border: '1px solid var(--border-default, #cbd5e1)'
                    }}
                  >
                    Reducing Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmortizationTab('flat')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: amortizationTab === 'flat' ? 'var(--color-text-primary, #090d16)' : 'transparent',
                      color: amortizationTab === 'flat' ? 'var(--color-bg-secondary, #ffffff)' : 'var(--color-text-secondary, #64748b)',
                      border: '1px solid var(--border-default, #cbd5e1)'
                    }}
                  >
                    Flat Rate Schedule
                  </button>
                </div>

                <div className="schedule-scroll">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>EMI</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Closing Bal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(amortizationTab === 'reducing' ? reducingSchedule : flatSchedule).map((row) => (
                        <tr key={row.month}>
                          <td style={{ fontWeight: 'bold' }}>{row.month}</td>
                          <td>₹{row.emi.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{row.principal.toLocaleString('en-IN')}</td>
                          <td style={{ color: '#dc2626' }}>₹{row.interest.toLocaleString('en-IN')}</td>
                          <td>₹{row.closing.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Download PDF Button */}
                <button
                  type="button"
                  className="download-btn"
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf}
                >
                  {generatingPdf ? 'GENERATING...' : <>DOWNLOAD <span style={{ fontSize: '12px' }}>📥</span></>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
