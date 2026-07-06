const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/components/PWAInstallPrompt.js';
let content = fs.readFileSync(filePath, 'utf8');

const hasCRLF = content.includes('\r\n');

const replacements = [
  [
    `            background:
              'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.97) 100%)',`,
    `            background:
              'linear-gradient(135deg, rgba(10,15,30,0.97) 0%, rgba(13,22,39,0.97) 100%)',`
  ],
  [
    `            border: '1px solid rgba(99,102,241,0.4)',`,
    `            border: '1px solid rgba(16,185,129,0.35)',`
  ],
  [
    `            boxShadow:
              '0 -4px 40px rgba(99,102,241,0.25), 0 20px 60px rgba(0,0,0,0.5)',`,
    `            boxShadow:
              '0 -4px 40px rgba(16,185,129,0.18), 0 20px 60px rgba(0,0,0,0.5)',`
  ],
  [
    `                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',`,
    `                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',`
  ],
  [
    `                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.2)',`,
    `                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',`
  ],
  [
    `                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',`,
    `                background: 'rgba(16,185,129,0.05)',
                border: '1px solid rgba(16,185,129,0.12)',`
  ],
  [
    `              <strong style={{ color: '#a5b4fc' }}>To install on iPhone / iPad:</strong>`,
    `              <strong style={{ color: '#6ee7b7' }}>To install on iPhone / iPad:</strong>`
  ],
  [
    `                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',`,
    `                background: 'linear-gradient(135deg, #10b981, #059669)',`
  ],
  [
    `                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',`,
    `                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',`
  ],
  [
    `                e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.55)';`,
    `                e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.45)';`
  ],
  [
    `                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)';`,
    `                e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.3)';`
  ]
];

let replacedCount = 0;
replacements.forEach(([target, replacement]) => {
  const normTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
  const normReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  if (content.includes(normTarget)) {
    content = content.replace(normTarget, normReplacement);
    replacedCount++;
  } else {
    console.error(`Target not found: ${target.substring(0, 80)}...`);
  }
});

if (replacedCount === replacements.length) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated PWAInstallPrompt.js with emerald green theme!');
} else {
  console.error(`Only replaced ${replacedCount}/${replacements.length} segments!`);
}
