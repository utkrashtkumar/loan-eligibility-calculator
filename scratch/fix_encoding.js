const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const srcDir = path.resolve(__dirname, '../src');

walk(srcDir, (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace common corrupted UTF-8 encodings
    content = content.replace(/â‚¹/g, '₹');
    content = content.replace(/âš /g, '⚠️');
    content = content.replace(/âœ“/g, '✓');
    content = content.replace(/Ã—/g, '×');

    // Replace literal dollar signs used for currency (e.g. $1000, $500, but not template strings ${...})
    // Let's replace any single '$' not followed by '{' that is adjacent to a number or inside text
    // E.g. $ 500 or $500 or $ 10,000
    content = content.replace(/\$(?!\s*\{)(?=\s*\d)/g, '₹');

    if (content !== original) {
      console.log(`Fixing encoding/symbols in: ${path.relative(srcDir, file)}`);
      fs.writeFileSync(file, content, 'utf8');
    }
  });
});
