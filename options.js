import browser from "webextension-polyfill";

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", restoreOptions);

// Get DOM elements
const maxTabsInput = document.getElementById("maxTabsInput");
const saveButton = document.getElementById("saveButton");
const statusElement = document.getElementById("status");

// Add event listeners
saveButton.addEventListener("click", saveOptions);
maxTabsInput.addEventListener("keydown", handleKeyPress);

/**
 * Load saved options from storage and populate the form
 */
function restoreOptions() {
  browser.storage.local.get("maxTabs").then((result) => {
    // If there's a stored value, use it; otherwise, default to 3
    let savedValue = result.maxTabs !== undefined ? result.maxTabs : 3;
    
    // Ensure it's a valid number
    if (isNaN(savedValue) || savedValue < 1) {
      savedValue = 3;
    }
    
    maxTabsInput.value = savedValue;
  }).catch(error => {
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
  browser.storage.local.set({ maxTabs: newMaxTabs }).then(() => {
    showStatus(`Tab limit set to ${newMaxTabs}.`);
  }).catch(error => {
    console.error("Error saving settings:", error);
    showStatus("Error saving settings. Please try again.", true);
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
