const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('s:\\calculator\\loan-checker\\src');

console.log('Query lines found:');
files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(".from('bank_policies')") || line.includes(".from('bank_pincodes')") || line.includes('.from("bank_policies")') || line.includes('.from("bank_pincodes")')) {
        console.log(`- ${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
