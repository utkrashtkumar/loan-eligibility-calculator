const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/dashboard/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

// 1. Insert states around line 160
const targetStates = `  // Affiliate link pending status update modal state
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);`;

const replacementStates = `  // Agent Agreement State
  const [agreement, setAgreement] = useState(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState('');
  const [signingLoading, setSigningLoading] = useState(false);
  const [signingError, setSigningError] = useState('');
  const [signingSuccess, setSigningSuccess] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Affiliate link pending status update modal state
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);`;

// 2. Insert fetchAgreement helper function
const targetFetchHelper = `  const fetchAgentData = async (userId, agentCode) => {`;

const replacementFetchHelper = `  const fetchAgreement = async (userId) => {
    setAgreementLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_agreements')
        .select('*')
        .eq('agent_id', userId)
        .maybeSingle();

      if (!error && data) {
        setAgreement(data);
      } else {
        setAgreement(null);
      }
    } catch (e) {
      console.error('Error fetching agreement:', e);
    } finally {
      setAgreementLoading(false);
    }
  };

  const fetchAgentData = async (userId, agentCode) => {`;

// 3. Trigger fetchAgreement in useEffect
const targetUseEffect = `          if (prof.role === 'agent') {
            // Agent data fetching
            await fetchAgentData(session.user.id, prof.agent_code);`;

const replacementUseEffect = `          if (prof.role === 'agent') {
            // Agent data fetching
            await fetchAgentData(session.user.id, prof.agent_code);
            await fetchAgreement(session.user.id);`;

// 4. Add tab sidebar link
const targetSidebarTabs = `                        { 
                          id: 'leaderboard', 
                          label: 'Partner Leaderboard',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )
                        },
                      ].map((tab) => (`;

const replacementSidebarTabs = `                        { 
                          id: 'leaderboard', 
                          label: 'Partner Leaderboard',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )
                        },
                        { 
                          id: 'agreement', 
                          label: 'Agent Agreement',
                          icon: (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                          )
                        },
                      ].map((tab) => (`;

// 5. Add tab mobile title header option
const targetMobileTitleHeader = `                          {activeTab === 'profile' && 'Profile Code'}
                          {activeTab === 'applications' && 'Client Applications'}
                          {activeTab === 'earnings' && 'Earning & Referral'}
                          {activeTab === 'subagents' && 'Sub-agents'}`;

const replacementMobileTitleHeader = `                          {activeTab === 'profile' && 'Profile Code'}
                          {activeTab === 'applications' && 'Client Applications'}
                          {activeTab === 'earnings' && 'Earning & Referral'}
                          {activeTab === 'subagents' && 'Sub-agents'}
                          {activeTab === 'leaderboard' && 'Partner Leaderboard'}
                          {activeTab === 'agreement' && 'Agent Agreement'}`;

// 6. Add tab panel content
const targetTabPanel = `                            </div>
                          )}
                        </div>
                      )}`;

