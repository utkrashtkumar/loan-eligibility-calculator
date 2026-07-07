const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/page.js');
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to standard Unix \n
code = code.replace(/\r\n/g, '\n');

// 1. Relocate the Blog Modal
const modalStartStr = "{/* Modal for Creating / Editing Blogs */}";
const targetIndex = code.indexOf(modalStartStr);

if (targetIndex === -1) {
  console.error("Modal start comment not found!");
  process.exit(1);
}

// Find the start of that line
const modalStartIndex = code.lastIndexOf('\n', targetIndex) + 1;

// Find the end of the modal.
let modalEndIndex = -1;
let currentIndex = modalStartIndex;
while (true) {
  const matchIndex = code.indexOf("                      )}", currentIndex);
  if (matchIndex === -1) {
    break;
  }
  const nextPart = code.substr(matchIndex, 250);
  if (nextPart.includes("activeTab === 'agreements'")) {
    modalEndIndex = matchIndex + "                      )}".length;
    break;
  }
  currentIndex = matchIndex + 1;
}

if (modalEndIndex === -1) {
  console.error("Modal end not found!");
  process.exit(1);
}

const modalText = code.slice(modalStartIndex, modalEndIndex);

// Remove the modal from its current position
code = code.slice(0, modalStartIndex) + code.slice(modalEndIndex);

// Clean up the modal layout styles
const oldModalWrapper = `                      {/* Modal for Creating / Editing Blogs */}
                      {isBlogModalOpen && (
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(10px)',
                          zIndex: 999999,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '20px'
                        }}>
                          <div style={{
                            background: 'var(--color-bg-card)',
                            border: 'var(--border-light)',
                            borderRadius: 'var(--border-radius-lg)',
                            width: '100%',
                            maxWidth: '750px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: 'var(--shadow-xl)',
                            padding: '32px'
                          }}>`;

const newModalWrapper = `                      {/* Modal for Creating / Editing Blogs */}
                      {isBlogModalOpen && (
                        <div style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(10px)',
                          zIndex: 999999,
                          overflowY: 'auto',
                          padding: '40px 20px',
                          WebkitOverflowScrolling: 'touch'
                        }} onClick={() => setIsBlogModalOpen(false)}>
                          <div style={{
                            background: 'var(--color-bg-card)',
                            border: 'var(--border-light)',
                            borderRadius: 'var(--border-radius-lg)',
                            width: '100%',
                            maxWidth: '750px',
                            boxShadow: 'var(--shadow-xl)',
                            padding: '32px',
                            margin: '0 auto'
                          }} onClick={(e) => e.stopPropagation()}>`;

const cleanedModalText = modalText.replace(oldModalWrapper, newModalWrapper);

// Insert it right before "<Footer />"
const footerTag = "      <Footer />";
const footerIndex = code.lastIndexOf(footerTag);

if (footerIndex === -1) {
  console.error("Footer tag not found!");
  process.exit(1);
}

code = code.slice(0, footerIndex) + cleanedModalText + "\n\n" + code.slice(footerIndex);


// 2. Replace form-card custom padding styles in activeTab === 'blogs'
code = code.replace(
  "                  {activeTab === 'blogs' && (\n                    <div className=\"form-card\" style={{ padding: '24px', backdropFilter: 'blur(20px)' }}>",
  "                  {activeTab === 'blogs' && (\n                    <div className=\"form-card\">"
);


// 3. Add error checks to "Regenerate (Re-sign)" button inside agreements card list
const oldRegenAction = `                                // Create an approved admin-pushed regen request so the agent sees the re-sign prompt
                                await supabase.from('agreement_regen_requests').insert({
                                  agent_id: ag.agent_id,
                                  requested_by: 'admin',
                                  status: 'approved',
                                  admin_note: 'Agreement reset by administrator from ledger.',
                                });
                                alert("Agreement deleted successfully! The agent will now see a re-sign prompt on their dashboard.");
                                logAdminAction('Regenerate Agreement', \`Deleted agreement \${ag.agreement_no} for agent \${selectedAgent.full_name} to allow re-signing.\`);
                                await fetchAgreementsData();
                                await fetchRegenRequests();
                                handleSelectAgent(null);`;

