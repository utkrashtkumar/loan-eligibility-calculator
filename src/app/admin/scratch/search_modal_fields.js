const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/admin/page.js', 'utf8');
const lines = code.split('\n');

console.log('Searching for policy form fields in modal:');
for (let i = 3815; i < 4200; i++) {
  const line = lines[i];
  if (line.includes('special_notes') || line.includes('logo_url') || line.includes('all_pincodes')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
