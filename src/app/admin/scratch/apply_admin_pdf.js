const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');
const lineEnding = hasCRLF ? '\r\n' : '\n';

// 1. Update initial state
const stateTarget = `  const [policyForm, setPolicyForm] = useState({
    bank_name: '',
    loan_type: 'PL',
    min_salary: 25000,
    min_cibil: 650,
    foir_max: 55,
    min_age: 21,
    max_age: 60,
    company_category: 'ALL TYPES',
    pf_required: 'No',
    min_experience: '1 Year',
    min_residence_stability: '1 Year',
    all_pincodes: true,
    special_notes: '',
    logo_url: '',
    employment_type: 'salaried',
    policy_category: 'salary'
  });`;

const stateReplacement = `  const [policyForm, setPolicyForm] = useState({
    bank_name: '',
    loan_type: 'PL',
    min_salary: 25000,
    min_cibil: 650,
    foir_max: 55,
    min_age: 21,
    max_age: 60,
    company_category: 'ALL TYPES',
    pf_required: 'No',
    min_experience: '1 Year',
    min_residence_stability: '1 Year',
    all_pincodes: true,
    special_notes: '',
    logo_url: '',
    employment_type: 'salaried',
    policy_category: 'salary',
    policy_pdf: ''
  });`;

// 2. Update handleOpenAddPolicy
const addTarget = `    setPolicyForm({
      bank_name: '',
      loan_type: activePolicyCategory === 'business' ? 'BL' : 'PL',
      min_salary: 25000,
      min_cibil: 650,
      foir_max: 55,
      min_age: 21,
      max_age: 60,
      company_category: 'ALL TYPES',
      pf_required: 'No',
      min_experience: '1 Year',
      min_residence_stability: '1 Year',
      all_pincodes: true,
      special_notes: '',
      logo_url: '',
      apply_url: '',
      portal_username: '',
      portal_password: '',
      direct_submit: false,
      employment_type: activePolicyCategory === 'salary' ? 'salaried' : 'self_employed',
      policy_category: activePolicyCategory
    });`;

const addReplacement = `    setPolicyForm({
      bank_name: '',
      loan_type: activePolicyCategory === 'business' ? 'BL' : 'PL',
      min_salary: 25000,
      min_cibil: 650,
      foir_max: 55,
      min_age: 21,
      max_age: 60,
      company_category: 'ALL TYPES',
      pf_required: 'No',
      min_experience: '1 Year',
      min_residence_stability: '1 Year',
      all_pincodes: true,
      special_notes: '',
      logo_url: '',
      apply_url: '',
      portal_username: '',
      portal_password: '',
      direct_submit: false,
      employment_type: activePolicyCategory === 'salary' ? 'salaried' : 'self_employed',
      policy_category: activePolicyCategory,
      policy_pdf: ''
    });`;

// 3. Update handleOpenEditPolicy
const editTarget = `    setPolicyForm({
      bank_name: policy.bank_name,
      loan_type: policy.loan_type,
      min_salary: policy.min_salary,
      min_cibil: policy.min_cibil,
      foir_max: policy.foir_max,
      min_age: policy.min_age,
      max_age: policy.max_age,
      company_category: policy.company_category || 'ALL TYPES',
      pf_required: policy.pf_required || 'No',
      min_experience: policy.min_experience || '1 Year',
      min_residence_stability: policy.min_residence_stability || '1 Year',
      all_pincodes: policy.all_pincodes !== false,
      special_notes: policy.special_notes || '',
      logo_url: policy.logo_url || '',
      apply_url: policy.apply_url || '',
      portal_username: policy.portal_username || '',
      portal_password: policy.portal_password || '',
      direct_submit: policy.direct_submit === true,
      employment_type: policy.employment_type || 'salaried',
      policy_category: policy.policy_category || 'salary'
    });`;

const editReplacement = `    setPolicyForm({
      bank_name: policy.bank_name,
      loan_type: policy.loan_type,
      min_salary: policy.min_salary,
      min_cibil: policy.min_cibil,
      foir_max: policy.foir_max,
      min_age: policy.min_age,
      max_age: policy.max_age,
      company_category: policy.company_category || 'ALL TYPES',
      pf_required: policy.pf_required || 'No',
      min_experience: policy.min_experience || '1 Year',
      min_residence_stability: policy.min_residence_stability || '1 Year',
      all_pincodes: policy.all_pincodes !== false,
      special_notes: policy.special_notes || '',
      logo_url: policy.logo_url || '',
      apply_url: policy.apply_url || '',
      portal_username: policy.portal_username || '',
      portal_password: policy.portal_password || '',
      direct_submit: policy.direct_submit === true,
      employment_type: policy.employment_type || 'salaried',
      policy_category: policy.policy_category || 'salary',
      policy_pdf: policy.policy_pdf || ''
    });`;

// 4. Update the Table Headers (add PDF header)
const thTarget = `                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Pincodes</th>`;
const thReplacement = `                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Pincodes</th>
                                  <th style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>PDF</th>`;

// 5. Update the Table Cells (add PDF cell)
const tdTarget = `                                    <td data-label="Pincodes" style={{ padding: '12px 10px' }}>
                                      {policy.all_pincodes ? (
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '11px' }}>All India</span>
                                      ) : (
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '11px' }}>Limited</span>
                                      )}
                                    </td>`;

const tdReplacement = `                                    <td data-label="Pincodes" style={{ padding: '12px 10px' }}>
                                      {policy.all_pincodes ? (
                                        <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '11px' }}>All India</span>
                                      ) : (
                                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '11px' }}>Limited</span>
                                      )}
                                    </td>
                                    <td data-label="PDF" style={{ padding: '12px 10px' }}>
                                      {policy.policy_pdf ? (
                                        <span 
                                          style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }} 
                                          onClick={() => {
                                            const base64Data = policy.policy_pdf;
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
                                          View PDF
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>None</span>
                                      )}
                                    </td>`;

// 6. Update the Modal Form input
const formTarget = `                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-card)', padding: '12px 16px', borderRadius: '12px', border: 'var(--border-subtle)' }}>`;
const formReplacement = `                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Upload Bank Policy & Process Flow PDF
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: 'var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            alert('PDF file size must be under 2MB.');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPolicyForm(prev => ({ ...prev, policy_pdf: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }}
                        style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                      />
                    </div>
                    {policyForm.policy_pdf && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ margin: 0, padding: '6px 12px', fontSize: '11px' }}
                          onClick={() => {
                            const base64Data = policyForm.policy_pdf;
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
                          👁Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ margin: 0, padding: '6px 12px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                          onClick={() => {
                            setPolicyForm(prev => ({ ...prev, policy_pdf: '' }));
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-bg-card)', padding: '12px 16px', borderRadius: '12px', border: 'var(--border-subtle)' }}>`;

const replacements = [
  [stateTarget, stateReplacement],
  [addTarget, addReplacement],
  [editTarget, editReplacement],
  [thTarget, thReplacement],
  [tdTarget, tdReplacement],
  [formTarget, formReplacement]
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
  console.log('Successfully completed update of admin/page.js with PDF options!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
