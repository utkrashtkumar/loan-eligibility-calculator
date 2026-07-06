const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/dashboard/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

// 1. Update select query
const selectTarget = `        // Fetch bank policies for resolving logos in real time
        const { data: polData } = await supabase.from('bank_policies').select('bank_name, logo_url, apply_url, portal_username, portal_password, direct_submit');`;

const selectReplacement = `        // Fetch bank policies for resolving logos in real time
        const { data: polData } = await supabase.from('bank_policies').select('bank_name, logo_url, apply_url, portal_username, portal_password, direct_submit, policy_pdf');`;

// 2. Update Direct Submit segment in application detail modal
const directTarget = `                  if (matchedPolicy?.direct_submit) {
                    return (
                      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>Admin Processing Mode</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                          This bank uses Direct Submit. The administrator is currently applying for this loan on your behalf.
                        </div>
                      </div>
                    );
                  }`;

const directReplacement = `                  if (matchedPolicy?.direct_submit) {
                    return (
                      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>Admin Processing Mode</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                          This bank uses Direct Submit. The administrator is currently applying for this loan on your behalf.
                        </div>
                        {matchedPolicy?.policy_pdf && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              marginTop: '8px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              padding: '10px 16px',
                              width: 'max-content'
                            }}
                            onClick={() => {
                              const base64Data = matchedPolicy.policy_pdf;
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
                          >
                            View Policy PDF
                          </button>
                        )}
                      </div>
                    );
                  }`;

// 3. Update standard action buttons segment
const actionTarget = `                        {appLink && (
                          <a
                            href={appLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              textDecoration: 'none',
                              marginTop: '4px',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 600,
                              padding: '10px 16px'
                            }}
                          >
                            Open Apply Portal ↗
                          </a>
                        )}`;

const actionReplacement = `                        {appLink && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                            <a
                              href={appLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                textDecoration: 'none',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 600,
                                padding: '10px 16px',
                                margin: 0
                              }}
                            >
                              Open Apply Portal ↗
                            </a>
                            {matchedPolicy?.policy_pdf && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  fontSize: 'var(--text-xs)',
                                  fontWeight: 600,
                                  padding: '10px 16px',
                                  margin: 0
                                }}
                                onClick={() => {
                                  const base64Data = matchedPolicy.policy_pdf;
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
                              >
                                View Policy PDF
                              </button>
                            )}
                          </div>
                        )}`;

const replacements = [
  [selectTarget, selectReplacement],
  [directTarget, directReplacement],
  [actionTarget, actionReplacement]
];

let replacedCount = 0;
replacements.forEach(([target, replacement]) => {
  const normTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
  const normReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  if (content.includes(normTarget)) {
    content = content.replace(normTarget, normReplacement);
    replacedCount++;
  } else {
    console.error(`Target not found: ${target.substring(0, 100)}...`);
  }
});

if (replacedCount === replacements.length) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully completed update of dashboard/page.js!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
