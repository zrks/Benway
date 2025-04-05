/**
 * Benway - Background Script
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
 * Load tab limit from storage and initialize extension
 * @returns {Promise} Promise that resolves when settings are loaded
 */
async function initExtension() {
  try {
    const result = await browser.storage.local.get("maxTabs");
    maxTabs = (result.maxTabs !== undefined && !isNaN(result.maxTabs)) 
      ? result.maxTabs 
      : DEFAULT_MAX_TABS;
    
    console.log("Benway initialized with max tabs:", maxTabs);
  } catch (err) {
    console.error("Error initializing extension:", err);
    maxTabs = DEFAULT_MAX_TABS;
  }
}

/**
 * Check if a tab is loading the options page
 * @param {object} tab - Tab object to check
 * @returns {boolean} True if the tab is the options page
 */
function isOptionsPage(tab) {
  const url = tab.url || tab.pendingUrl || "";
  return url.startsWith(optionsUrl);
}

/**
 * Show notification when tab limit is reached
 * @param {number} tabId - ID of the tab that triggered the limit
 */
async function showLimitReachedNotification(tabId) {
  try {
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length === 0) return;

    const activeTab = activeTabs[0];

    try {
      // First try to use the content script approach for the reaction game
      await browser.tabs.sendMessage(activeTab.id, {
        action: 'triggerQuizChallenge',
        maxTabs: maxTabs
      });
    } catch (err) {
      // Fall back to basic notification if content script communication fails
      browser.notifications.create({
        type: "basic",
        title: "Tab Limit Reached",
        message: `You've reached the maximum of ${maxTabs} tabs in this window.`
      });
    }
  } catch (err) {
    console.error("Error showing tab limit notification:", err);
  }
}

/**
 * Open options page with flag tracking to prevent tab limit checks
 * @returns {Promise} Promise that resolves when options page is opened
 */
async function openOptionsPage() {
  openingOptionsPage = true;
  
  try {
    await browser.runtime.openOptionsPage();
    // Reset flag after a delay to prevent races
    setTimeout(() => {
      openingOptionsPage = false;
    }, 1000);
  } catch (err) {
    console.error("Failed to open options page:", err);
    openingOptionsPage = false;
  }
}

/**
 * Handle tab creation and enforcing limits
 * @param {object} tab - The newly created tab
 */
async function handleNewTab(tab) {
  try {
    if (openingOptionsPage) return;

    const windowTabs = await browser.tabs.query({ windowId: tab.windowId });
    
    // Check if over limit and not options page
    if (windowTabs.length > maxTabs && !isOptionsPage(tab)) {
      if (!tab.url) {
        // For "new tab" pages without URL yet, defer check until URL is set
        pendingTabChecks.add(tab.id);
        return;
      }

      await browser.tabs.remove(tab.id);
      showLimitReachedNotification(tab.id);
    }
  } catch (err) {
    console.error("Error handling new tab:", err);
  }
}

// ======== EVENT LISTENERS ========

// Initialize extension on startup
initExtension();

// Listen for storage changes
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.maxTabs) {
    maxTabs = changes.maxTabs.newValue;
    console.log("Tab limit updated to:", maxTabs);
  }
});

// Listen for messages from the popup and content scripts
browser.runtime.onMessage.addListener((message) => {
  // Challenge passed - temporarily increase tab limit
  if (message.action === 'quizPassed') {
    maxTabs += 1;
    
    // Reset after delay
    setTimeout(() => {
      initExtension();
    }, 30000); // Reset after 30 seconds
    
    return Promise.resolve({ success: true });
  }

  // Open settings page request
  if (message.action === 'openSettings') {
    openOptionsPage();
    return Promise.resolve({ success: true });
  }

  // Get current maximum tabs
  if (message.action === 'getMaxTabs') {
    return Promise.resolve({ maxTabs: maxTabs });
  }

  return false;
});

// Listen for tab updates to handle deferred tab checks
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (pendingTabChecks.has(tabId) && changeInfo.url) {
    pendingTabChecks.delete(tabId);

    if (!isOptionsPage(tab) && !openingOptionsPage) {
      browser.tabs.query({ windowId: tab.windowId }).then(tabs => {
        if (tabs.length > maxTabs) {
          browser.tabs.remove(tabId);
          showLimitReachedNotification(tabId);
        }
      }).catch(error => {
        console.error("Error checking updated tab:", error);
      });
    }
  }
});

// Listen for newly created tabs
browser.tabs.onCreated.addListener(handleNewTab);
