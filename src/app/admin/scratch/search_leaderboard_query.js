const fs = require('fs');
const code = fs.readFileSync('S:/calculator/loan-checker/src/app/dashboard/page.js', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('rpc(') || line.includes('leaderboard') || line.includes('setup-leaderboard-rpc.sql')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
