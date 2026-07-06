const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/api/agent-approval/route.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `    // Try sending with standard verified domain sender
    let sender = 'HandToHand Loans <noreply@handtohandloans.com>';`;

const replacement = `    // Try sending with standard verified domain sender
    let sender = 'HandToHand Loans <noreply@handtohandloans.in>';`;

const hasCRLF = content.includes('\r\n');
const normalizedTarget = hasCRLF ? target.replace(/\n/g, '\r\n') : target;
const normalizedReplacement = hasCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated sender domain to handtohandloans.in!');
} else {
  console.error('Target sender configuration not found in route.js!');
}
