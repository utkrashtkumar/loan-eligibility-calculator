const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/banks/page.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('supabase') || line.includes('from(') || line.includes('select(')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
