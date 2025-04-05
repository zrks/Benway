/**
 * Benway - Options Script
 * 
 * This script manages the extension's options page functionality,
 * allowing users to configure their tab limit.
 */

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", initOptionsPage);

// Get DOM elements
const maxTabsInput = document.getElementById("maxTabsInput");
const saveButton = document.getElementById("saveButton");
const statusElement = document.getElementById("status");

/**
 * Initialize the options page
 */
function initOptionsPage() {
  // Restore saved options
  restoreOptions(); 
  
  // Add event listeners
  saveButton.addEventListener("click", saveOptions);
  maxTabsInput.addEventListener("keydown", handleKeyPress);
  
  // Add input validation
  maxTabsInput.addEventListener("input", validateInput);
}

/**
 * Input validation for the tab limit field
 */
function validateInput() {
  const value = parseInt(maxTabsInput.value, 10);
  
  if (isNaN(value) || value < 1 || value > 100) {
    maxTabsInput.classList.add("invalid");
    saveButton.disabled = true;
  } else {
    maxTabsInput.classList.remove("invalid");
    saveButton.disabled = false;
  }
}

/**
 * Load saved options from storage and populate the form
 */
function restoreOptions() {
  browser.storage.local.get("maxTabs")
    .then((result) => {
      // Default to 3 if no value is found or value is invalid
      let savedValue = result.maxTabs !== undefined ? result.maxTabs : 3;
      
      // Validate the saved value
      if (isNaN(savedValue) || savedValue < 1) {
        savedValue = 3;
      }
      
      maxTabsInput.value = savedValue;
      validateInput();
    })
    .catch(error => {
      console.error("Error loading settings:", error);
      showStatus("Error loading settings. Using default value (3).", true);
      maxTabsInput.value = 3;
    });
}

/**
 * Save options to storage
 */
function saveOptions() {
  const newMaxTabs = parseInt(maxTabsInput.value, 10);

  // Validate input
  if (isNaN(newMaxTabs)) {
    showStatus("Please enter a valid number.", true);
    return;
  }

  if (newMaxTabs < 1) {
    showStatus("Please enter a value of 1 or greater.", true);
    return;
  }
  
  if (newMaxTabs > 100) {
    showStatus("Please enter a value of 100 or less.", true);
    return;
  }

  // Save the value
  browser.storage.local.set({ maxTabs: newMaxTabs })
    .then(() => {
      showStatus(`Tab limit set to ${newMaxTabs}.`);
      
      // Optionally notify current tabs of the change
      notifyTabsOfUpdate(newMaxTabs);
    })
    .catch(error => {
      console.error("Error saving settings:", error);
      showStatus("Error saving settings. Please try again.", true);
    });
}

/**
 * Notify open tabs of the settings update
 * @param {number} newMaxTabs - The new tab limit
 */
function notifyTabsOfUpdate(newMaxTabs) {
  // Optional: Notify active tabs that settings changed
  browser.tabs.query({})
    .then(tabs => {
      tabs.forEach(tab => {
        try {
          browser.tabs.sendMessage(tab.id, { 
            action: "settingsUpdated", 
            maxTabs: newMaxTabs 
          }).catch(() => {
            // Ignore errors - content script may not be loaded
          });
        } catch (e) {
          // Ignore errors for tabs where content script isn't loaded
        }
      });
    })
    .catch(err => {
      console.warn("Could not notify tabs of settings update:", err);
    });
}

/**
 * Allow Enter key to save options
 */
function handleKeyPress(event) {
  // Save when Enter key is pressed
  if (event.key === "Enter") {
    saveOptions();
  }
}

/**
 * Display status message to the user
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether this is an error message
 */
function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.display = "block";
  
  // Add/remove error class based on message type
  if (isError) {
    statusElement.classList.add("error");
  } else {
    statusElement.classList.remove("error");
  }
  
  // Automatically hide the message after a delay
  setTimeout(() => {
    statusElement.style.display = "none";
  }, 3000);
}
