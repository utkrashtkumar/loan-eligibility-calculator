const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/admin/page.js', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('isPolicyModalOpen &&') || line.includes('selectedPolicy ? \'Edit Policy\' : \'Add Policy\'')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // Print next 20 lines
    for (let i = idx; i < idx + 30; i++) {
      if (lines[i]) console.log(`  ${i+1}: ${lines[i]}`);
    }
  }
});
