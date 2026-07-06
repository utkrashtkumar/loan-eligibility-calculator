const fs = require('fs');
const path = require('path');

let outputBuffer = [];
function log(msg) {
  console.log(msg);
  outputBuffer.push(msg);
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && f !== 'node_modules' && f !== '.next' && f !== '.git') {
      walkDir(dirPath, callback);
    } else if (!isDirectory && (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.css'))) {
      callback(dirPath);
    }
  });
}

log("Analyzing files...");
walkDir(path.resolve(__dirname, '../src'), filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Check 1: localStorage outside useEffect
  if (content.includes('localStorage') && !filePath.includes('lib/')) {
    lines.forEach((line, idx) => {
      if (line.includes('localStorage') && !line.includes('typeof window') && !line.includes('useEffect')) {
        log(`[localstorage] ${path.relative(path.resolve(__dirname, '..'), filePath)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  // Check 2: Supabase error handling missing check
  if (content.includes('supabase') && (content.includes('.select(') || content.includes('.update(') || content.includes('.insert('))) {
    lines.forEach((line, idx) => {
      if ((line.includes('from(') || line.includes('insert(') || line.includes('update(')) && !line.includes('error')) {
        // console.log(`[supabase-error-check] ${path.relative(path.resolve(__dirname, '..'), filePath)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  // Check 3: Potential null pointer dereference on state variables
  const nullPointerChecks = ['profile.', 'user.', 'agreement.', 'lead.', 'policy.'];
  nullPointerChecks.forEach(pattern => {
    if (content.includes(pattern)) {
      lines.forEach((line, idx) => {
        if (line.includes(pattern) && !line.includes('?.') && !line.includes('&&') && !line.includes('!') && !line.includes('typeof') && !line.includes('const') && !line.includes('let')) {
          if (!line.trim().startsWith('if') && !line.trim().startsWith('return') && !line.trim().startsWith('const') && !line.trim().startsWith('console.log')) {
             log(`[null-pointer] ${path.relative(path.resolve(__dirname, '..'), filePath)}:${idx + 1}: ${line.trim()}`);
          }
        }
      });
    }
  });
});

fs.writeFileSync(path.resolve(__dirname, 'bugs_report.txt'), outputBuffer.join('\n'));
log("Report saved to scratch/bugs_report.txt");
