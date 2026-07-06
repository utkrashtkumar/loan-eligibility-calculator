const fs = require('fs');

const files = [
  'S:/calculator/loan-checker/src/app/dashboard/page.js',
  'S:/calculator/loan-checker/src/app/check/page.js',
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const code = fs.readFileSync(file, 'utf8');
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('data-label') || line.toLowerCase().includes('auto-inject')) {
        console.log(`${file} Line ${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
