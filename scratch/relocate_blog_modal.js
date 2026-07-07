const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/page.js');
let code = fs.readFileSync(filePath, 'utf8');

// Find the modal start
const modalStartStr = "                      {/* Modal for Creating / Editing Blogs */}";
const modalStartIndex = code.indexOf(modalStartStr);

if (modalStartIndex === -1) {
  console.error("Modal start comment not found!");
  process.exit(1);
}

// Find the end of the modal.
let modalEndIndex = -1;
let currentIndex = modalStartIndex;
while (true) {
  const matchIndex = code.indexOf("                      )}", currentIndex);
  if (matchIndex === -1) {
    break;
  }
  // Check if this is the correct closing brace
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

// Extract the modal text
const modalText = code.slice(modalStartIndex, modalEndIndex);

// Remove the modal from its current position
let updatedCode = code.slice(0, modalStartIndex) + code.slice(modalEndIndex);

// Now, insert the modal text right before the "<Footer />" tag at the very bottom
const footerTag = "      <Footer />";
const footerIndex = updatedCode.lastIndexOf(footerTag);

if (footerIndex === -1) {
  console.error("Footer tag not found!");
  process.exit(1);
}

// We will insert the modalText at footerIndex
updatedCode = updatedCode.slice(0, footerIndex) + modalText + "\n\n" + updatedCode.slice(footerIndex);

fs.writeFileSync(filePath, updatedCode, 'utf8');
console.log("Successfully relocated the blog modal to the root layout!");
