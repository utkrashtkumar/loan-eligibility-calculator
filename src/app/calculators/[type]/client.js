'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// APY Contribution lookup table helper
const getApyContribution = (age, pension) => {
  const contributions = {
    18: { 1000: 42, 2000: 84, 3000: 126, 4000: 168, 5000: 210 },
    19: { 1000: 46, 2000: 92, 3000: 138, 4000: 183, 5000: 228 },
    20: { 1000: 50, 2000: 100, 3000: 150, 4000: 198, 5000: 248 },
    21: { 1000: 54, 2000: 108, 3000: 162, 4000: 215, 5000: 269 },
    22: { 1000: 59, 2000: 117, 3000: 177, 4000: 234, 5000: 292 },
    23: { 1000: 64, 2000: 127, 3000: 192, 4000: 254, 5000: 318 },
    24: { 1000: 70, 2000: 139, 3000: 208, 4000: 277, 5000: 346 },
    25: { 1000: 76, 2000: 151, 3000: 226, 4000: 302, 5000: 376 },
    26: { 1000: 82, 2000: 164, 3000: 246, 4000: 327, 5000: 409 },
    27: { 1000: 90, 2000: 178, 3000: 268, 4000: 356, 5000: 446 },
    28: { 1000: 97, 2000: 194, 3000: 292, 4000: 389, 5000: 485 },
    29: { 1000: 106, 2000: 212, 3000: 318, 4000: 423, 5000: 529 },
    30: { 1000: 116, 2000: 231, 3000: 347, 4000: 462, 5000: 577 },
    31: { 1000: 126, 2000: 252, 3000: 379, 4000: 504, 5000: 630 },
    32: { 1000: 138, 2000: 276, 3000: 414, 4000: 551, 5000: 689 },
    33: { 1000: 151, 2000: 302, 3000: 453, 4000: 602, 5000: 752 },
    34: { 1000: 165, 2000: 330, 3000: 495, 4000: 659, 5000: 824 },
    35: { 1000: 181, 2000: 362, 3000: 543, 4000: 724, 5000: 902 },
    36: { 1000: 198, 2000: 396, 3000: 594, 4000: 792, 5000: 990 },
    37: { 1000: 218, 2000: 436, 3000: 654, 4000: 870, 5000: 1087 },
    38: { 1000: 240, 2000: 480, 3000: 720, 4000: 957, 5000: 1196 },
    39: { 1000: 264, 2000: 528, 3000: 792, 4000: 1054, 5000: 1318 },
    40: { 1000: 291, 2000: 582, 3000: 873, 4000: 1164, 5000: 1454 }
  };
  const safeAge = Math.min(40, Math.max(18, Math.round(age)));
  const safePension = pension in [1000, 2000, 3000, 4000, 5000] ? pension : 5000;
  return contributions[safeAge]?.[safePension] || (safePension * 0.075 + (safeAge - 18) * 15);
};