const replacementTabPanel = `                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'agreement' && (() => {
                        const completion = calculateCompletionPercentage();
                        
                        return (
                          <div className="form-card" style={{ display: 'grid', gap: '24px', backdropFilter: 'blur(20px)', border: 'var(--border-light)' }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, borderBottom: 'var(--border-subtle)', paddingBottom: '12px', marginBottom: 0 }}>
                              DSA Partner Agreement
                            </h2>

                            {agreementLoading ? (
                              <div style={{ padding: '48px', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                <p style={{ color: 'var(--color-text-secondary)' }}>Loading agreement details...</p>
                              </div>
                            ) : agreement ? (
                              /* Signed agreement display */
                              <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{
                                  background: agreement.status === 'active' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                  border: agreement.status === 'active' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                  padding: '20px',
                                  borderRadius: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '12px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Agreement Reference Number:</div>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--text-sm)' }}>{agreement.agreement_no}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Date Signed:</div>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{new Date(agreement.signed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justify-content: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Status:</div>
                                    <span style={{
                                      fontSize: '11px',
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontWeight: 800,
                                      background: agreement.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                      color: agreement.status === 'active' ? '#34d399' : '#f87171',
                                      textTransform: 'uppercase'
                                    }}>
                                      {agreement.status}
                                    </span>
                                  </div>
                                  {agreement.status !== 'active' && agreement.revocation_reason && (
                                    <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '10px', marginTop: '4px' }}>
                                      <div style={{ fontSize: 'var(--text-xs)', color: '#f87171', fontWeight: 600 }}>Termination Reason:</div>
                                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.5' }}>{agreement.revocation_reason}</p>
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                                  <button
                                    onClick={() => window.open(\`/agreement-print\`, \'_blank\')}
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                                  >
                                    Print / Save Agreement PDF
                                  </button>
                                </div>
                              </div>
                            ) : completion < 100 ? (
                              /* Blocked view: Profile not complete */
                              <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{
                                  background: \'rgba(245, 158, 11, 0.05)\',
                                  border: \'1px solid rgba(245, 158, 11, 0.25)\',
                                  padding: \'20px\',
                                  borderRadius: \'12px\',
                                  color: \'var(--color-text-secondary)\',
                                  lineHeight: \'1.6\'
                                }}>
                                  <h3 style={{ color: \'#f59e0b\', fontSize: \'var(--text-md)\', fontWeight: 700, display: \'flex\', alignItems: \'center\', gap: \'8px\', margin: \'0 0 8px 0\' }}>
                                    Profile Completion Required
                                  </h3>
                                  Before you can sign and generate the Direct Selling Agent (DSA) Partner Agreement, you must complete your agent profile. Currently, your profile is <strong>{completion}%</strong> complete.
                                </div>
                                <div>
                                  <div style={{ fontSize: \'var(--text-xs)\', fontWeight: 600, color: \'var(--color-text-tertiary)\', textTransform: \'uppercase\', marginBottom: \'8px\' }}>Missing Fields:</div>
                                  <div style={{ display: \'flex\', flexWrap: \'wrap\', gap: \'8px\' }}>
                                    {(() => {
                                      const fieldMap = [
                                        { key: \'full_name\', label: \'Full Name\' },
                                        { key: \'email\', label: \'Email Address\' },
                                        { key: \'phone\', label: \'Mobile Number\' },
                                        { key: \'dob\', label: \'Date of Birth\' },
                                        { key: \'fathers_name\', label: "Father&apos;s Name" },
                                        { key: \'current_address\', label: \'Current Address\' },
                                        { key: \'permanent_address\', label: \'Permanent Address\' },
                                        { key: \'pincode\', label: \'Pincode\' },
                                        { key: \'marital_status\', label: \'Marital Status\' },
                                        { key: \'avatar\', label: \'Profile Picture\' },
                                        { key: \'id_type\', label: \'ID Proof Type\' },
                                        { key: \'id_number\', label: \'ID Proof Number\' },
                                        { key: \'id_file\', label: \'ID Document File\' }
                                      ];
                                      return fieldMap.filter(f => !profileFormData[f.key] || profileFormData[f.key].toString().trim() === \'\').map(f => (
                                        <span key={f.key} style={{ fontSize: \'11px\', background: \'rgba(239, 68, 68, 0.08)\', border: \'1px solid rgba(239, 68, 68, 0.15)\', color: \'#ef4444\', padding: \'4px 10px\', borderRadius: \'12px\' }}>
                                          • {f.label}
                                        </span>
                                      ));
                                    })()}
                                  </div>
                                  <p style={{ fontSize: \'var(--text-xs)\', color: \'var(--color-text-tertiary)\', marginTop: \'16px\' }}>
                                    Please go to the <strong>Profile Code</strong> tab and fill out all missing details to unlock agreement generation.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              /* Active Sign Form */
                              <div style={{ display: \'grid\', gap: \'20px\' }}>
                                <div style={{ fontSize: \'var(--text-sm)\', color: \'var(--color-text-secondary)\', lineHeight: \'1.6\' }}>
                                  Please read the appointment agreement document carefully below. To sign and execute the agreement, scroll to the bottom, check the confirmation box, upload a scanned image of your signature, and submit.
                                </div>

                                <div style={{
                                  maxHeight: \'300px\',
                                  overflowY: \'scroll\',
                                  padding: \'20px\',
                                  background: \'rgba(0,0,0,0.25)\',
                                  border: \'var(--border-light)\',
                                  borderRadius: \'8px\',
                                  fontSize: \'11px\',
                                  lineHeight: \'1.7\',
                                  color: \'var(--color-text-secondary)\',
                                  textAlign: \'justify\'
                                }}>
                                  <h3 style={{ textAlign: \'center\', color: \'#fff\', fontSize: \'13px\', fontWeight: 800, marginBottom: \'16px\' }}>
                                    DIRECT SELLING AGENT (DSA) / LOAN AGENT / CONNECTOR APPOINTMENT AGREEMENT
                                  </h3>
                                  <p><strong>HandToHand Loans</strong>, a business engaged in loan distribution, financial services, customer acquisition and allied lending-support activities, having its registered/business office as per its official records (hereinafter referred to as the &quot;Company&quot;);</p>
                                  <p style={{ textAlign: \'center\', fontWeight: \'bold\', margin: \'12px 0\' }}>AND</p>
                                  <p>The individual / proprietorship / partnership / entity whose particulars are set out in the agent profile (hereinafter referred to as the &quot;Agent&quot; or &quot;DSA&quot;).</p>
                                  
                                  <h4 style={{ color: \'#fff\', fontWeight: 700, marginTop: \'16px\', marginBottom: \'8px\' }}>1. APPOINTMENT & STATUS OF THE AGENT</h4>
                                  <p>The Company hereby appoints the Agent as a Non-Exclusive Direct Selling Agent (DSA) / Lending Service Provider (LSP)-affiliated connector for the purpose of sourcing prospective customers for various loan products offered through HandToHand Loans and its partner Regulated Entities (banks/NBFCs), in accordance with the Reserve Bank of India (Digital Lending) Directions, 2025.</p>
                                  <p>The Agent shall act strictly as an Independent Contractor and shall not, under any circumstances, be deemed or construed to be an employee, partner, or agent of the Company. The Agent SHALL source loan customers in a fair, transparent, and non-coercive manner, and SHALL NOT approve, sanction, reject, or disburse any loan, nor sign any loan document on behalf of HandToHand Loans.</p>

                                  <h4 style={{ color: \'#fff\', fontWeight: 700, marginTop: \'16px\', marginBottom: \'8px\' }}>2. COMMISSION & PAYOUT</h4>
                                  <p>The Agent shall be entitled to commission only upon the successful disbursement of the loan directly into the borrower&apos;s verified bank account by the Regulated Entity, and not otherwise. No commission shall be payable merely for lead generation, customer registration, application submission, or document collection.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>3. EMI FOLLOW-UP RESPONSIBILITY</h4>
                                  <p>After successful loan disbursement, the Agent shall maintain reasonable customer follow-up for a period of six (6) months from the date of the first EMI, strictly within the bounds of the RBI&apos;s Fair Practices Code and the conduct norms applicable to recovery-related communication. The Agent shall not use any threat, coercion, or undue harassment.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>4. CUSTOMER CHARGES & UNAUTHORISED COLLECTIONS</h4>
                                  <p>The Agent shall not collect, demand, or receive any unauthorised fee, processing charge, commission, or security deposit from customers in the name of HandToHand Loans. Any unauthorised collection of money constitutes serious misconduct and results in immediate termination of the agreement.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>5. AGENT RESPONSIBILITIES & STANDARDS OF CONDUCT</h4>
                                  <p>The Agent shall follow all applicable Indian laws, rules, and regulatory requirements. The Agent shall not submit fake, forged, or fabricated documents, nor forge signatures of customers or Company officials.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>6. CONFIDENTIALITY & DATA PROTECTION</h4>
                                  <p>The Agent shall maintain strict confidentiality of all customer and Company information. Customer data constitutes &quot;personal data&quot; under the Digital Personal Data Protection Act, 2023 (DPDP Act). The Agent shall collect and process personal data only for specific, lawful purposes and with consent, and must delete or render data inaccessible immediately upon termination of this agreement.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>7. TERM & TERMINATION</h4>
                                  <p>This Agreement remains valid for one (1) year from the date of execution. Either party may terminate by giving thirty (30) days&apos; prior written notice. The Company may terminate this Agreement immediately and without notice in case of fraud, cheating, misrepresentation, data theft, or breach of confidentiality.</p>

                                  <h4 style={{ color: '#fff', fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>8. GOVERNING LAW & JURISDICTION</h4>
                                  <p>This Agreement is governed by the laws of India, including the Indian Contract Act, 1872. Any disputes shall be subject to the exclusive jurisdiction of the courts situated at Agra/Firozabad, Uttar Pradesh, India, and resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996.</p>
                                </div>

                                <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!agreeTerms || !signatureFile) return;
                                  setSigningLoading(true);
                                  setSigningError(\'\');
                                  setSigningSuccess(\'\');

                                  try {
                                    const codeNo = profile.agent_code || \'\';
                                    const formattedCode = codeNo.replace(\'H2H-\', \'\');
                                    const agreementNo = \`H2H-DSA-\${formattedCode || Math.floor(10000 + Math.random() * 90000)}\`;
                                    
                                    const { data, error } = await supabase
                                      .from(\'agent_agreements\')
                                      .insert({
                                        agent_id: profile.id,
                                        agreement_no: agreementNo,
                                        signature_base64: signatureFile,
                                        status: \'active\'
                                      })
                                      .select()
                                      .single();

                                    if (error) {
                                      setSigningError(error.message);
                                    } else {
                                      setSigningSuccess(\'Agreement signed and generated successfully!\');
                                      setAgreement(data);
                                    }
                                  } catch (err) {
                                    setSigningError(\'An unexpected error occurred. Please try again.\');
                                    console.error(err);
                                  } finally {
                                    setSigningLoading(false);
                                  }
                                }} style={{ display: \'grid\', gap: \'16px\' }}>
                                  
                                  <div style={{ display: \'flex\', alignItems: \'flex-start\', gap: \'8px\' }}>
                                    <input
                                      type="checkbox"
                                      id="agree_terms_chk"
                                      checked={agreeTerms}
                                      onChange={(e) => setAgreeTerms(e.target.checked)}
                                      style={{ marginTop: \'3px\', cursor: \'pointer\' }}
                                    />
                                    <label htmlFor="agree_terms_chk" style={{ fontSize: \'var(--text-xs)\', color: \'var(--color-text-secondary)\', cursor: \'pointer\', userSelect: \'none\', lineHeight: \'1.4\' }}>
                                      I confirm that I have read, understood, and agree to be bound by all the terms, conditions, code of conduct, and statutory guidelines of the appointment agreement.
                                    </label>
                                  </div>

                                  <div className="input-group">
                                    <label className="input-label">Upload Scanned Signature (JPEG / PNG)</label>
                                    <input
                                      type="file"
                                      accept="image/jpeg, image/png"
                                      className="input-field"
                                      onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (file.size > 1024 * 1024) {
                                          alert("Signature image must be under 1MB.");
                                          e.target.value = \'\';
                                          return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setSignatureFile(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      required={!signatureFile}
                                    />
                                    {signatureFile && (
                                      <div style={{ marginTop: \'10px\', display: \'flex\', flexDirection: \'column\', gap: \'6px\' }}>
                                        <div style={{ fontSize: \'10px\', color: \'var(--color-text-tertiary)\' }}>Signature Preview:</div>
                                        <div style={{
                                          background: \'#fff\',
                                          border: \'var(--border-subtle)\',
                                          padding: \'8px\',
                                          borderRadius: \'6px\',
                                          width: \'max-content\',
                                          display: \'flex\',
                                          alignItems: \'center\'
                                        }}>
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={signatureFile} alt="Uploaded Signature Preview" style={{ maxHeight: \'60px\', width: \'auto\' }} />
                                        </div>
                                        <button
                                          type="button"
                                          className="btn btn-secondary btn-sm"
                                          style={{ width: \'max-content\', padding: \'4px 10px\', fontSize: \'10px\' }}
                                          onClick={() => setSignatureFile(\'\')}
                                        >
                                          Clear Signature
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {signingError && <div style={{ padding: \'10px\', background: \'rgba(239, 68, 68, 0.1)\', border: \'1px solid rgba(239, 68, 68, 0.2)\', borderRadius: \'6px\', fontSize: \'var(--text-xs)\', color: \'var(--color-error)\' }}>{signingError}</div>}
                                  {signingSuccess && <div style={{ padding: \'10px\', background: \'rgba(16, 185, 129, 0.1)\', border: \'1px solid rgba(16, 185, 129, 0.2)\', borderRadius: \'6px\', fontSize: \'var(--text-xs)\', color: \'var(--color-success)\' }}>✓ {signingSuccess}</div>}

                                  <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    style={{ width: \'100%\', justifyContent: \'center\', marginTop: \'8px\' }}
                                    disabled={!agreeTerms || !signatureFile || signingLoading}
                                  >
                                    {signingLoading ? \'Generating Partner Agreement...\' : \'✍Generate & Sign Agreement\'}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}`;

const replacements = [
  [targetStates, replacementStates],
  [targetFetchHelper, replacementFetchHelper],
  [targetUseEffect, replacementUseEffect],
  [targetSidebarTabs, replacementSidebarTabs],
  [targetMobileTitleHeader, replacementMobileTitleHeader],
  [targetTabPanel, replacementTabPanel]
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
  console.log('Successfully updated dashboard/page.js with Agent Agreement flows!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
