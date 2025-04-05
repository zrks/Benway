/**
 * Benway - Popup Script
 * 
 * This script handles the functionality of the browser action popup
 * that displays current tab count and provides access to settings.
 */

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  updateTabStatus();
  setupEventListeners();
});

/**
 * Update the displayed tab status
 */
async function updateTabStatus() {
  try {
    // Get current window tabs and stored tab limit in parallel
    const [tabs, storageResult] = await Promise.all([
      browser.tabs.query({ currentWindow: true }),
      browser.storage.local.get("maxTabs")
    ]);
    
    const maxTabs = storageResult.maxTabs !== undefined ? storageResult.maxTabs : 3;
    const tabCount = tabs.length;
    
    // Update the status display
    const statusElement = document.getElementById("status");
    updateStatusDisplay(statusElement, tabCount, maxTabs);
    
  } catch (error) {
    console.error("Error updating tab status:", error);
    document.getElementById("status").textContent = "Error loading tab information";
  }
}

/**
 * Update the status display element
 * @param {HTMLElement} statusElement - The status element to update
 * @param {number} tabCount - Current number of tabs
 * @param {number} maxTabs - Maximum allowed tabs
 */
function updateStatusDisplay(statusElement, tabCount, maxTabs) {
  // Update text
  statusElement.textContent = `You have ${tabCount} tabs open in this window. Limit: ${maxTabs}`;
  
  // Reset classes
  statusElement.classList.remove("limit-warning", "limit-reached");
  
  // Apply appropriate class based on tab count
  if (tabCount >= maxTabs) {
    statusElement.classList.add("limit-reached");
    addWarningMessage(tabCount, maxTabs);
  } else if (tabCount >= maxTabs - 1) {
    statusElement.classList.add("limit-warning");
  }
}

/**
 * Add additional warning message when at/over limit
 * @param {number} tabCount - Current number of tabs
 * @param {number} maxTabs - Maximum allowed tabs
 */
function addWarningMessage(tabCount, maxTabs) {
  const warningContainer = document.createElement('div');
  warningContainer.id = 'limit-warning-message';
  warningContainer.style.cssText = `
    padding: 8px;
    margin-top: 10px;
    background-color: #ffebee;
    border-radius: 4px;
    font-size: 12px;
    color: #c62828;
  `;
  
  if (tabCount > maxTabs) {
    warningContainer.textContent = `You are ${tabCount - maxTabs} tab(s) over your limit. New tabs will be closed automatically.`;
  } else {
    warningContainer.textContent = "You've reached your tab limit. New tabs will be closed automatically.";
  }
  
  // Remove existing warning if present
  const existingWarning = document.getElementById('limit-warning-message');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  // Insert after status element
  const statusElement = document.getElementById("status");
  statusElement.parentNode.insertBefore(warningContainer, statusElement.nextSibling);
}

/**
 * Set up event listeners for buttons
 */
function setupEventListeners() {
  // Settings links
  const settingsLinks = document.querySelectorAll("#settings, #big-settings-button");
  settingsLinks.forEach(link => {
    link.addEventListener("click", openSettings);
  });
  
  // Add refresh button listener if present
  const refreshButton = document.getElementById("refresh-status");
  if (refreshButton) {
    refreshButton.addEventListener("click", updateTabStatus);
  }
}

/**
 * Open the settings page
 */
function openSettings() {
  browser.runtime.openOptionsPage()
    .then(() => {
      // Close the popup when settings open
      window.close();
    })
    .catch(error => {
      console.error("Error opening settings:", error);
      // Try alternative method
      browser.runtime.sendMessage({ action: 'openSettings' })
        .catch(() => {
          console.error("Failed to open settings page");
        });
    });
}
