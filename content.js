/**
 * Benway - Content Script
 * 
 * This script is injected into web pages and is responsible for 
 * displaying UI elements when the tab limit is reached.
 */

// Message handler for background script communication
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
 * UI Components Factory - Creates DOM elements with consistent styling
 */
const UIFactory = {
  /**
   * Create a notification container
   * @returns {HTMLDivElement} The notification container
   */
  createNotificationContainer() {
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
  },

  /**
   * Add animation style to document head
   */
  addAnimationStyle() {
    if (!document.getElementById('benway-animations')) {
      const style = document.createElement('style');
      style.id = 'benway-animations';
      style.textContent = `
        @keyframes slideInNotif {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
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
    }
  },

  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {string} style - CSS style string
   * @param {Function} onClick - Click handler
   * @returns {HTMLButtonElement} Button element
   */
  createButton(text, style, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = style;
    button.onclick = onClick;
    return button;
  },

  /**
   * Create a heading element
   * @param {string} text - Heading text
   * @param {string} level - Heading level (h1-h6)
   * @param {string} style - CSS style string
   * @returns {HTMLHeadingElement} Heading element
   */
  createHeading(text, level = 'h3', style) {
    const heading = document.createElement(level);
    heading.textContent = text;
    heading.style.cssText = style;
    return heading;
  },

  /**
   * Create a paragraph element
   * @param {string} text - Paragraph text
   * @param {string} style - CSS style string
   * @returns {HTMLParagraphElement} Paragraph element
   */
  createParagraph(text, style) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    paragraph.style.cssText = style;
    return paragraph;
  }
};

/**
 * Creates and displays a notification when tab limit is reached
 * @param {number} maxTabs - The current tab limit
 */
function showDirectNotification(maxTabs) {
  // Don't show duplicate notifications
  if (document.getElementById('tab-limit-notification')) {
    return;
  }

  UIFactory.addAnimationStyle();
  
  const notification = UIFactory.createNotificationContainer();
  
  const title = UIFactory.createHeading('Tab Limit Reached', 'h3', `
    margin: 0 0 10px 0;
    color: #0c0c0d;
    font-size: 16px;
    font-weight: 600;
  `);
  
  const message = UIFactory.createParagraph(
    `You've reached the maximum of ${maxTabs} tabs allowed in this window. You can still open the settings page to change this limit.`,
    `
      margin: 0 0 15px 0;
      color: #3d3d3d;
      font-size: 14px;
      line-height: 1.4;
    `
  );
  
  const closeBtn = UIFactory.createButton('×', `
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
  `, () => {
    document.getElementById('tab-limit-notification').remove();
  });
  
  const settingsBtn = UIFactory.createButton('Open Settings', `
    background-color: #0060df;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  `, () => {
    document.getElementById('tab-limit-notification').remove();
    browser.runtime.sendMessage({ action: 'openSettings' }).catch(() => {
      try {
        browser.runtime.openOptionsPage();
      } catch (err) {
        console.warn("Failed to open settings page directly:", err);
      }
    });
  });

  // Assemble the notification
  notification.appendChild(closeBtn);
  notification.appendChild(title);
  notification.appendChild(message);
  notification.appendChild(settingsBtn);
  document.body.appendChild(notification);

  // Automatically hide after 10 seconds
  setTimeout(() => {
    const notif = document.getElementById('tab-limit-notification');
    if (notif) notif.remove();
  }, 10000);
}

/**
 * Creates and displays the reaction time challenge game
 */
function showReactionGameChallenge() {
  // Don't show duplicate challenges
  if (document.getElementById('reaction-challenge')) return;
  
  UIFactory.addAnimationStyle();

  // Create container
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

  // Create game UI elements
  const instruction = UIFactory.createParagraph(
    "Click the box as fast as you can when it turns green!",
    'margin-bottom: 10px; font-weight: bold;'
  );

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

  const message = UIFactory.createParagraph(
    "",
    'font-size: 14px; color: #333; margin-top: 10px;'
  );

  // Game state
  let hasTurnedGreen = false;
  let startTime;
  const history = [];
  
  // Stats display
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

  // Create retry button
  const retryBtn = UIFactory.createButton('Retry', `
    margin-top: 10px;
    padding: 6px 10px;
    background: #ff9800;
    border: none;
    border-radius: 4px;
    color: white;
    font-size: 13px;
    cursor: pointer;
  `, () => {
    retryBtn.style.display = 'none';
    resetGame();
  });

  // Game functions
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

    if (reactionTime <= 600) { // Success threshold
      message.textContent = `Great! Reaction Time: ${reactionTime}ms.`;
      box.style.backgroundColor = '#4caf50';
      box.style.cursor = 'default';
      box.onclick = null;
      retryBtn.style.display = 'none';
      
      // Notify background script of success
      browser.runtime.sendMessage({ action: 'quizPassed' });
      
      // Auto-close after showing success
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

    // Random delay before turning green
    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      if (document.body.contains(box)) { // Check if still in DOM
        box.style.backgroundColor = 'green';
        box.classList.add('pulse');
        hasTurnedGreen = true;
        startTime = Date.now();
      }
    }, delay);
  };

  // Assemble the game UI
  container.appendChild(instruction);
  container.appendChild(box);
  container.appendChild(message);
  container.appendChild(retryBtn);
  container.appendChild(stats);
  document.body.appendChild(container);

  // Initialize
  retryBtn.style.display = 'none';
  updateStats();
  resetGame();
}
