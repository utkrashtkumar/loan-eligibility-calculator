const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/components/Header.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `            <li>
              <Link href="/check" className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                Check Eligibility
              </Link>
            </li>`;

const replacement = `            <li>
              <Link href="/check" className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                Check Eligibility
              </Link>
            </li>
            <li>
              <Link href="/#emi-calculator" className="nav-link" style={{ marginLeft: '12px' }}>
                EMI Calculator
              </Link>
            </li>`;

const hasCRLF = content.includes('\r\n');
const normalizedTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
const normalizedReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added EMI Calculator to Header.js desktop navigation!');
} else {
  console.error('Target Check Eligibility list item not found in Header.js!');
}
