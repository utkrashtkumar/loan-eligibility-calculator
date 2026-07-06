const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

// 1. Insert states around line 98
const targetStates = `  // Pincode management state
  const [bankPincodes, setBankPincodes] = useState([]);`;

const replacementStates = `  // Pincode management state
  const [bankPincodes, setBankPincodes] = useState([]);

  // Agent Agreements Management State
  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [agreementSearch, setAgreementSearch] = useState('');
  const [revokingAgreement, setRevokingAgreement] = useState(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revokingLoading, setRevokingLoading] = useState(false);`;

// 2. Insert fetchAgreementsData helper function
const targetFetchHelper = `  const fetchAgentsData = async () => {`;

const replacementFetchHelper = `  const fetchAgreementsData = async () => {
    setLoadingAgreements(true);
    try {
      const { data, error } = await supabase
        .from('agent_agreements')
        .select(\`
          *,
          profiles:agent_id (
            full_name,
            phone,
            email
          )
        \`)
        .order('signed_at', { ascending: false });

      if (error) {
        console.error('Error fetching agreements:', error.message);
      } else {
        setAgreements(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAgreements(false);
    }
  };

  const fetchAgentsData = async () => {`;

// 3. Update fetchAllData
const targetFetchAll = `    await Promise.all([
      fetchInquiries(),
      fetchAgentsData(),
      fetchApplications(),
      fetchPayoutRequests(),
      fetchPolicies(),
      fetchContactMessages(),
      fetchAuditLogs()
    ]);`;

const replacementFetchAll = `    await Promise.all([
      fetchInquiries(),
      fetchAgentsData(),
      fetchApplications(),
      fetchPayoutRequests(),
      fetchPolicies(),
      fetchContactMessages(),
      fetchAuditLogs(),
      fetchAgreementsData()
    ]);`;

// 4. Update Tab Lists (all three arrays)
const targetTabs1 = `                          { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                          { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                          { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },`;

const replacementTabs1 = `                          { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                          { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                          { id: 'agreements', label: \`Agent Agreements\` },
                          { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },`;

const targetTabs2 = `                          { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                          { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                          { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },
                        ].map((tab) => (`;

const replacementTabs2 = `                          { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                          { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                          { id: 'agreements', label: \`Agent Agreements\` },
                          { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },
                        ].map((tab) => (`;

const targetTabs3 = `                      { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                      { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                      { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },
                    ].map((tab) => (`;

const replacementTabs3 = `                      { id: 'policies', label: \`Bank Policies (\${policies.length})\` },
                      { id: 'contacts', label: \`Contact Messages (\${contactMessages.length})\` },
                      { id: 'agreements', label: \`Agent Agreements\` },
                      { id: 'audit_logs', label: \`Audit Logs (\${auditLogs.length})\` },
                    ].map((tab) => (`;

// 5. Insert Agreements Panel JSX at the end of active tabs content (around line 3491)
const targetPanel = `                                 <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                   {log.details}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 )}`;

