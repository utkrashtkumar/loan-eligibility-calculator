const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/banks/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        {/* Apply Button */}
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
          {(affiliateLink || userRole === 'user') ? 'Apply Now' : 'Apply for Client'}
        </button>`;

const replacement = `        {/* Action Buttons Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: bank.policy_pdf ? '1fr 1fr' : '1fr',
          gap: '10px',
          width: '100%'
        }}>
          {bank.policy_pdf && (
            <button
              onClick={() => {
                const base64Data = bank.policy_pdf;
                const base64Parts = base64Data.split(';base64,');
                const contentType = base64Parts[0].split(':')[1] || 'application/pdf';
                const raw = window.atob(base64Parts[1] || base64Data);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                  uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: contentType });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '10px 0',
                borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: 'var(--border-light)',
                color: 'var(--color-text-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              View PDF
            </button>
          )}
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
            {(affiliateLink || userRole === 'user') ? 'Apply Now' : 'Apply for Client'}
          </button>
        </div>`;

const hasCRLF = content.includes('\r\n');
const normalizedTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
const normalizedReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated banks/page.js with PDF view button!');
} else {
  console.error('Target not found in banks/page.js!');
}
