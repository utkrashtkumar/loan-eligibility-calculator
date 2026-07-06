const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && f !== 'node_modules' && f !== '.next' && f !== '.git') {
      walkDir(dirPath, callback);
    } else if (!isDirectory && (f.endsWith('.js') || f.endsWith('.jsx'))) {
      callback(dirPath);
    }
  });
}

walkDir(path.resolve(__dirname, '../src'), filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('create-qr-code')) {
    console.log(`Found create-qr-code in: ${filePath}`);
  }
});
