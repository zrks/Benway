/**
 * Benway - Content Script
 * 
 * This script is injected into web pages and is responsible for 
 * displaying the limit reached notification to the user.
 */

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'showLimitPopup') {
    showDirectNotification(message.maxTabs);
    return Promise.resolve({success: true});
  }
  if (message.action === 'triggerQuizChallenge') {
    showReactionGameChallenge();
    return Promise.resolve({ success: true });
  }
});

/**
 * Creates and displays a notification when tab limit is reached
 * @param {number} maxTabs - The current tab limit
 */
function showDirectNotification(maxTabs) {
  if (document.getElementById('tab-limit-notification')) {
    return;
  }

  const notification = createNotificationElement();
  addNotificationStyle();
  const title = createTitleElement();
  const message = createMessageElement(maxTabs);
  const closeBtn = createCloseButton();
  const settingsBtn = createSettingsButton();

  notification.appendChild(closeBtn);
  notification.appendChild(title);
  notification.appendChild(message);
  notification.appendChild(settingsBtn);
  document.body.appendChild(notification);

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
    document.getElementById('tab-limit-notification').remove();
    browser.runtime.sendMessage({ action: 'openSettings' }).catch(() => {
      try {
        browser.runtime.openOptionsPage();
      } catch (err) {
        console.warn("Failed to open settings page directly:", err);
      }
    });
  };
  return settingsBtn;
}

function showReactionGameChallenge() {
  if (document.getElementById('reaction-challenge')) return;

  const container = document.createElement('div');
  container.id = 'reaction-challenge';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    padding: 20px;
    background: white;
    border: 2px solid #4caf50;
    border-radius: 6px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
    font-family: sans-serif;
    z-index: 2147483647;
    text-align: center;
  `;

  const instruction = document.createElement('p');
  instruction.textContent = "Click the box as fast as you can when it turns green!";
  instruction.style.marginBottom = '10px';

  const box = document.createElement('div');
  box.style.cssText = `
    width: 100%;
    height: 100px;
    background-color: red;
    margin: 10px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  `;

  const message = document.createElement('p');
  message.style = 'font-size: 14px; color: #333; margin-top: 10px;';

  let hasTurnedGreen = false;
  let startTime;
  const history = [];

  const stats = document.createElement('div');
  stats.style = 'margin-top: 10px; font-size: 12px; color: #555;';
  const updateStats = () => {
    if (history.length === 0) {
      stats.textContent = '';
      return;
    }
    const recent = history.slice(-5).map(ms => `${ms}ms`).join(', ');
    stats.textContent = `Recent: ${recent}`;
  };

  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.style = `
    margin-top: 10px;
    padding: 6px 10px;
    background: #ff9800;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 13px;
    cursor: pointer;
  `;
  retryBtn.onclick = () => {
    retryBtn.style.display = 'none';
    resetGame();
  };

  const resetBox = () => {
    box.style.backgroundColor = 'red';
    box.classList.remove('pulse');
    hasTurnedGreen = false;
    message.textContent = 'Too soon! Wait for green.';
    retryBtn.style.display = 'inline-block';
  };

  const onBoxClick = () => {
    if (!hasTurnedGreen) {
      resetBox();
      return;
    }

    const reactionTime = Date.now() - startTime;
    history.push(reactionTime);
    updateStats();

    if (reactionTime <= 600) {
      message.textContent = `Great! Reaction Time: ${reactionTime}ms.`;
      box.style.backgroundColor = '#4caf50';
      box.style.cursor = 'default';
      box.onclick = null;
      retryBtn.style.display = 'none';
      browser.runtime.sendMessage({ action: 'quizPassed' });
      setTimeout(() => container.remove(), 2500);
    } else {
      message.textContent = `Too slow (${reactionTime}ms). Try again!`;
      retryBtn.style.display = 'inline-block';
    }
  };

  box.onclick = onBoxClick;

  const resetGame = () => {
    box.style.backgroundColor = 'red';
    box.style.cursor = 'pointer';
    box.classList.remove('pulse');
    message.textContent = 'Wait for green...';
    hasTurnedGreen = false;
    startTime = null;

    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      box.style.backgroundColor = 'green';
      box.classList.add('pulse');
      hasTurnedGreen = true;
      startTime = Date.now();
    }, delay);
  };

  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .pulse {
      animation: pulse 0.6s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);

  container.appendChild(instruction);
  container.appendChild(box);
  container.appendChild(message);
  container.appendChild(retryBtn);
  container.appendChild(stats);
  document.body.appendChild(container);

  retryBtn.style.display = 'none';
  updateStats();
  resetGame();
}
