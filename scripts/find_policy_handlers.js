const fs = require('fs');

const content = fs.readFileSync('s:\\calculator\\loan-checker\\src\\app\\admin\\page.js', 'utf8');
const lines = content.split('\n');

console.log('Occurrences of edit or open policy modal:');
lines.forEach((line, idx) => {
  if (line.includes('setSelectedPolicy') || line.includes('setPolicyForm') || line.includes('handleEdit') || line.includes('openPolicy')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
