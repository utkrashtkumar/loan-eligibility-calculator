const fs = require('fs');
const path = require('path');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add auditSearchTerm state
if (!content.includes('auditSearchTerm')) {
  console.log('Adding auditSearchTerm state...');
  content = content.replace(
    'const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);',
    'const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);\n  const [auditSearchTerm, setAuditSearchTerm] = useState(\'\');'
  );
}

// 2. Replace the broken audit logs panel code block.
// Let's split by lines to target precisely the line numbers or search for lines.
const lines = content.split('\n');

// Find where PANEL 11 starts
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('PANEL 11: AUDIT LOGS')) {
    startIndex = i;
  }
  // Find where it ends, which is activeTab === 'audit_logs' block
  // We can scan ahead to find the matching close tags.
  // The structure:
  // 3566:                  {activeTab === 'audit_logs' && (
  // ...
  // 3594:                  )}
  if (startIndex !== -1 && i > startIndex && lines[i].trim() === ')}' && lines[i-1].trim() === '</div>' && lines[i-2].trim() === ')}') {
    endIndex = i;
    break;
  }
}

// Let's do another sanity check for the end index if the above didn't match.
if (endIndex === -1 && startIndex !== -1) {
  for (let i = startIndex + 1; i < startIndex + 50; i++) {
    if (lines[i] && lines[i].includes('Contact Message Detail Modal')) {
      // It is just before the modal. Let's find the closing brackets.
      // Let's backtrack.
      for (let j = i - 1; j > startIndex; j--) {
        if (lines[j].trim() === ')}' && lines[j+1].trim() === '</div>') {
          // Wait, let's look at lines around 3594-3596
          // 3594:                  )}
          // 3595:               </div>
          // 3596:             </div>
          endIndex = j;
          break;
        }
      }
      break;
    }
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found audit logs block from line ${startIndex + 1} to ${endIndex + 1}`);
  
  const replacement = `                  {/* PANEL 11: AUDIT LOGS */}
                  {activeTab === 'audit_logs' && (
                    <div className="form-card" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Administrative Audit Logs</h3>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                            Chronological list of all actions performed by administrators in the control room panel.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => {
                              const headers = ['Date', 'Admin Email', 'Action', 'Details'];
                              const rows = auditLogs.map(log => [
                                new Date(log.created_at).toLocaleString(),
                                log.admin_email,
                                log.action,
                                log.details || ''
                              ]);
                              const csvContent = "data:text/csv;charset=utf-8," 
                                + [headers.join(','), ...rows.map(e => e.map(val => \`"\${val.replace(/"/g, '""')}"\`).join(','))].join('\\n');
                              const encodedUri = encodeURI(csvContent);
                              const link = document.createElement("a");
                              link.setAttribute("href", encodedUri);
                              link.setAttribute("download", \`audit_logs_\${new Date().toISOString().split('T')[0]}.csv\`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="btn btn-secondary btn-sm"
                            disabled={auditLogs.length === 0}
                          >
                            Export CSV
                          </button>
                          <button onClick={fetchAuditLogs} className="btn btn-secondary btn-sm" disabled={loadingAuditLogs}>
                            {loadingAuditLogs ? 'Refreshing...' : 'Refresh Logs'}
                          </button>
                        </div>
                      </div>

                      {/* Search and Filters */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <input
                            type="text"
                            placeholder="Search by Admin Email, Action, or Details..."
                            className="input-field"
                            value={auditSearchTerm}
                            onChange={(e) => setAuditSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {loadingAuditLogs ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                          Loading audit logs...
                        </div>
                      ) : (
                        <div className="table-scroll-x">
                          <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Timestamp</th>
                                <th style={{ padding: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Admin Email</th>
                                <th style={{ padding: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Action</th>
                                <th style={{ padding: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(auditLogs || [])
                                .filter(log => {
                                  const search = (auditSearchTerm || '').toLowerCase().trim();
                                  if (!search) return true;
                                  return (
                                    (log.admin_email || '').toLowerCase().includes(search) ||
                                    (log.action || '').toLowerCase().includes(search) ||
                                    (log.details || '').toLowerCase().includes(search)
                                  );
                                })
                                .map((log, index) => (
                                  <tr key={log.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '12px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                                      {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--color-text-primary)' }}>
                                      <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {log.admin_email}
                                      </code>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <span className="badge" style={{ 
                                        background: 'rgba(99, 102, 241, 0.1)', 
                                        color: 'var(--color-primary)', 
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 600
                                      }}>
                                        {log.action}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)', maxWidth: '400px', wordBreak: 'break-all' }}>
                                      {log.details}
                                    </td>
                                  </tr>
                                ))}
                              {auditLogs.length === 0 && (
                                <tr>
                                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                                    No audit logs recorded yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}`;

  // Let's replace the lines in array and join
  lines.splice(startIndex, (endIndex - startIndex + 1), replacement);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully fixed admin/page.js!');
} else {
  console.error(`Failed to find line indices: startIndex=${startIndex}, endIndex=${endIndex}`);
}
