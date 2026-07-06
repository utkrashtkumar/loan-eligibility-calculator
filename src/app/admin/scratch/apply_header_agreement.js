const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/components/Header.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

// 1. Add desktop navigation link
const desktopTarget = `            <li>
              <Link href="/#emi-calculator" className="nav-link" style={{ marginLeft: '12px' }}>
                EMI Calculator
              </Link>
            </li>`;

const desktopReplacement = `            <li>
              <Link href="/#emi-calculator" className="nav-link" style={{ marginLeft: '12px' }}>
                EMI Calculator
              </Link>
            </li>
            <li>
              <Link href="/verify-agreement" className={\`nav-link \${isLinkActive('/verify-agreement') ? 'active' : ''}\`} style={{ marginLeft: '12px' }}>
                Verify Agreement
              </Link>
            </li>`;

// 2. Add mobile menu link
const mobileTarget = `        <Link href="/#emi-calculator" className="nav-link" onClick={closeMenu}>
          EMI Calculator
        </Link>`;

const mobileReplacement = `        <Link href="/#emi-calculator" className="nav-link" onClick={closeMenu}>
          EMI Calculator
        </Link>
        <Link href="/verify-agreement" className={\`nav-link \${isLinkActive('/verify-agreement') ? 'active' : ''}\`} onClick={closeMenu}>
          Verify Agent Agreement
        </Link>`;

const replacements = [
  [desktopTarget, desktopReplacement],
  [mobileTarget, mobileReplacement]
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
  console.log('Successfully updated Header.js navigation links for verification!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
