const fs = require('fs');

const filePath = 'S:/calculator/loan-checker/src/app/admin/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const handleApproveAgent = async (agentId) => {')) {
    startIndex = i;
  }
  // We want to find the end of handleRejectAgent!
  // The structure of handleRejectAgent:
  //   const handleRejectAgent = async (agentId) => {
  //     ...
  //     try {
  //       ...
  //     } finally {
  //       setAgentActionLoading(null);
  //     }
  //   };
  // Since it is right after handleApproveAgent, the SECOND occurrence of that finally block closing bracket will be the end of handleRejectAgent!
  if (startIndex !== -1 && i > startIndex && lines[i].trim() === '};' && lines[i-1].trim() === '}' && lines[i-2].trim() === 'setAgentActionLoading(null);') {
    // This is the first occurrence (end of handleApproveAgent). Let's keep scanning to find the second occurrence.
    for (let k = i + 1; k < i + 100; k++) {
      if (lines[k] && lines[k].trim() === '};' && lines[k-1].trim() === '}' && lines[k-2].trim() === 'setAgentActionLoading(null);') {
        endIndex = k;
        break;
      }
    }
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found approval and rejection functions block from line ${startIndex + 1} to ${endIndex + 1}`);
  
  const replacement = `  const handleApproveAgent = async (agent) => {
    const agentId = agent.id;
    setAgentActionLoading(agentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true, demoted_at: null, profile_update_message: null })
        .eq('id', agentId);

      if (error) {
        alert('Approval failed: ' + error.message);
      } else {
        logAdminAction('Approve Agent', \`Approved agent ID: \${agentId}\`);
        await fetchAgentsData();
        
        // Trigger approval email in background
        fetch('/api/agent-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent.full_name,
            agentEmail: agent.email,
            action: 'approved'
          })
        }).catch(err => console.error('Failed to send approval email:', err));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRejectAgent = async (agent) => {
    const agentId = agent.id;
    const reason = prompt('Enter reason for rejecting this agent (this will be shown to the user upon login):', 'Your document details were invalid.');
    if (reason === null) return; // user cancelled prompt
    
    setAgentActionLoading(agentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          approved: false, 
          profile_update_message: 'REJECTED: ' + (reason.trim() || 'No specific reason provided.') 
        })
        .eq('id', agentId);

      if (error) {
        alert('Rejection failed: ' + error.message);
      } else {
        alert('Agent registration rejected.');
        logAdminAction('Reject Agent', \`Rejected agent ID: \${agentId}. Reason: \${reason}\`);
        await fetchAgentsData();
        
        // Trigger rejection email in background
        fetch('/api/agent-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: agent.full_name,
            agentEmail: agent.email,
            action: 'rejected',
            reason: reason.trim()
          })
        }).catch(err => console.error('Failed to send rejection email:', err));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAgentActionLoading(null);
    }
  };`;

  console.log('Replacing functions block...');
  lines.splice(startIndex, (endIndex - startIndex + 1), replacement);
  content = lines.join(content.includes('\r\n') ? '\r\n' : '\n');
} else {
  console.error(`Could not locate functions block! startIndex=${startIndex}, endIndex=${endIndex}`);
}

// 2. Replace the invocations
content = content.replace(/handleApproveAgent\(sa\.id\)/g, 'handleApproveAgent(sa)');
content = content.replace(/handleRejectAgent\(sa\.id\)/g, 'handleRejectAgent(sa)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed update of admin/page.js!');
