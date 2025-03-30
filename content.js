/**
 * Tab Limiter - Content Script
 * 
 * This script is injected into web pages and is responsible for 
 * displaying the limit reached notification to the user.
 */

/**
 * Listen for messages from the background script
 */
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'showLimitPopup') {
    showDirectNotification(message.maxTabs);
    return Promise.resolve({success: true});
  }
});

/**
 * Creates and displays a notification when tab limit is reached
 * @param {number} maxTabs - The current tab limit
 */
function showDirectNotification(maxTabs) {
  // Don't show multiple notifications
  if (document.getElementById('tab-limit-notification')) {
    return;
  }
  
  // Create notification container
  const notification = createNotificationElement();
  
  // Add animation style
  addNotificationStyle();
  
  // Create notification content
  const title = createTitleElement();
  const message = createMessageElement(maxTabs);
  const closeBtn = createCloseButton();
  const settingsBtn = createSettingsButton();
  
  // Assemble the notification
  notification.appendChild(closeBtn);
  notification.appendChild(title);
  notification.appendChild(message);
  notification.appendChild(settingsBtn);
  
  // Add to the document
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    const notif = document.getElementById('tab-limit-notification');
    if (notif) notif.remove();
  }, 10000);
}

/**
 * Helper Functions for Creating Notification Elements
 */

function createNotificationElement() {
  const notification = document.createElement('div');
  notification.id = 'tab-limit-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    padding: 15px;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    border-left: 4px solid #ff4f5e;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 4px;
    animation: slideInNotif 0.3s forwards;
  `;
  return notification;
}

function addNotificationStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInNotif {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function createTitleElement() {
  const title = document.createElement('h3');
  title.textContent = 'Tab Limit Reached';
  title.style.cssText = `
    margin: 0 0 10px 0;
    color: #0c0c0d;
    font-size: 16px;
    font-weight: 600;
  `;
  return title;
}

function createMessageElement(maxTabs) {
  const message = document.createElement('p');
  message.textContent = `You've reached the maximum of ${maxTabs} tabs allowed in this window. You can still open the settings page to change this limit.`;
  message.style.cssText = `
    margin: 0 0 15px 0;
    color: #3d3d3d;
    font-size: 14px;
    line-height: 1.4;
  `;
  return message;
}

function createCloseButton() {
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #6d6d6e;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    line-height: 1;
  `;
  closeBtn.onclick = function() {
    document.getElementById('tab-limit-notification').remove();
  };
  return closeBtn;
}

function createSettingsButton() {
  const settingsBtn = document.createElement('button');
  settingsBtn.textContent = 'Open Settings';
  settingsBtn.style.cssText = `
    background-color: #0060df;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  `;
  settingsBtn.onclick = function() {
    // First remove the notification to avoid multiple clicks
    document.getElementById('tab-limit-notification').remove();
    
    // Send the message to open options page with error handling
    browser.runtime.sendMessage({ action: 'openSettings' })
      .catch(() => {
        // Try direct approach as fallback
        try {
          browser.runtime.openOptionsPage();
        } catch (err) {
          // Fail silently
        }
      });
  };
  return settingsBtn;
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'triggerQuizChallenge') {
    showQuizChallenge();
    return Promise.resolve({ success: true });
  }
});

function showQuizChallenge() {
  if (document.getElementById('quiz-challenge')) return;

  const container = document.createElement('div');
  container.id = 'quiz-challenge';
  container.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 300px; background: white;
    border: 2px solid #4caf50; padding: 20px; z-index: 2147483647; border-radius: 6px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;

  const question = document.createElement('p');
  question.textContent = "What is 5 + 3?";
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Your answer';
  input.style = 'width: 100%; padding: 6px; margin-top: 10px;';

  const submit = document.createElement('button');
  submit.textContent = 'Submit';
  submit.style = 'margin-top: 10px; width: 100%; padding: 8px; background: #0060df; color: white; border: none; border-radius: 4px; cursor: pointer;';

  const message = document.createElement('div');
  message.style = 'margin-top: 10px; color: red; font-size: 13px;';

  submit.onclick = () => {
    if (input.value.trim() === '8') {
      message.textContent = 'Correct! You can open one more tab now!';
      input.disabled = true;
      submit.disabled = true;
      browser.runtime.sendMessage({ action: 'quizPassed' });
      setTimeout(() => container.remove(), 1500);
    } else {
      message.textContent = 'Wrong answer. Try again!';
    }
  };

  container.append(question, input, submit, message);
  document.body.appendChild(container);
}
