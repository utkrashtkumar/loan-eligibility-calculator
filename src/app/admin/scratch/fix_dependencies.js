const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

// Let us split by lines (supporting both CRLF and LF)
const lines = content.split(/\r?\n/);

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('auto-inject')) {
    console.log(`Found auto-inject at line ${i + 1}`);
    // Find the dependencies block starting at the end of the hook
    for (let j = i; j < i + 50; j++) {
      if (lines[j] && (lines[j].includes('}, [') || lines[j].includes('},['))) {
        startIndex = j;
      }
      if (startIndex !== -1 && lines[j] && lines[j].trim() === ']);') {
        endIndex = j;
        break;
      }
    }
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found dependency array from line ${startIndex + 1} to ${endIndex + 1}`);
  
  const replacement = `  }, [
    activeTab, 
    loading, 
    inquiries, 
    activeAgents, 
    pendingAgents, 
    demotedUsers, 
    applications, 
    payoutRequests, 
    policies, 
    contactMessages,
    auditLogs,
    auditSearchTerm,
    searchTerm,
    contactSearch,
    pincodeSearchTerm,
    loanTypeFilter,
    sortBy,
    appStatusFilter,
    activePolicyCategory
  ]);`;

  console.log('Replacing content:');
  for (let k = startIndex; k <= endIndex; k++) {
    console.log(`${k+1}: ${lines[k]}`);
  }
  
  // Replace the lines array
  lines.splice(startIndex, (endIndex - startIndex + 1), replacement);
  
  const hasCRLF = content.includes('\r\n');
  fs.writeFileSync(filePath, lines.join(hasCRLF ? '\r\n' : '\n'), 'utf8');
  console.log('Successfully updated dependencies in admin/page.js!');
} else {
  console.error(`Could not locate dependency array! startIndex=${startIndex}, endIndex=${endIndex}`);
}