const newRegenAction = `                                // Create an approved admin-pushed regen request so the agent sees the re-sign prompt
                                const { error: insertErr } = await supabase.from('agreement_regen_requests').insert({
                                  agent_id: ag.agent_id,
                                  requested_by: 'admin',
                                  status: 'approved',
                                  admin_note: 'Agreement reset by administrator from ledger.',
                                });
                                if (insertErr) {
                                  alert("Agreement was deleted, but failed to create re-sign request record: " + insertErr.message);
                                } else {
                                  alert("Agreement deleted successfully! The agent will now see a re-sign prompt on their dashboard.");
                                  logAdminAction('Regenerate Agreement', \`Deleted agreement \${ag.agreement_no} for agent \${selectedAgent.full_name} to allow re-signing.\`);
                                }
                                await fetchAgreementsData();
                                await fetchRegenRequests();
                                handleSelectAgent(null);`;

if (!code.includes(oldRegenAction)) {
  console.error("Old regen action not found!");
} else {
  code = code.replace(oldRegenAction, newRegenAction);
}


// 4. Add error checks to "✅ Approve" inside regen request management
const oldApproveAction = `                                    // Approve: delete current agreement + mark request approved
                                    await supabase.from('agent_agreements').delete().eq('agent_id', req.agent_id);
                                    const { error } = await supabase.from('agreement_regen_requests')
                                      .update({ status: 'approved', admin_note: regenAdminNote || null, resolved_at: new Date().toISOString() })
                                      .eq('id', req.id);`;

const newApproveAction = `                                    // Approve: delete current agreement + mark request approved
                                    const { error: delError } = await supabase.from('agent_agreements').delete().eq('agent_id', req.agent_id);
                                    if (delError) { alert('Failed to delete existing agreement: ' + delError.message); return; }
                                    const { error } = await supabase.from('agreement_regen_requests')
                                      .update({ status: 'approved', admin_note: regenAdminNote || null, resolved_at: new Date().toISOString() })
                                      .eq('id', req.id);`;

if (!code.includes(oldApproveAction)) {
  console.error("Old approve action not found!");
} else {
  code = code.replace(oldApproveAction, newApproveAction);
}


// 5. Add error checks to "🔄 Push Re-sign Request to Agent"
const oldPushAction = `                          // Delete current agreement
                          await supabase.from('agent_agreements').delete().eq('agent_id', selectedAgent.id);
                          // Create an approved admin-pushed regen request
                          await supabase.from('agreement_regen_requests').insert({
                            agent_id: selectedAgent.id,
                            requested_by: 'admin',
                            status: 'approved',
                            admin_note: regenAdminNote || null,
                          });
                          logAdminAction('Admin Push Re-sign', \`Pushed re-sign request to agent \${selectedAgent?.full_name}.\`);
                          setRegenAdminNote('');
                          await fetchRegenRequests();
                          await fetchAgreementsData();
                          alert(\`Re-sign request pushed to \${selectedAgent?.full_name}. They will see a prompt to re-sign on their dashboard.\`);`;

const newPushAction = `                          // Delete current agreement
                          const { error: delError } = await supabase.from('agent_agreements').delete().eq('agent_id', selectedAgent.id);
                          if (delError) {
                            alert('Failed to delete existing agreement: ' + delError.message);
                            return;
                          }
                          // Create an approved admin-pushed regen request
                          const { error: insertErr } = await supabase.from('agreement_regen_requests').insert({
                            agent_id: selectedAgent.id,
                            requested_by: 'admin',
                            status: 'approved',
                            admin_note: regenAdminNote || null,
                          });
                          if (insertErr) {
                            alert('Failed to create re-sign request: ' + insertErr.message);
                            return;
                          }
                          logAdminAction('Admin Push Re-sign', \`Pushed re-sign request to agent \${selectedAgent?.full_name}.\`);
                          setRegenAdminNote('');
                          await fetchRegenRequests();
                          await fetchAgreementsData();
                          alert(\`Re-sign request pushed to \${selectedAgent?.full_name}. They will see a prompt to re-sign on their dashboard.\`);`;

if (!code.includes(oldPushAction)) {
  console.error("Old push action not found!");
} else {
  code = code.replace(oldPushAction, newPushAction);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("Successfully patched admin panel code with all modal, style, and error checking fixes!");
