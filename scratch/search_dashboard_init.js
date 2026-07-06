const fs = require('fs');
const content = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('useEffect') || line.includes('fetchInquiries') || line.includes('fetchAgentData')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
