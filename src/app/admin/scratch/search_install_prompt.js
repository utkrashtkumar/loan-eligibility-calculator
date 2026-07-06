const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.agents') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`Found pattern in file: ${fullPath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(pattern.toLowerCase())) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('Searching for installation prompt...');
searchDir('S:/calculator/loan-checker', 'beforeinstallprompt');
searchDir('S:/calculator/loan-checker', 'install-prompt');
searchDir('S:/calculator/loan-checker', 'installapp');
searchDir('S:/calculator/loan-checker', 'deferredPrompt');
