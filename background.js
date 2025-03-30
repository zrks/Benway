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
  }).catch((err) => {
    console.error("Error loading maxTabs from storage:", err);
    maxTabs = DEFAULT_MAX_TABS;
  });
}

/**
 * Check if a tab is loading the options page
 */
function isOptionsPage(tab) {
  const url = tab.url || tab.pendingUrl || "";
  return url.startsWith(optionsUrl);
}

/**
 * Show fallback notification
 */
function showBasicNotification() {
  browser.notifications.create({
    "type": "basic",
    "title": "Tab Limit Reached",
    "message": `You've reached the maximum of ${maxTabs} tabs in this window.`
  });
}

/**
 * Show a notification or message when tab limit is reached
 */
async function showLimitReachedPopup() {
  try {
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTabs.length === 0) return;

    const activeTab = activeTabs[0];

    try {
      await browser.tabs.sendMessage(activeTab.id, {
        action: 'triggerQuizChallenge',
        maxTabs: maxTabs
      });
    } catch {
      showBasicNotification();
    }
  } catch (err) {
    console.error("Error showing tab limit popup:", err);
    showBasicNotification();
  }
}

/**
 * Open options page with flag tracking
 */
async function handleOpenSettings() {
  openingOptionsPage = true;
  await new Promise(resolve => setTimeout(resolve, 100));
  try {
    await browser.runtime.openOptionsPage();
    setTimeout(() => {
      openingOptionsPage = false;
    }, 1000);
  } catch (err) {
    console.error("Failed to open options page:", err);
    openingOptionsPage = false;
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
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'quizPassed') {
    // Allow 1 more tab this time
    maxTabs += 1;
  
    // Optionally reset it after a delay to avoid permanent cheating
    setTimeout(() => {
      loadMaxTabsFromStorage();
    }, 30000);
    
    return Promise.resolve({ success: true });
  }

  if (message.action === 'openSettings') {
    handleOpenSettings();
    return Promise.resolve({ success: true });
  }

  if (message.action === 'getMaxTabs') {
    return Promise.resolve({ maxTabs: maxTabs });
  }

  return false;
});

/**
 * Listen for tab updates
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (pendingTabChecks.has(tabId) && changeInfo.url) {
    pendingTabChecks.delete(tabId);

    if (!isOptionsPage(tab) && !openingOptionsPage) {
      browser.tabs.query({ windowId: tab.windowId }).then(tabs => {
        if (tabs.length > maxTabs) {
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
    if (openingOptionsPage) return;

    const windowTabs = await browser.tabs.query({ windowId: tab.windowId });
    if (windowTabs.length > maxTabs) {
      if (isOptionsPage(tab)) return;

      if (!tab.url) {
        pendingTabChecks.add(tab.id);
        return;
      }

      await browser.tabs.remove(tab.id);
      showLimitReachedPopup();
    }
  } catch (err) {
    console.error("Error handling new tab:", err);
  }
});

// Initialize extension
loadMaxTabsFromStorage();