const replacementPanel = `                                 <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                                   {log.details}
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 )}

                  {activeTab === 'agreements' && (
                    <div style={{ display: 'grid', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>DSA Agent Agreements Ledger</h3>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            View details, print documents, or revoke signed connector/DSA agent agreements.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
                          <input
                            type="text"
                            placeholder="Search by name or number..."
                            className="input-field"
                            value={agreementSearch}
                            onChange={(e) => setAgreementSearch(e.target.value)}
                            style={{ margin: 0 }}
                          />
                        </div>
                      </div>

                      {loadingAgreements ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                          <p style={{ color: 'var(--color-text-secondary)' }}>Loading agreements database...</p>
                        </div>
                      ) : (
                        <div className="table-scroll-x" style={{ background: 'var(--color-bg-card)', border: 'var(--border-light)', borderRadius: '8px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                            <thead>
                              <tr style={{ borderBottom: 'var(--border-subtle)', color: 'var(--color-text-tertiary)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agreement No</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Agent Name</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Phone</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Signed</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agreements.filter(a => {
                                const q = agreementSearch.toLowerCase();
                                return (
                                  a.agreement_no?.toLowerCase().includes(q) ||
                                  a.profiles?.full_name?.toLowerCase().includes(q) ||
                                  a.profiles?.phone?.includes(q) ||
                                  a.profiles?.email?.toLowerCase().includes(q)
                                );
                              }).map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', color: 'var(--color-text-primary)' }}>
                                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{a.agreement_no}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{a.profiles?.full_name}</td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>{a.profiles?.phone}</td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{a.profiles?.email}</td>
                                  <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                                    {new Date(a.signed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      background: a.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      color: a.status === 'active' ? 'var(--color-success)' : '#ef4444',
                                      textTransform: 'uppercase'
                                    }}>
                                      {a.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={() => {
                                        window.open(\`/agreement-print?id=\${a.agent_id}\`, \'_blank\');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{ margin: 0, padding: '4px 10px', fontSize: '11px' }}
                                    >
                                      View / Print
                                    </button>
                                    {a.status === 'active' ? (
                                      <button
                                        onClick={() => setRevokingAgreement(a)}
                                        className="btn btn-sm"
                                        style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: '#ef4444', color: '#fff' }}
                                      >
                                        Revoke
                                      </button>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          if (!confirm(\`Are you sure you want to reactivate agreement \${a.agreement_no}?\`)) return;
                                          try {
                                            const { error } = await supabase
                                              .from(\'agent_agreements\')
                                              .update({ status: \'active\', revoked_at: null, revocation_reason: null })
                                              .eq(\'id\', a.id);
                                            if (error) alert(error.message);
                                            else {
                                              alert(\'Agreement reactivated.\');
                                              logAdminAction(\'Reactivate Agreement\', \`Reactivated agreement \${a.agreement_no} for agent \${a.profiles?.full_name}.\`);
                                              await fetchAgreementsData();
                                            }
                                          } catch (err) { console.error(err); }
                                        }}
                                        className="btn btn-sm"
                                        style={{ margin: 0, padding: '4px 10px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                                      >
                                        Reactivate
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {agreements.length === 0 && (
                                <tr>
                                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No agreements found in the database.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}`;

// 6. Update Agent Drawer to display Agreement Details
const targetDrawerLock = `            {/* Profile Lock Status */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Lock Status</h4>
              <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Status</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_locked ? 'var(--color-error)' : 'var(--color-success)', marginTop: '4px' }}>
                    {selectedAgent.profile_locked ? 'Locked' : 'Unlocked'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProfileLock(selectedAgent)}
                  disabled={agentActionLoading === selectedAgent.id}
                  className="btn btn-secondary btn-sm"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    borderColor: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    color: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    background: selectedAgent.profile_locked ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600
                  }}
                >
                  {selectedAgent.profile_locked ? 'Unlock Agent Profile' : 'Lock Agent Profile'}
                </button>
              </div>
            </div>`;

const replacementDrawerLock = `            {/* Profile Lock Status */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>Profile Lock Status</h4>
              <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--color-bg-card)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Current Status</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: selectedAgent.profile_locked ? 'var(--color-error)' : 'var(--color-success)', marginTop: '4px' }}>
                    {selectedAgent.profile_locked ? 'Locked' : 'Unlocked'}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleProfileLock(selectedAgent)}
                  disabled={agentActionLoading === selectedAgent.id}
                  className="btn btn-secondary btn-sm"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    borderColor: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    color: selectedAgent.profile_locked ? 'var(--color-success)' : 'var(--color-error)',
                    background: selectedAgent.profile_locked ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600
                  }}
                >
                  {selectedAgent.profile_locked ? 'Unlock Agent Profile' : 'Lock Agent Profile'}
                </button>
              </div>
            </div>

            {/* Agent Partner Agreement Status */}
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '12px' }}>DSA Appointment Agreement</h4>
              <div className="form-card" style={{ display: 'grid', gap: '12px', padding: '20px', background: 'var(--color-bg-card)' }}>
                {(() => {
                  const ag = agreements.find(x => x.agent_id === selectedAgent.id);
                  if (!ag) {
                    return (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                        No signed partner agreement found in database for this agent.
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Number:</span>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{ag.agreement_no}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Signed On:</span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(ag.signed_at).toLocaleDateString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Agreement Status:</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: ag.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: ag.status === 'active' ? 'var(--color-success)' : '#ef4444',
                          textTransform: 'uppercase'
                        }}>{ag.status}</span>
                      </div>
                      {ag.status !== 'active' && ag.revocation_reason && (
                        <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '10px', marginTop: '4px' }}>
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 'var(--text-xs)' }}>Revocation Reason:</span>
                          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px', lineHeight: '1.5' }}>{ag.revocation_reason}</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => window.open(\`/agreement-print?id=\${selectedAgent.id}\`, \'_blank\')}
                          className="btn btn-secondary btn-sm"
                          style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                        >
                          Print / View PDF
                        </button>
                        {ag.status === 'active' ? (
                          <button
                            onClick={() => {
                              setSelectedAgent(null); // close drawer to reveal modal cleanly
                              setRevokingAgreement(ag);
                            }}
                            className="btn btn-sm"
                            style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)', background: '#ef4444', color: '#fff' }}
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!confirm(\`Are you sure you want to reactivate agreement \${ag.agreement_no}?\`)) return;
                              try {
                                const { error } = await supabase
                                  .from(\'agent_agreements\')
                                  .update({ status: \'active\', revoked_at: null, revocation_reason: null })
                                  .eq(\'id\', ag.id);
                                if (error) alert(error.message);
                                else {
                                  alert(\'Agreement reactivated.\');
                                  logAdminAction(\'Reactivate Agreement\', \`Reactivated agreement \${ag.agreement_no} for agent \${selectedAgent.full_name}.\`);
                                  await fetchAgreementsData();
                                }
                              } catch (err) { console.error(err); }
                            }}
                            className="btn btn-sm"
                            style={{ margin: 0, flex: 1, padding: '6px 12px', fontSize: 'var(--text-xs)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>`;

