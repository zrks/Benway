/**
 * Tab Limiter - Background Script
 * 
 * This script handles the core functionality of limiting the number of tabs
 * in each Firefox window and showing notifications when the limit is reached.
 */

// Configuration
const DEFAULT_MAX_TABS = 3;
let maxTabs = DEFAULT_MAX_TABS;

// State tracking
const pendingTabChecks = new Set();
let openingOptionsPage = false;

// Get the settings page URL for comparison
const optionsUrl = browser.runtime.getURL("options.html");

/**
 * Load tab limit from storage
 */
function loadMaxTabsFromStorage() {
  browser.storage.local.get("maxTabs").then((result) => {
    if (result.maxTabs !== undefined && !isNaN(result.maxTabs)) {
      maxTabs = result.maxTabs;
    } else {
      maxTabs = DEFAULT_MAX_TABS; // fallback
    }
  }).catch(error => {
    console.error("Error loading tab limit from storage:", error);
    maxTabs = DEFAULT_MAX_TABS; // fallback on error
  });
}

/**
 * Check if a tab is loading the options page
 */
function isOptionsPage(tab) {
  return tab.url === optionsUrl || 
         tab.pendingUrl === optionsUrl || 
         (tab.url && tab.url.startsWith(optionsUrl));
}

/**
 * Show a notification when tab limit is reached
 */
async function showLimitReachedPopup() {
  try {
    // Get the active tab in the current window
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length === 0) return;
    
    const activeTab = activeTabs[0];
    
    // Try to send a message to the content script
    try {
      await browser.tabs.sendMessage(activeTab.id, { 
        action: 'showLimitPopup',
        maxTabs: maxTabs
      });
    } catch (error) {
      // Fallback to notification if content script communication fails
      browser.notifications.create({
        "type": "basic",
        "title": "Tab Limit Reached",
        "message": `You've reached the maximum of ${maxTabs} tabs in this window.`
      });
    }
  } catch (err) {
    // Fallback to notification if there's any error
    browser.notifications.create({
      "type": "basic",
      "title": "Tab Limit Reached",
      "message": `You've reached the maximum of ${maxTabs} tabs in this window.`
    });
  }
}

// ======== EVENT LISTENERS ========

/**
 * Listen for changes in storage
 */
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.maxTabs) {
    maxTabs = changes.maxTabs.newValue;
  }
});

/**
 * Listen for messages from the popup and content scripts
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSettings') {
    // Set flag before opening options page
    openingOptionsPage = true;
    
    // Use a slight delay to ensure the flag is set before the tab is created
    setTimeout(() => {
      browser.runtime.openOptionsPage().then(() => {
        // Reset flag after a short delay to allow the tab to be fully created
        setTimeout(() => {
          openingOptionsPage = false;
        }, 1000);
      }).catch(error => {
        console.error("Error opening options page:", error);
        openingOptionsPage = false;
      });
    }, 100);
    
    return Promise.resolve({success: true});
  }
  
  if (message.action === 'getMaxTabs') {
    return Promise.resolve({maxTabs: maxTabs});
  }

  return false; // For other messages
});

/**
 * Listen for tab updates
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If this tab is being checked for the options page and now has a URL
  if (pendingTabChecks.has(tabId) && changeInfo.url) {
    pendingTabChecks.delete(tabId);
    
    // Check if it's not the options page
    if (!isOptionsPage(tab)) {
      // Don't close if we're in the process of opening the options page
      if (openingOptionsPage) {
        return;
      }
      
      // Count the tabs in the window
      browser.tabs.query({ windowId: tab.windowId }).then(tabs => {
        if (tabs.length > maxTabs) {
          // Close this tab as it's over the limit and not the options page
          browser.tabs.remove(tabId);
          showLimitReachedPopup();
        }
      });
    }
  }
});

/**
 * Listen for newly created tabs
 */
browser.tabs.onCreated.addListener(async (tab) => {
  try {
    // If we're explicitly opening the options page, allow it
    if (openingOptionsPage) {
      return;
    }
    
    // Count only tabs in the current window
    const windowTabs = await browser.tabs.query({ windowId: tab.windowId });
    const windowTabCount = windowTabs.length;
    
    // If we're already at/over limit, we need to check if this is an options page
    if (windowTabCount > maxTabs) {
      // If tab URL is available and it's the options page, allow it
      if (isOptionsPage(tab)) {
        return; // Allow the options page to open
      }
      
      // If URL is not yet available, mark this tab for later checking
      if (!tab.url) {
        pendingTabChecks.add(tab.id);
        return; // Wait for the URL to become available
      }
      
      // Otherwise, close the tab and show notification
      await browser.tabs.remove(tab.id);
      showLimitReachedPopup();
    }
  } catch (err) {
    console.error("Error handling new tab:", err);
  }
});

// Initialize extension
loadMaxTabsFromStorage();