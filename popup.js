/**
 * Tab Limiter - Popup Script
 * 
 * This script handles the functionality of the browser action popup
 * that displays current tab count and provides access to settings.
 */

// import browser from "webextension-polyfill";

document.addEventListener("DOMContentLoaded", () => {
  updateTabStatus();
  setupEventListeners();
});

/**
 * Update the displayed tab status
 */
function updateTabStatus() {
  // Get the current window's tabs
  browser.tabs.query({ currentWindow: true })
    .then(tabs => {
      // Get the current tab limit
      return browser.storage.local.get("maxTabs")
        .then(result => {
          const maxTabs = result.maxTabs !== undefined ? result.maxTabs : 3;
          const tabCount = tabs.length;
          
          // Update the status display
          const statusElement = document.getElementById("status");
          statusElement.textContent = `You have ${tabCount} tabs open in this window. Limit: ${maxTabs}`;
          
          // Add visual indicators based on proximity to limit
          updateStatusStyle(statusElement, tabCount, maxTabs);
        });
    })
    .catch(error => {
      console.error("Error updating tab status:", error);
      document.getElementById("status").textContent = "Error loading tab information";
    });
}

/**
 * Apply visual styling based on tab count vs limit
 */
function updateStatusStyle(statusElement, tabCount, maxTabs) {
  // Reset classes
  statusElement.classList.remove("limit-warning", "limit-reached");
  
  // Apply appropriate class based on tab count
  if (tabCount >= maxTabs) {
    statusElement.classList.add("limit-reached");
  } else if (tabCount >= maxTabs - 1) {
    statusElement.classList.add("limit-warning");
  }
}

/**
 * Set up event listeners for buttons
 */
function setupEventListeners() {
  // Regular settings button
  document.getElementById("settings").addEventListener("click", openSettings);
  
  // Big settings button 
  const bigSettingsBtn = document.getElementById("big-settings-button");
  if (bigSettingsBtn) {
    bigSettingsBtn.addEventListener("click", openSettings);
  }
}

/**
 * Open the settings page
 */
function openSettings() {
  browser.runtime.openOptionsPage()
    .catch(() => {
      // Fail silently - user will see nothing happened
    });
}