// 7. Render Revoke Modal at the bottom of the page
const targetModalAppend = `      {/* Contact Message Detail Modal */}`;

const replacementModalAppend = `      {/* Revoke Agreement Modal */}
      {revokingAgreement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          overflowY: 'auto',
          padding: '40px 16px',
          zIndex: 99999,
          WebkitOverflowScrolling: 'touch'
        }} onClick={() => setRevokingAgreement(null)}>
          <div className="form-card" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', display: 'grid', gap: '20px', border: 'var(--border-accent)', background: 'var(--color-bg-tertiary)', backdropFilter: 'blur(20px)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-error)' }}>Revoke Agent Agreement</h3>
              <button onClick={() => setRevokingAgreement(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to revoke/terminate the agreement for <strong>{revokingAgreement.profiles?.full_name}</strong> (No: {revokingAgreement.agreement_no})?
              Once revoked, the agreement QR code will no longer verify on the website.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!revocationReason.trim()) return;
              setRevokingLoading(true);

              try {
                const { error } = await supabase
                  .from('agent_agreements')
                  .update({
                    status: 'revoked',
                    revoked_at: new Date().toISOString(),
                    revocation_reason: revocationReason.trim()
                  })
                  .eq('id', revokingAgreement.id);

                if (error) {
                  alert('Failed to revoke agreement: ' + error.message);
                } else {
                  alert('Agreement revoked successfully.');
                  logAdminAction('Revoke Agreement', \`Revoked agreement \${revokingAgreement.agreement_no} for agent \${revokingAgreement.profiles?.full_name}. Reason: \${revocationReason.trim()}\`);
                  setRevokingAgreement(null);
                  setRevocationReason('');
                  await fetchAgreementsData();
                }
              } catch (err) {
                console.error(err);
                alert('Error revoking agreement.');
              } finally {
                setRevokingLoading(false);
              }
            }} style={{ display: 'grid', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Reason for Revocation / Termination</label>
                <textarea
                  className="input-field"
                  placeholder="Explain why this agreement is being terminated..."
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRevokingAgreement(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ background: '#ef4444', color: '#fff' }} disabled={revokingLoading}>
                  {revokingLoading ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Message Detail Modal */}`;

const replacements = [
  [targetStates, replacementStates],
  [targetFetchHelper, replacementFetchHelper],
  [targetFetchAll, replacementFetchAll],
  [targetTabs1, replacementTabs1],
  [targetTabs2, replacementTabs2],
  [targetTabs3, replacementTabs3],
  [targetPanel, replacementPanel],
  [targetDrawerLock, replacementDrawerLock],
  [targetModalAppend, replacementModalAppend]
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
  console.log('Successfully updated admin/page.js with Agent Agreements tabs and views!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
