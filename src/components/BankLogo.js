import React, { useState } from 'react';

/**
 * Returns a high-fidelity stylized SVG logo for the matching bank/NBFC.
 * 
 * @param {Object} props
 * @param {string} props.bankName - Name of the bank
 * @param {string} [props.logoUrl=''] - Optional external URL for the logo
 * @param {number} [props.size=32] - Width/Height of the logo
 */
export default function BankLogo({ bankName = '', logoUrl = '', size = 32 }) {
  const [imgError, setImgError] = useState(false);

  // Normalize bank name
  const name = bankName.toUpperCase().replace(/\(BL\)/g, '').trim();

  // Common wrapper styles
  const wrapperStyle = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size < 24 ? '4px' : '8px',
    background: size < 24 ? 'transparent' : 'var(--color-bg-input)',
    border: size < 24 ? 'none' : 'var(--border-light)',
    boxShadow: size < 24 ? 'none' : 'var(--shadow-sm)',
    flexShrink: 0,
    overflow: 'hidden'
  };

  // Render external logo if provided and hasn't failed to load
  if (logoUrl && !imgError) {
    return (
      <div style={wrapperStyle} title={bankName}>
        <img 
          src={logoUrl} 
          alt={bankName} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // SVG Renderers for each bank
  if (name.includes('FIBE')) {
    // FIBE: Teal & Green digital finance symbol
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#fibe-grad)" />
          <path d="M9 8H23V12H13V15H21V19H13V24H9V8Z" fill="white" />
          <defs>
            <linearGradient id="fibe-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0d9488" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('INCRED')) {
    // INCRED: Orange / Navy circular emblem
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="#f97316" strokeWidth="2" />
          <path d="M12 9H16V23H12V9ZM16 11.5C18.5 11.5 20 13.5 20 16C20 18.5 18.5 20.5 16 20.5V23C20 23 24 19.5 24 16C24 12.5 20 9 16 9V11.5Z" fill="#f97316" />
        </svg>
      </div>
    );
  }

  if (name.includes('FINNABLE')) {
    // FINNABLE: Teal upward growth chevron
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1e293b" />
          <path d="M8 22L16 14L24 22" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14L16 6L24 14" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('IDFC')) {
    // IDFC: Maroon & Gold FIRST monogram
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#701a0e" />
          <path d="M7 9H25V12.5H16V15.5H23V19H16V23H7V9Z" fill="#fbbf24" />
          <circle cx="21" cy="21" r="2" fill="#fbbf24" />
        </svg>
      </div>
    );
  }

  if (name.includes('INDUSIND')) {
    // INDUSIND: Classic Indian red-gold circular coin
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="url(#indus-grad)" />
          <path d="M12 10C10 12 9 14.5 9 17C9 21.5 12.5 24 16 24C19.5 24 23 21.5 23 17C23 14.5 22 12 20 10H12ZM16 21C13.5 21 11.5 19.5 11.5 17C11.5 14.5 13.5 13 16 13C18.5 13 20.5 14.5 20.5 17C20.5 19.5 18.5 21 16 21Z" fill="#f59e0b" />
          <defs>
            <linearGradient id="indus-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b91c1c" />
              <stop offset="1" stopColor="#991b1b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('BIRLA') || name.includes('ADITYA')) {
    // ADITYA BIRLA: Gold solar sunburst
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="#fef08a" />
          <circle cx="16" cy="16" r="6" fill="#ea580c" />
          <path d="M16 2V8M16 24V30M2 16H8M24 16H30M6.1 6.1L10.3 10.3M21.7 21.7L25.9 25.9M6.1 25.9L10.3 21.7M21.7 10.3L25.9 6.1" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('POONAWALLA') || name.includes('POONWALA')) {
    // POONAWALLA: Gold/Blue premium crest shield
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1e3a8a" />
          <path d="M16 6C16 6 23 8 23 13C23 18.5 16 25 16 25C16 25 9 18.5 9 13C9 8 16 6 16 6Z" stroke="#fbbf24" strokeWidth="2" fill="rgba(251,191,36,0.1)" />
          <path d="M13 13H19M13 16H19M16 11V18" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('UNITY')) {
    // UNITY: Circular geometric interlocking arrows
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#0284c7" />
          <path d="M10 19C10 15 13 12 16 12C19 12 22 15 22 19" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="19" r="3" fill="white" />
        </svg>
      </div>
    );
  }

  if (name.includes('HERO')) {
    // HERO: Red futuristic rectangular crest
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#dc2626" />
          <path d="M9 8H13V14H19V8H23V24H19V18H13V24H9V8Z" fill="white" />
        </svg>
      </div>
    );
  }

  if (name.includes('MUTHOOT')) {
    // MUTHOOT: Twin elephants in gold on red badge
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#b91c1c" />
          <circle cx="16" cy="16" r="10" fill="#f59e0b" />
          <path d="M12 18C12 15 14 13 16 13C18 13 20 15 20 18" stroke="#b91c1c" strokeWidth="2.5" />
          <circle cx="12" cy="18" r="1.5" fill="#b91c1c" />
          <circle cx="20" cy="18" r="1.5" fill="#b91c1c" />
        </svg>
      </div>
    );
  }

  if (name.includes('PROTIUM')) {
    // PROTIUM: Mint green leaf shield
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#prot-grad)" />
          <path d="M16 6C20 9 24 8 24 13C24 19 19 24 16 26C13 24 8 19 8 13C8 8 12 9 16 6Z" fill="white" opacity="0.2" />
          <path d="M16 9L11 12C11 17 14 20.5 16 22.5C18 20.5 21 17 21 12L16 9Z" fill="white" />
          <defs>
            <linearGradient id="prot-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#059669" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('FLEXI')) {
    // FLEXI: Flexible ocean-blue wave
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1e293b" />
          <path d="M6 16C10 8 12 24 16 16C20 8 22 24 26 16" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
          <path d="M6 16C10 8 12 24 16 16C20 8 22 24 26 16" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('FAIRCENT')) {
    // FAIRCENT: Circular emerald check
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#047857" />
          <path d="M10 16.5L14 20.5L22 11.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('PREFER')) {
    // PREFER: Cyan check shield
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#0891b2" />
          <path d="M16 6L23 9V15C23 19.5 20 23.5 16 25C12 23.5 9 19.5 9 15V9L16 6Z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.1)" />
          <path d="M12.5 15.5L14.5 17.5L19.5 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('HDFC')) {
    // HDFC Bank: Blue background with white frame and red center square
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#004c8f" />
          <rect x="6" y="6" width="20" height="20" fill="#004c8f" stroke="white" strokeWidth="2.5" />
          <rect x="13" y="13" width="6" height="6" fill="#ed1c24" />
        </svg>
      </div>
    );
  }

  if (name.includes('AXIS')) {
    // Axis Bank: Burgundy background with white stylized 'A' chevron
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#97144d" />
          <path d="M16 6L25 24H21L16 14L11 24H7L16 6Z" fill="white" />
          <path d="M16 11.5L13.5 17.5H18.5L16 11.5Z" fill="#97144d" />
        </svg>
      </div>
    );
  }

  if (name.includes('ICICI')) {
    // ICICI Bank: Orange-maroon gradient with gold monogram
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#icici-grad)" />
          <circle cx="16" cy="16" r="10" fill="none" stroke="#fbc02d" strokeWidth="2" />
          <path d="M16 10C13.5 10 12 12.5 12 16C12 19.5 13.5 22 16 22V20C14.8 20 14 18.5 14 16C14 13.5 14.8 12 16 12V10ZM16 10C18.5 10 20 12.5 20 16C20 19.5 18.5 22 16 22V20C17.2 20 18 18.5 18 16C18 13.5 17.2 12 16 12V10Z" fill="#fbc02d" />
          <circle cx="16" cy="16" r="2.5" fill="#fbc02d" />
          <defs>
            <linearGradient id="icici-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b91c1c" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('KOTAK')) {
    // Kotak Mahindra Bank: Corporate red card with Kotak circular-K monogram
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#dc2626" />
          <circle cx="16" cy="16" r="10" fill="none" stroke="white" strokeWidth="2" />
          <path d="M13 10V22H16V17L19.5 22H23.5L18.5 15L22.5 10H18.5L16 13.5V10H13Z" fill="white" />
        </svg>
      </div>
    );
  }

  if (name.includes('YES BANK') || name.includes('YESBANK')) {
    // Yes Bank: Royal blue shield vector with bright red checkmark
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#0f5ca8" />
          <path d="M16 6L24 9V16C24 20 19 24 16 26C13 24 8 20 8 16V9L16 6Z" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M12 15L15 18L21 11" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('TATA')) {
    // Tata Capital: Trust blue card with twin waves
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#tata-grad)" />
          <path d="M16 6C10.5 6 6 10.5 6 16C6 21.5 10.5 26 16 26" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M16 11C13.2 11 11 13.2 11 16C11 18.8 13.2 21 16 21" stroke="#fbc02d" strokeWidth="3" strokeLinecap="round" fill="none" />
          <defs>
            <linearGradient id="tata-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0b57a4" />
              <stop offset="1" stopColor="#007bb6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('BAJAJ')) {
    // Bajaj Finance: Royal Blue B logo
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#0b4380" />
          <path d="M11 8H17.5C19.5 8 21.5 9.5 21.5 12C21.5 13.5 20.5 14.8 19 15.5C21 16.2 22 17.8 22 19.5C22 22 20 24H17.5H11V8ZM14.5 11.5V14.5H17C18 14.5 18.5 14 18.5 13C18.5 12 18 11.5 17 11.5H14.5ZM14.5 17.5V20.5H17.5C18.5 20.5 19 20 19 19C19 18 18.5 17.5 17.5 17.5H14.5Z" fill="white" />
          <path d="M6 15C8 13 10 13 10 13M6 18C9 16 10 16 10 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('SMFG') || name.includes('FULLERTON')) {
    // SMFG India Credit / Fullerton: Forest green gradient leaf
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#smfg-grad)" />
          <circle cx="16" cy="16" r="7" fill="none" stroke="white" strokeWidth="2.5" />
          <path d="M11 12C13 14 19 14 21 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="smfg-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#047857" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('PIRAMAL')) {
    // Piramal Finance: Golden-green crest
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1e3a8a" />
          <circle cx="16" cy="12" r="4" fill="#ea9c0a" />
          <path d="M12 24V18H20V24H12Z" fill="#ea9c0a" />
          <circle cx="16" cy="12" r="2" fill="white" />
        </svg>
      </div>
    );
  }

  if (name.includes('L&T') || name.includes('L & T')) {
    // L&T Finance: Golden yellow L&T monogram
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#facc15" />
          <path d="M9 8V20H15" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M21 8V13C21 17 17 20 17 20" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M15 12.5H23" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (name.includes('DMI')) {
    // DMI Finance: Navy blue with red diamond
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#0a2540" />
          <path d="M16 6L25 15L16 24L7 15Z" fill="#ff4d4f" />
          <circle cx="16" cy="15" r="4" fill="white" />
        </svg>
      </div>
    );
  }

  if (name.includes('CREDIT SEA') || name.includes('CREDITSEA')) {
    // Credit Sea: Sky blue teal wave
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="url(#sea-grad)" />
          <path d="M6 19C11 14 13 24 18 19C23 14 25 24 26 19" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <defs>
            <linearGradient id="sea-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('RING')) {
    // Ring: Violet glow ring
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1f073a" />
          <circle cx="16" cy="16" r="8" stroke="url(#ring-grad)" strokeWidth="3.5" fill="none" />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="32" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#db2777" />
              <stop offset="1" stopColor="#9333ea" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (name.includes('BHARATPE') || name.includes('BHARAT PE')) {
    // BharatPe: Crossed axes on dark background
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#0f172a" />
          <path d="M10 16H22M16 10V22" stroke="#00bda6" strokeWidth="3" strokeLinecap="round" />
          <circle cx="16" cy="16" r="3.5" fill="#facc15" />
        </svg>
      </div>
    );
  }

  if (name.includes('INDIFI')) {
    // Indifi: Orange dynamic forward plane
    return (
      <div style={wrapperStyle} title={bankName}>
        <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#1e1b4b" />
          <path d="M8 13L24 7L19 23L15 15L8 13Z" fill="#f97316" />
        </svg>
      </div>
    );
  }

  // Fallback logo for any other banks (minimalist generic financial glyph)
  return (
    <div style={wrapperStyle} title={bankName}>
      <svg width="80%" height="80%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="url(#fallback-grad)" />
        <path d="M16 8L7 13V15H25V13L16 8ZM9 17V21H11V17H9ZM13 17V21H15V17H13ZM17 17V21H19V17H17ZM21 17V21H23V17H21ZM7 23V25H25V23H7Z" fill="white" />
        <defs>
          <linearGradient id="fallback-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