// Config template for all 23 calculators
const CALCS_CONFIG = {
  'loan-eligibility': {
    name: 'Loan Eligibility Calculator',
    icon: '💰',
    description: 'Check your loan eligibility instantly based on your income and existing obligations.',
    inputs: [
      { id: 'salary', label: 'Net Monthly Income', min: 10000, max: 1000000, step: 2000, default: 75000, prefix: '₹' },
      { id: 'existing', label: 'Existing Monthly EMIs', min: 0, max: 500000, step: 1000, default: 10000, prefix: '₹' },
      { id: 'rate', label: 'Interest Rate (p.a.)', min: 5, max: 25, step: 0.1, default: 9.5, suffix: '%' },
      { id: 'tenure', label: 'Tenure', min: 1, max: 30, step: 1, default: 20, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { salary, existing, rate, tenure } = vals;
      const foirEmi = (salary * 0.5) - existing;
      const r = rate / 12 / 100;
      const n = tenure * 12;
      let maxLoan = 0;
      if (foirEmi > 0 && r > 0) {
        maxLoan = Math.round(foirEmi * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))));
      }
      const totalObligations = existing + (foirEmi > 0 ? foirEmi : 0);
      const principalPct = Math.round((maxLoan / (maxLoan + (foirEmi > 0 ? foirEmi * n : 0)) || 1) * 100);
      return {
        results: [
          { label: 'Eligible Monthly EMI Limit', value: `₹${Math.max(0, Math.round(foirEmi)).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Estimated Max Loan Amount', value: `₹${maxLoan.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'FOIR Ratio', value: `${salary > 0 ? ((totalObligations / salary) * 100).toFixed(1) : 0}%` },
          { label: 'Loan Tenure Preferred', value: `${tenure} Years` }
        ],
        donut: { val1: principalPct, label1: 'Principal', val2: 100 - principalPct, label2: 'Interest Component' },
        guide: {
          title: 'How Loan Eligibility is Calculated',
          text: 'Lenders follow the Fixed Obligation to Income Ratio (FOIR) rule. Usually, your total monthly debt obligations (including the new loan EMI) should not exceed 50% of your net monthly income. Our calculator estimates the max loan you qualify for using reducing balance loan amortization based on this margin.'
        }
      };
    }
  },
  'fd': {
    name: 'Fixed Deposit (FD) Calculator',
    icon: '📈',
    description: 'Calculate maturity value and interest returns on Fixed Deposits (FD) compounded periodically.',
    inputs: [
      { id: 'amount', label: 'Investment Amount', min: 5000, max: 10000000, step: 5000, default: 100000, prefix: '₹' },
      { id: 'rate', label: 'Rate of Interest', min: 2, max: 15, step: 0.1, default: 7.1, suffix: '%' },
      { id: 'tenure', label: 'Time Period', min: 1, max: 25, step: 1, default: 5, suffix: 'Yrs' },
      {
        id: 'frequency',
        label: 'Compounding Frequency',
        type: 'select',
        default: 4,
        options: [
          { value: 12, label: 'Monthly' },
          { value: 4, label: 'Quarterly' },
          { value: 2, label: 'Half-Yearly' },
          { value: 1, label: 'Yearly' }
        ]
      }
    ],
    calculate: (vals) => {
      const { amount, rate, tenure, frequency } = vals;
      const r = rate / 100;
      const f = Number(frequency);
      const maturity = Math.round(amount * Math.pow(1 + r / f, f * tenure));
      const interest = maturity - amount;
      const pct = Math.round((amount / maturity) * 100);
      return {
        results: [
          { label: 'Invested Amount', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Estimated Interest Earned', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Value', value: `₹${maturity.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Invested Amount', val2: 100 - pct, label2: 'Interest Component' },
        guide: {
          title: 'Fixed Deposit Compounding Explained',
          text: 'FD interest in India is usually compounded quarterly. The maturity formula is A = P(1 + r/n)^(nt) where P is Principal, r is rate of interest, n is compounding frequency per year, and t is tenure in years.'
        }
      };
    }
  },
  'rd': {
    name: 'Recurring Deposit (RD) Calculator',
    icon: '💳',
    description: 'Calculate recurring deposit maturity amount and total interest yield.',
    inputs: [
      { id: 'monthly', label: 'Monthly Deposit', min: 500, max: 500000, step: 500, default: 10000, prefix: '₹' },
      { id: 'rate', label: 'Rate of Interest', min: 2, max: 15, step: 0.1, default: 6.8, suffix: '%' },
      { id: 'tenure', label: 'Tenure', min: 1, max: 10, step: 1, default: 5, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { monthly, rate, tenure } = vals;
      const n = tenure * 12;
      const r = rate / 100;
      let maturity = 0;
      // RD compounding quarterly (standard for Indian banks)
      for (let i = 1; i <= n; i++) {
        maturity += monthly * Math.pow(1 + r / 4, 4 * (n - i + 1) / 12);
      }
      const maturityVal = Math.round(maturity);
      const invested = monthly * n;
      const interest = maturityVal - invested;
      const pct = Math.round((invested / maturityVal) * 100);
      return {
        results: [
          { label: 'Total Invested Amount', value: `₹${invested.toLocaleString('en-IN')}` },
          { label: 'Estimated Interest', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Value', value: `₹${maturityVal.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Total Invested', val2: 100 - pct, label2: 'Interest Earned' },
        guide: {
          title: 'How Recurring Deposit Interest Accumulates',
          text: 'Every monthly installment compounds separately until the end of the maturity tenure. In Indian commercial banks, compounding frequency is set to quarterly, adding interest yield to principal balances every 3 months.'
        }
      };
    }
  },
  'sip': {
    name: 'SIP Calculator',
    icon: '💹',
    description: 'Project returns on Systematic Investment Plans (SIP) in mutual funds over time.',
    inputs: [
      { id: 'monthly', label: 'Monthly Investment', min: 500, max: 200000, step: 500, default: 5000, prefix: '₹' },
      { id: 'rate', label: 'Expected Return (p.a.)', min: 1, max: 30, step: 0.5, default: 12, suffix: '%' },
      { id: 'tenure', label: 'Time Period', min: 1, max: 40, step: 1, default: 10, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { monthly, rate, tenure } = vals;
      const n = tenure * 12;
      const i = rate / 12 / 100;
      const totalValue = Math.round(monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
      const invested = monthly * n;
      const returns = totalValue - invested;
      const pct = Math.round((invested / totalValue) * 100);
      return {
        results: [
          { label: 'Total Invested Amount', value: `₹${invested.toLocaleString('en-IN')}` },
          { label: 'Estimated Capital Returns', value: `₹${returns.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Future Portfolio Value', value: `₹${totalValue.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Invested Capital', val2: 100 - pct, label2: 'Capital Gains' },
        guide: {
          title: 'The Power of SIP & Compounding',
          text: 'A Systematic Investment Plan allows you to purchase units of mutual funds periodically. Through rupee-cost averaging and regular compounding monthly, even small amounts can build large portfolios over 10 to 20 years.'
        }
      };
    }
  },
  'mutual-fund': {
    name: 'Mutual Fund Calculator',
    icon: '📊',
    description: 'Project future returns on lump sum mutual fund investments.',
    inputs: [
      { id: 'amount', label: 'Total Investment (Lump Sum)', min: 1000, max: 10000000, step: 1000, default: 100000, prefix: '₹' },
      { id: 'rate', label: 'Expected Return (p.a.)', min: 1, max: 30, step: 0.5, default: 12, suffix: '%' },
      { id: 'tenure', label: 'Time Period', min: 1, max: 40, step: 1, default: 10, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { amount, rate, tenure } = vals;
      const totalValue = Math.round(amount * Math.pow(1 + rate / 100, tenure));
      const returns = totalValue - amount;
      const pct = Math.round((amount / totalValue) * 100);
      return {
        results: [
          { label: 'Principal Invested', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Capital Gains (Est.)', value: `₹${returns.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Portfolio Value', value: `₹${totalValue.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Principal', val2: 100 - pct, label2: 'Wealth Gains' },
        guide: {
          title: 'Lump Sum Investment Calculations',
          text: 'Lump sum calculator works on standard annual compounding. If you invest P amount at interest rate r% compounded annually for t years, the total portfolio value A is calculated as A = P * (1 + r/100)^t.'
        }
      };
    }
  },
  'ppf': {
    name: 'PPF Calculator',
    icon: '💼',
    description: 'Calculate Public Provident Fund (PPF) returns based on tax-saving contributions.',
    inputs: [
      { id: 'annual', label: 'Yearly Contribution', min: 500, max: 150000, step: 500, default: 150000, prefix: '₹' },
      { id: 'tenure', label: 'Tenure (Yrs)', min: 15, max: 50, step: 5, default: 15, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { annual, tenure } = vals;
      const r = 0.071; // Fixed 7.1%
      const totalValue = Math.round(annual * ((Math.pow(1 + r, tenure) - 1) / r) * (1 + r));
      const invested = annual * tenure;
      const interest = totalValue - invested;
      const pct = Math.round((invested / totalValue) * 100);
      return {
        results: [
          { label: 'Total Contributions', value: `₹${invested.toLocaleString('en-IN')}` },
          { label: 'Interest Accumulated (Est.)', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Amount (Tax Free)', value: `₹${totalValue.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Principal Invested', val2: 100 - pct, label2: 'Tax-Free Interest' },
        guide: {
          title: 'PPF Rules & Tax Benefits',
          text: 'The Public Provident Fund (PPF) is a popular tax-saving option in India offering EEE status (exempt from tax on contribution, interest, and maturity). It has a minimum lock-in of 15 years, and interest rates are announced quarterly by the government.'
        }
      };
    }
  },
  'nsc': {
    name: 'NSC Calculator',
    icon: '🏅',
    description: 'Calculate returns under the National Savings Certificate (NSC) scheme.',
    inputs: [
      { id: 'amount', label: 'Investment Amount', min: 1000, max: 5000000, step: 1000, default: 100000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { amount } = vals;
      const rate = 7.7; // Fixed 7.7%
      const maturity = Math.round(amount * Math.pow(1 + rate / 100, 5));
      const interest = maturity - amount;
      const pct = Math.round((amount / maturity) * 100);
      return {
        results: [
          { label: 'Invested Amount', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Maturity Interest Yield', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Value (after 5 Years)', value: `₹${maturity.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Invested Capital', val2: 100 - pct, label2: 'Interest Yield' },
        guide: {
          title: 'NSC Scheme Guidelines',
          text: 'National Savings Certificate (NSC) is a government-backed low-risk post office savings scheme with a fixed tenure of 5 years. Contributions qualify for Section 80C tax deduction benefits.'
        }
      };
    }
  },
  'kvp': {
    name: 'KVP Calculator',
    icon: '🌾',
    description: 'Calculate Kisan Vikas Patra (KVP) double-money maturity value and tenure.',
    inputs: [
      { id: 'amount', label: 'Investment Amount', min: 1000, max: 10000000, step: 1000, default: 100000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { amount } = vals;
      const maturityVal = amount * 2;
      return {
        results: [
          { label: 'Invested Amount', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Est. Return Earnings', value: `₹${amount.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Value', value: `₹${maturityVal.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Lock-in Period to Double', value: '115 Months (9 Yrs 7 Mo)' }
        ],
        donut: { val1: 50, label1: 'Principal', val2: 50, label2: 'Doubling Interest' },
        guide: {
          title: 'Kisan Vikas Patra (KVP) Mechanics',
          text: 'KVP is an investment certificate scheme from post offices that guarantees to double your initial capital. The maturity rate is currently set at 7.5% compounded annually, meaning money doubles in exactly 115 months.'
        }
      };
    }
  },
  'ssy': {
    name: 'Sukanya Samriddhi Yojana (SSY) Calculator',
    icon: '👶',
    description: 'Project maturity funds under Sukanya Samriddhi Yojana (SSY) for a girl child.',
    inputs: [
      { id: 'annual', label: 'Annual Contribution', min: 250, max: 150000, step: 500, default: 100000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { annual } = vals;
      const r = 0.082; // 8.2% p.a.
      let bal = 0;
      // SSY: contributions for 15 years, compounding continues until 21 years
      for (let y = 1; y <= 21; y++) {
        if (y <= 15) {
          bal += annual;
        }
        bal = bal * (1 + r);
      }
      const maturity = Math.round(bal);
      const invested = annual * 15;
      const interest = maturity - invested;
      const pct = Math.round((invested / maturity) * 100);
      return {
        results: [
          { label: 'Total Principal Invested', value: `₹${invested.toLocaleString('en-IN')}` },
          { label: 'Estimated Interest Yield', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Value (Tax Free)', value: `₹${maturity.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Total Contributions', val2: 100 - pct, label2: 'Tax-Free Interest' },
        guide: {
          title: 'Sukanya Samriddhi Yojana (SSY) Benefits',
          text: 'SSY is a government savings program aimed at parents of girl children. Accounts can be opened for girls under 10 years. Contributions, interest, and withdrawals are tax-exempt (EEE status). The account matures after 21 years.'
        }
      };
    }
  },
  'apy': {
    name: 'APY Calculator',
    icon: '👴',
    description: 'Find required monthly premiums under the government Atal Pension Yojana (APY).',
    inputs: [
      { id: 'age', label: 'Entry Age of Subscriber', min: 18, max: 40, step: 1, default: 25 },
      {
        id: 'pension',
        label: 'Desired Monthly Pension',
        type: 'select',
        default: 5000,
        options: [
          { value: 1000, label: '₹1,000 / month' },
          { value: 2000, label: '₹2,000 / month' },
          { value: 3000, label: '₹3,000 / month' },
          { value: 4000, label: '₹4,000 / month' },
          { value: 5000, label: '₹5,000 / month' }
        ]
      }
    ],
    calculate: (vals) => {
      const { age, pension } = vals;
      const monthlyContribution = getApyContribution(age, pension);
      const yearsToContribute = 60 - age;
      const totalInvested = monthlyContribution * 12 * yearsToContribute;
      const pct = 40; // Indicative
      return {
        results: [
          { label: 'Required Monthly Premium', value: `₹${monthlyContribution.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Contributions Till Age 60', value: `₹${totalInvested.toLocaleString('en-IN')}` },
          { label: 'Guaranteed Pension (at age 60)', value: `₹${pension.toLocaleString('en-IN')} / Mo`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Your Share', val2: 100 - pct, label2: 'Estimated Govt Yield' },
        guide: {
          title: 'Atal Pension Yojana (APY) Highlights',
          text: 'APY is a government pension scheme for workers in the unorganized sector. Subscribers receive a guaranteed monthly pension of ₹1000 to ₹5000 starting from the age of 60, based on their monthly contributions.'
        }
      };
    }
  },
  'epf': {
    name: 'EPF Calculator',
    icon: '👔',
    description: 'Calculate employee retirement balances under Employee Provident Fund (EPF).',
    inputs: [
      { id: 'salary', label: 'Basic Salary + DA (Monthly)', min: 5000, max: 500000, step: 1000, default: 50000, prefix: '₹' },
      { id: 'age', label: 'Current Age', min: 18, max: 55, step: 1, default: 25 }
    ],
    calculate: (vals) => {
      const { salary, age } = vals;
      const years = 58 - age;
      const rate = 0.0825; // 8.25% p.a.
      const monthlyEmp = salary * 0.12;
      const monthlyComp = salary * 0.0367;
      const totalMonthly = monthlyEmp + monthlyComp;
      let bal = 0;
      // EPF Compounding loop
      for (let y = 1; y <= years; y++) {
        const yearlyDeposit = totalMonthly * 12;
        bal = (bal + yearlyDeposit) * (1 + rate);
      }
      const totalVal = Math.round(bal);
      const invested = Math.round(totalMonthly * 12 * years);
      const interest = totalVal - invested;
      const pct = Math.round((invested / totalVal) * 100);
      return {
        results: [
          { label: 'Combined Monthly Contribution', value: `₹${Math.round(totalMonthly).toLocaleString('en-IN')}` },
          { label: 'Total Cumulative Deposits', value: `₹${invested.toLocaleString('en-IN')}` },
          { label: 'Interest Accumulated (Est.)', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'EPF Retirement Corpus (at 58)', value: `₹${totalVal.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Deposits', val2: 100 - pct, label2: 'Interest Earned' },
        guide: {
          title: 'How EPF Calculations Function',
          text: 'Under EPF, the employee contributes 12% of basic salary + DA, and the employer contributes an equal percentage (3.67% goes to EPF, 8.33% goes to EPS pension). Interest rate is set annually by EPFO.'
        }
      };
    }
  },
  'scss': {
    name: 'SCSS Calculator',
    icon: '👵',
    description: 'Calculate income payouts under the Senior Citizen Savings Scheme (SCSS).',
    inputs: [
      { id: 'amount', label: 'Investment Principal', min: 10000, max: 3000000, step: 10000, default: 1000000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { amount } = vals;
      const rate = 8.2;
      const quarterlyInterest = (amount * (rate / 100)) / 4;
      const totalInterest = quarterlyInterest * 4 * 5;
      const totalMaturity = amount + totalInterest;
      const pct = Math.round((amount / totalMaturity) * 100);
      return {
        results: [
          { label: 'Investment Principal', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Quarterly Interest Payout', value: `₹${Math.round(quarterlyInterest).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Interest Earned (5 Yrs)', value: `₹${Math.round(totalInterest).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Value on Maturity', value: `₹${Math.round(amount).toLocaleString('en-IN')} + Payouts` }
        ],
        donut: { val1: pct, label1: 'Principal', val2: 100 - pct, label2: 'Total Payouts' },
        guide: {
          title: 'Senior Citizen Savings Scheme (SCSS) Rules',
          text: 'SCSS is a tax-saving retirement product for individuals aged 60 and above. It has a lock-in of 5 years, pays out interest quarterly, and investments are eligible for Section 80C tax write-offs.'
        }
      };
    }
  },
  'mahila-samman': {
    name: 'Mahila Samman Calculator',
    icon: '👩',
    description: 'Calculate savings returns under the Mahila Samman Savings Certificate (MSSC).',
    inputs: [
      { id: 'amount', label: 'Investment Principal', min: 10000, max: 200000, step: 5000, default: 200000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { amount } = vals;
      const rate = 7.5;
      // Quarterly compounded for 2 years
      const maturity = Math.round(amount * Math.pow(1 + rate / 400, 8));
      const interest = maturity - amount;
      const pct = Math.round((amount / maturity) * 100);
      return {
        results: [
          { label: 'Investment Principal', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Interest Earnings', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Maturity Amount (after 2 Yrs)', value: `₹${maturity.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Principal', val2: 100 - pct, label2: 'Interest Component' },
        guide: {
          title: 'Mahila Samman Scheme Highlights',
          text: 'Mahila Samman Savings Certificate is a government scheme launched for women. It has a tenure of 2 years, pays an interest of 7.5% compounded quarterly, and allows partial withdrawal facilities.'
        }
      };
    }
  },
  'post-office-mis': {
    name: 'Post Office MIS Calculator',
    icon: '🏢',
    description: 'Calculate guaranteed monthly income from the Post Office Monthly Income Scheme.',
    inputs: [
      { id: 'amount', label: 'Investment Principal', min: 10000, max: 900000, step: 5000, default: 450000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { amount } = vals;
      const rate = 7.4;
      const monthlyPayout = (amount * (rate / 100)) / 12;
      const totalInterest = monthlyPayout * 60;
      const totalYield = amount + totalInterest;
      const pct = Math.round((amount / totalYield) * 100);
      return {
        results: [
          { label: 'Invested Principal', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Guaranteed Monthly Income', value: `₹${Math.round(monthlyPayout).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Interest Received (5 Yrs)', value: `₹${Math.round(totalInterest).toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Principal', val2: 100 - pct, label2: 'Total Payouts' },
        guide: {
          title: 'Post Office MIS Mechanics',
          text: 'POMIS offers individuals a guaranteed monthly income. Single accounts have a deposit cap of ₹9 Lakhs, while joint accounts allow deposits up to ₹15 Lakhs. Lock-in is 5 years.'
        }
      };
    }
  },
  'income-tax': {
    name: 'Income Tax Calculator',
    icon: '📋',
    description: 'Compare tax obligation under the Old and New Tax regimes (FY 2024-25).',
    inputs: [
      { id: 'income', label: 'Annual Gross Salary', min: 200000, max: 10000000, step: 10000, default: 1200000, prefix: '₹' },
      { id: 'deductions', label: 'Exemptions & Deductions (Old Regime)', min: 0, max: 500000, step: 5000, default: 150000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { income, deductions } = vals;
      
      // 1. New Regime
      const newStandard = 75000;
      const newTaxable = Math.max(0, income - newStandard);
      let newTax = 0;
      if (newTaxable > 700000) { // Tax Rebate up to 7L taxable income under New Regime
        let temp = newTaxable;
        if (temp > 1500000) { newTax += (temp - 1500000) * 0.3; temp = 1500000; }
        if (temp > 1200000) { newTax += (temp - 1200000) * 0.2; temp = 1200000; }
        if (temp > 900000) { newTax += (temp - 900000) * 0.15; temp = 900000; }
        if (temp > 600000) { newTax += (temp - 600000) * 0.1; temp = 600000; }
        if (temp > 300000) { newTax += (temp - 300000) * 0.05; temp = 300000; }
      }
      const newTotal = Math.round(newTax * 1.04);

      // 2. Old Regime
      const oldStandard = 50000;
      const oldTaxable = Math.max(0, income - deductions - oldStandard);
      let oldTax = 0;
      if (oldTaxable > 500000) { // Rebate up to 5L under Old Regime
        let temp = oldTaxable;
        if (temp > 1000000) { oldTax += (temp - 1000000) * 0.3; temp = 1000000; }
        if (temp > 500000) { oldTax += (temp - 500000) * 0.2; temp = 500000; }
        if (temp > 250000) { oldTax += (temp - 250000) * 0.05; temp = 250000; }
      }
      const oldTotal = Math.round(oldTax * 1.04);

      const recommended = newTotal < oldTotal ? 'New Tax Regime' : 'Old Tax Regime';
      const pct = Math.round((newTotal / (income || 1)) * 100);

      return {
        results: [
          { label: 'New Regime Tax Liability', value: `₹${newTotal.toLocaleString('en-IN')}`, isHighlight: newTotal <= oldTotal },
          { label: 'Old Regime Tax Liability', value: `₹${oldTotal.toLocaleString('en-IN')}`, isHighlight: oldTotal < newTotal },
          { label: 'Recommended Choice', value: recommended, isHighlight: true },
          { label: 'Effective Tax Rate (New)', value: `${((newTotal / income) * 100).toFixed(2)}%` }
        ],
        donut: { val1: 100 - pct, label1: 'Take-home Percentage', val2: pct, label2: 'Tax Paid' },
        guide: {
          title: 'Income Tax Slab System',
          text: 'FY 2024-25 features slab rate reductions under the New Tax Regime, raising standard deduction to ₹75,000. Under Section 87A, rebate is offered to make income up to ₹7 Lakhs entirely tax-free.'
        }
      };
    }
  },
  'hra': {
    name: 'HRA Exemption Calculator',
    icon: '🏠',
    description: 'Calculate house rent allowance (HRA) tax exemption limits.',
    inputs: [
      { id: 'basic', label: 'Basic Monthly Salary', min: 5000, max: 500000, step: 1000, default: 45000, prefix: '₹' },
      { id: 'hra', label: 'HRA Received (Monthly)', min: 0, max: 200000, step: 1000, default: 20000, prefix: '₹' },
      { id: 'rent', label: 'Rent Paid (Monthly)', min: 0, max: 200000, step: 1000, default: 18000, prefix: '₹' },
      {
        id: 'metro',
        label: 'City Type',
        type: 'select',
        default: 1,
        options: [
          { value: 1, label: 'Metro City (50% Basic)' },
          { value: 0, label: 'Non-Metro City (40% Basic)' }
        ]
      }
    ],
    calculate: (vals) => {
      const { basic, hra, rent, metro } = vals;
      const salaryFactor = metro === 1 ? 0.5 : 0.4;
      const limit1 = hra;
      const limit2 = Math.max(0, rent - basic * 0.1);
      const limit3 = basic * salaryFactor;
      const exempt = Math.round(Math.min(limit1, limit2, limit3));
      const taxable = Math.round(hra - exempt);
      const pct = Math.round((exempt / (hra || 1)) * 100);
      return {
        results: [
          { label: 'HRA Received', value: `₹${hra.toLocaleString('en-IN')} / Mo` },
          { label: 'Exempt HRA (Tax-Free)', value: `₹${exempt.toLocaleString('en-IN')} / Mo`, isHighlight: true },
          { label: 'Taxable HRA Balance', value: `₹${taxable.toLocaleString('en-IN')} / Mo`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Tax-Free HRA', val2: 100 - pct, label2: 'Taxable HRA' },
        guide: {
          title: 'HRA Exemption Criteria',
          text: 'HRA tax exemption is governed by Section 10(13A). The exempt portion is calculated as the lowest of: Actual HRA received, Rent paid minus 10% of basic salary (+DA), or 40%/50% of basic salary.'
        }
      };
    }
  },
  'gst': {
    name: 'GST Calculator',
    icon: '🛍️',
    description: 'Add or remove GST percentages on net prices.',
    inputs: [
      { id: 'amount', label: 'Net / Gross Price', min: 100, max: 10000000, step: 500, default: 10000, prefix: '₹' },
      {
        id: 'rate',
        label: 'GST Rate',
        type: 'select',
        default: 18,
        options: [
          { value: 5, label: '5%' },
          { value: 12, label: '12%' },
          { value: 18, label: '18%' },
          { value: 28, label: '28%' }
        ]
      },
      {
        id: 'action',
        label: 'Action',
        type: 'select',
        default: 1,
        options: [
          { value: 1, label: 'Add GST' },
          { value: 0, label: 'Remove GST' }
        ]
      }
    ],
    calculate: (vals) => {
      const { amount, rate, action } = vals;
      let netCost = amount;
      let total = amount;
      let gstAmount = 0;
      if (action === 1) {
        gstAmount = amount * (rate / 100);
        total = amount + gstAmount;
      } else {
        total = amount;
        netCost = amount / (1 + rate / 100);
        gstAmount = amount - netCost;
      }
      const cgst = gstAmount / 2;
      const pct = Math.round((netCost / total) * 100);
      return {
        results: [
          { label: 'Base Net Price', value: `₹${Math.round(netCost).toLocaleString('en-IN')}` },
          { label: 'CGST (Central Tax)', value: `₹${Math.round(cgst).toLocaleString('en-IN')}` },
          { label: 'SGST (State Tax)', value: `₹${Math.round(cgst).toLocaleString('en-IN')}` },
          { label: 'Total GST Amount', value: `₹${Math.round(gstAmount).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Invoice Value', value: `₹${Math.round(total).toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Net Price', val2: 100 - pct, label2: 'GST Component' },
        guide: {
          title: 'How GST is Split',
          text: 'The Goods and Services Tax is an indirect tax. For intra-state transactions, the GST is divided equally into CGST (Central GST) and SGST (State GST).'
        }
      };
    }
  },
  'tds': {
    name: 'TDS Calculator',
    icon: '📄',
    description: 'Calculate Tax Deducted at Source (TDS) percentages and payouts.',
    inputs: [
      { id: 'amount', label: 'Gross Invoice Value', min: 100, max: 10000000, step: 1000, default: 50000, prefix: '₹' },
      {
        id: 'rate',
        label: 'TDS Category & Rate',
        type: 'select',
        default: 0.1,
        options: [
          { value: 0.1, label: 'Professional Fees (10%)' },
          { value: 0.05, label: 'Brokerage & Commission (5%)' },
          { value: 0.02, label: 'Contractor (Co) (2%)' },
          { value: 0.01, label: 'Contractor (Indiv) (1%)' },
          { value: 0.1, label: 'Rent on Property (10%)' }
        ]
      }
    ],
    calculate: (vals) => {
      const { amount, rate } = vals;
      const tds = amount * rate;
      const net = amount - tds;
      const pct = Math.round((net / amount) * 100);
      return {
        results: [
          { label: 'Gross Invoice Value', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'TDS Deducted Amount', value: `₹${Math.round(tds).toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Net Payable Amount', value: `₹${Math.round(net).toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Payable Cash', val2: 100 - pct, label2: 'TDS Tax' },
        guide: {
          title: 'TDS (Tax Deducted at Source) Rules',
          text: 'TDS requires the payor of certain income categories to deduct tax at source and deposit it to the government. The payee can claim this deduction when filing their tax returns.'
        }
      };
    }
  },
  'salary': {
    name: 'Salary Take-Home Calculator',
    icon: '💵',
    description: 'Estimate your monthly net take-home salary after taxes and contributions.',
    inputs: [
      { id: 'gross', label: 'Gross Annual Salary (CTC)', min: 100000, max: 10000000, step: 10000, default: 1200000, prefix: '₹' }
    ],
    calculate: (vals) => {
      const { gross } = vals;
      const monthlyGross = gross / 12;
      // Basic assumed at 40% of CTC
      const monthlyBasic = monthlyGross * 0.4;
      const epf = Math.min(1800, monthlyBasic * 0.12);
      const pt = 200;
      
      // Calculate annual tax under New Regime
      const newStandard = 75000;
      const newTaxable = Math.max(0, gross - newStandard);
      let annualTax = 0;
      if (newTaxable > 700000) {
        let temp = newTaxable;
        if (temp > 1500000) { annualTax += (temp - 1500000) * 0.3; temp = 1500000; }
        if (temp > 1200000) { annualTax += (temp - 1200000) * 0.2; temp = 1200000; }
        if (temp > 900000) { annualTax += (temp - 900000) * 0.15; temp = 900000; }
        if (temp > 600000) { annualTax += (temp - 600000) * 0.1; temp = 600000; }
        if (temp > 300000) { annualTax += (temp - 300000) * 0.05; temp = 300000; }
      }
      const monthlyTax = Math.round(annualTax * 1.04) / 12;
      const takeHome = Math.round(monthlyGross - epf - pt - monthlyTax);
      const pct = Math.round((takeHome / monthlyGross) * 100);

      return {
        results: [
          { label: 'Monthly Gross Salary', value: `₹${Math.round(monthlyGross).toLocaleString('en-IN')}` },
          { label: 'EPF Deduction (Employee)', value: `₹${Math.round(epf).toLocaleString('en-IN')}` },
          { label: 'Professional Tax (PT)', value: `₹${pt}` },
          { label: 'Income Tax Deduction (Est.)', value: `₹${Math.round(monthlyTax).toLocaleString('en-IN')}` },
          { label: 'Net Monthly Take-Home', value: `₹${takeHome.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Net Take-Home', val2: 100 - pct, label2: 'Total Deductions' },
        guide: {
          title: 'Understanding Salary Slips',
          text: 'Take-home salary is computed by deducting Provident Fund (EPF), Professional Tax (PT), and Income Tax from your gross monthly salary.'
        }
      };
    }
  },
  'gratuity': {
    name: 'Gratuity Calculator',
    icon: '🎁',
    description: 'Calculate gratuity payout received upon retirement or job change.',
    inputs: [
      { id: 'basic', label: 'Basic Salary + DA (Monthly)', min: 1000, max: 1000000, step: 1000, default: 50000, prefix: '₹' },
      { id: 'years', label: 'Years of Service', min: 1, max: 50, step: 1, default: 10 }
    ],
    calculate: (vals) => {
      const { basic, years } = vals;
      const gratuity = Math.round((15 * basic * years) / 26);
      const limitExceeded = gratuity > 20000000;
      const finalGratuity = limitExceeded ? 20000000 : gratuity;
      return {
        results: [
          { label: 'Monthly Basic + DA', value: `₹${basic.toLocaleString('en-IN')}` },
          { label: 'Completed Years', value: `${years} Years` },
          { label: 'Gratuity Payout Amount', value: `₹${finalGratuity.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Income Tax Exemption', value: 'Tax-Free up to ₹20 Lakhs' }
        ],
        donut: { val1: 100, label1: 'Gratuity Corpus', val2: 0, label2: 'Deductions' },
        guide: {
          title: 'Payment of Gratuity Act Rules',
          text: 'Gratuity is a retirement benefit paid to employees who have completed at least 5 years of continuous service. The formula is: Gratuity = (15 * Last Drawn Basic Salary * Years of Service) / 26.'
        }
      };
    }
  },
  'cagr': {
    name: 'CAGR Calculator',
    icon: '📊',
    description: 'Calculate Compound Annual Growth Rate (CAGR) of investments.',
    inputs: [
      { id: 'initial', label: 'Initial Investment Value', min: 100, max: 10000000, step: 500, default: 10000, prefix: '₹' },
      { id: 'final', label: 'Final Portfolio Value', min: 100, max: 50000000, step: 1000, default: 25000, prefix: '₹' },
      { id: 'years', label: 'Duration in Years', min: 1, max: 40, step: 1, default: 5 }
    ],
    calculate: (vals) => {
      const { initial, final, years } = vals;
      let cagr = 0;
      if (initial > 0 && final > 0) {
        cagr = (Math.pow(final / initial, 1 / years) - 1) * 100;
      }
      return {
        results: [
          { label: 'Initial Asset Value', value: `₹${initial.toLocaleString('en-IN')}` },
          { label: 'Final Asset Value', value: `₹${final.toLocaleString('en-IN')}` },
          { label: 'Absolute Growth Rate', value: `${(((final - initial) / initial) * 100).toFixed(1)}%` },
          { label: 'CAGR (Annualized)', value: `${cagr.toFixed(2)}%`, isHighlight: true }
        ],
        donut: { val1: initial < final ? Math.round((initial / final) * 100) : 100, label1: 'Principal Input', val2: initial < final ? 100 - Math.round((initial / final) * 100) : 0, label2: 'Growth Component' },
        guide: {
          title: 'Compound Annual Growth Rate',
          text: 'CAGR represents the annualized rate of growth an asset would require to expand from its initial value to its final value over a set number of years.'
        }
      };
    }
  },
  'inflation': {
    name: 'Inflation Calculator',
    icon: '📅',
    description: 'Estimate future pricing and loss of purchasing power.',
    inputs: [
      { id: 'amount', label: 'Current Cost / Pricing', min: 1000, max: 10000000, step: 1000, default: 50000, prefix: '₹' },
      { id: 'rate', label: 'Average Inflation Rate', min: 1, max: 25, step: 0.1, default: 6, suffix: '%' },
      { id: 'years', label: 'Time Period', min: 1, max: 40, step: 1, default: 10, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { amount, rate, years } = vals;
      const future = Math.round(amount * Math.pow(1 + rate / 100, years));
      const deficit = future - amount;
      const pct = Math.round((amount / future) * 100);
      return {
        results: [
          { label: 'Current Cost', value: `₹${amount.toLocaleString('en-IN')}` },
          { label: 'Future Inflation-Adjusted Cost', value: `₹${future.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Loss of Purchasing Power', value: `₹${deficit.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Value Retained', val2: 100 - pct, label2: 'Inflation Decay' },
        guide: {
          title: 'Understanding Inflation Impacts',
          text: 'Inflation reduces the value of a currency over time. The future value formula is A = P(1 + r/100)^t, where r is the average annual inflation rate.'
        }
      };
    }
  },
  'simple-interest': {
    name: 'Simple Interest Calculator',
    icon: '🧮',
    description: 'Calculate simple interest earnings on deposits.',
    inputs: [
      { id: 'principal', label: 'Principal Amount', min: 1000, max: 10000000, step: 1000, default: 100000, prefix: '₹' },
      { id: 'rate', label: 'Rate of Interest', min: 1, max: 25, step: 0.1, default: 8, suffix: '%' },
      { id: 'years', label: 'Time Period', min: 1, max: 30, step: 1, default: 5, suffix: 'Yrs' }
    ],
    calculate: (vals) => {
      const { principal, rate, years } = vals;
      const interest = (principal * rate * years) / 100;
      const maturity = principal + interest;
      const pct = Math.round((principal / maturity) * 100);
      return {
        results: [
          { label: 'Principal Invested', value: `₹${principal.toLocaleString('en-IN')}` },
          { label: 'Interest Accumulated', value: `₹${interest.toLocaleString('en-IN')}`, isHighlight: true },
          { label: 'Total Maturity Value', value: `₹${maturity.toLocaleString('en-IN')}`, isHighlight: true }
        ],
        donut: { val1: pct, label1: 'Principal', val2: 100 - pct, label2: 'Simple Interest' },
        guide: {
          title: 'Simple Interest Formula',
          text: 'Simple interest calculations compute gains only on the initial principal. The mathematical formula is Interest = (Principal * Rate * Time) / 100.'
        }
      };
    }
  }
};

export default function CalculatorsClient({ type }) {
  const config = CALCS_CONFIG[type];

  // Safeguard if type is unsupported
  if (!config) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-base" style={{ paddingTop: '120px', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ color: 'var(--color-text-primary)' }}>Calculator Not Found</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              The requested calculator could not be located.
            </p>
            <Link href="/calculators" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              Back to Calculators
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Setup initial states dynamically based on config
  const initialVals = {};
  config.inputs.forEach((input) => {
    initialVals[input.id] = input.default;
  });

  const [inputVals, setInputVals] = useState(initialVals);

  const handleInputChange = (id, value) => {
    setInputVals((prev) => ({
      ...prev,
      [id]: Number(value)
    }));
  };

  const calculated = config.calculate(inputVals);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Top Breadcrumb & Title */}
          <div style={{ marginBottom: '32px' }}>
            <Link href="/calculators" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 800 }}>
              ← BACK TO CALCULATORS
            </Link>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '16px', fontFamily: 'var(--font-heading)' }}>
              {config.icon} {config.name}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>
              {config.description}
            </p>
          </div>

          {/* Calculator Grid Container */}
          <div className="calculator-container" style={{
            background: 'var(--color-bg-glass, rgba(15, 23, 42, 0.03))',
            border: 'var(--border-light, 1px solid rgba(255, 255, 255, 0.08))',
            borderRadius: '20px',
            padding: 'clamp(20px, 4vw, 36px)',
            boxShadow: 'var(--shadow-xl)',
            color: 'var(--color-text-primary, #ffffff)',
            marginBottom: '40px'
          }}>
            <style jsx>{`
              .calc-grid {
                display: grid;
                grid-template-columns: 1.1fr 0.9fr;
                gap: 40px;
              }
              @media (max-width: 992px) {
                .calc-grid {
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
                padding: 0 12px;
                font-size: 13px;
                font-weight: 700;
                height: 100%;
                width: 100%;
                cursor: pointer;
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
              .stat-value-medium {
                font-size: 14px;
                font-weight: 700;
                color: var(--color-text-primary, #090d16);
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
                gap: 16px;
                margin: 8px 0;
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
            `}</style>

            <div className="calc-grid">
              {/* Left Column: Form Controls */}
              <div className="inputs-column">
                {config.inputs.map((input) => (
                  <div key={input.id} className="input-row-group">
                    <div className="input-label-container">
                      <span className="input-label">{input.label}</span>
                      
                      {input.type === 'select' ? (
                        <div className="input-box-wrapper" style={{ width: '160px' }}>
                          <select
                            value={inputVals[input.id]}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            className="dropdown-select"
                          >
                            {input.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="input-box-wrapper">
                          {input.prefix && <div className="badge-prefix">{input.prefix}</div>}
                          <input
                            type="number"
                            className="raw-input"
                            value={inputVals[input.id]}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            style={{ width: input.prefix || input.suffix ? '90px' : '130px' }}
                          />
                          {input.suffix && <div className="badge-suffix">{input.suffix}</div>}
                        </div>
                      )}
                    </div>

                    {/* Numeric slider if not a select dropdown */}
                    {input.type !== 'select' && (
                      <>
                        <input
                          type="range"
                          min={input.min}
                          max={input.max}
                          step={input.step || 1}
                          className="range-slider"
                          value={inputVals[input.id]}
                          onChange={(e) => handleInputChange(input.id, e.target.value)}
                        />
                        <div className="limits-row">
                          <span>
                            {input.prefix}
                            {input.min.toLocaleString('en-IN')}
                            {input.suffix}
                          </span>
                          <span>
                            {input.prefix}
                            {input.max.toLocaleString('en-IN')}
                            {input.suffix}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* CTAs */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                  <Link href="/check" className="btn btn-primary" style={{
                    fontWeight: 800,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    borderRadius: '8px',
                    padding: '12px 28px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}>
                    Check Eligibility Now
                  </Link>

                  <Link href="/calculators" style={{
                    color: 'var(--color-text-primary, #ffffff)',
                    border: '1px solid var(--border-default, rgba(255, 255, 255, 0.3))',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-bg-card-hover, rgba(255, 255, 255, 0.05))'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    ⬅ More Calculators
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Calculations Card */}
              <div className="results-column">
                <div className="results-white-card">
                  {/* Results List */}
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {calculated.results.map((res, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingBottom: '12px',
                          borderBottom: i < calculated.results.length - 1 ? '1px solid var(--border-default, #f1f5f9)' : 'none'
                        }}
                      >
                        <span className="stat-label-small" style={{ fontSize: '10px' }}>{res.label}</span>
                        <span className={res.isHighlight ? 'stat-value-large' : 'stat-value-medium'} style={{ margin: 0 }}>
                          {res.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr className="card-divider" />

                  {/* SVG Chart Circular representation */}
                  {calculated.donut && (
                    <div className="donut-section">
                      <svg width="85" height="85" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-bg-tertiary, #f1f5f9)" strokeWidth="4.2" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--border-default, #e2e8f0)"
                          strokeWidth="4.2"
                          strokeDasharray={`${calculated.donut.val1} ${100 - calculated.donut.val1}`}
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke="var(--color-primary, #00d756)"
                          strokeWidth="4.2"
                          strokeDasharray={`${calculated.donut.val2} ${100 - calculated.donut.val2}`}
                          strokeDashoffset={`${100 - calculated.donut.val1}`}
                        />
                      </svg>

                      {/* Legend */}
                      <div className="legend-list">
                        <div className="legend-item">
                          <span className="legend-bullet" style={{ background: 'var(--border-default, #e2e8f0)' }}></span>
                          <span style={{ color: 'var(--color-text-secondary, #475569)', fontWeight: 600 }}>
                            {calculated.donut.label1} - {calculated.donut.val1}%
                          </span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-bullet" style={{ background: 'var(--color-primary, #00d756)' }}></span>
                          <span style={{ color: 'var(--color-text-secondary, #475569)', fontWeight: 600 }}>
                            {calculated.donut.label2} - {calculated.donut.val2}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* Guide Introduction below the grid */}
          <div style={{ maxWidth: '900px', margin: '0 auto', color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
            <h2 style={{ fontSize: 'var(--text-lg, 20px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              {calculated.guide.title}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm, 14px)' }}>
              {calculated.guide.text}
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
