const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/check/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `      {isAgent && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => onApply(bank)}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              {userRole === 'user' ? 'Apply Now' : 'Apply for Client'}
            </span>
          </button>
        </div>
      )}`;

const replacement = `      {isAgent && (
        <div style={{
          marginTop: '8px',
          display: 'grid',
          gridTemplateColumns: bank.policy_pdf ? '1fr 1fr' : '1fr',
          gap: '8px',
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
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', margin: 0 }}
            >
              View PDF
            </button>
          )}
          <button
            onClick={() => onApply(bank)}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center', margin: 0 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              {userRole === 'user' ? 'Apply Now' : 'Apply for Client'}
            </span>
          </button>
        </div>
      )}`;

const hasCRLF = content.includes('\r\n');
const normalizedTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
const normalizedReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated check/page.js with PDF view button!');
} else {
  console.error('Target not found in check/page.js!');
}
