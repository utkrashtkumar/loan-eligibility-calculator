const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = 'const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);';
const replacement = 'const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);\n  const [auditSearchTerm, setAuditSearchTerm] = useState(\'\');';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added auditSearchTerm state to admin/page.js!');
} else {
  console.error('Target state definition not found!');
}
