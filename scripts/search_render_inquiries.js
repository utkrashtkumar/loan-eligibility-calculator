const fs = require('fs');

const content = fs.readFileSync('s:\\calculator\\loan-checker\\src\\app\\admin\\page.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('inquiries') || line.includes('Inquiries') || line.includes('inquiry') || line.includes('Inquiry')) {
    if (line.includes('map') || line.includes('filter') || line.includes('<th>') || line.includes('<h3>')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
