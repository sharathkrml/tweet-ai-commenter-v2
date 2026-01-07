// Content script for Tweet AI Commenter
// Injects AI comment button into Twitter/X tweets

(function() {
  'use strict';

  console.log('[Tweet AI] Content script loaded');
  console.log('[Tweet AI] Current URL:', window.location.href);

  // Track which tweets we've already processed
  const processedTweets = new WeakSet();
  
  // SVG icon for the AI button
  const AI_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
  </svg>`;

  // Create the AI comment button
  function createAIButton() {
    const button = document.createElement('button');
    button.className = 'tweet-ai-comment-btn';
    button.setAttribute('aria-label', 'Generate AI Comment');
    button.setAttribute('title', 'Generate AI Comment');
    button.innerHTML = `
      <div class="tweet-ai-btn-inner">
        ${AI_ICON}
        <span class="tweet-ai-btn-text">AI</span>
      </div>
    `;
    return button;
  }

  // Create the AI comment sidebar
  function createAISidebar() {
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'tweet-ai-sidebar';
    sidebar.innerHTML = `
      <div class="tweet-ai-sidebar-header">
        <span class="tweet-ai-sidebar-title">✨ AI Generated Comments</span>
        <button class="tweet-ai-modal-close">&times;</button>
      </div>
      <div class="tweet-ai-sidebar-body">
        <div class="tweet-ai-loading">
          <div class="tweet-ai-spinner"></div>
          <span>Generating all style variations...</span>
        </div>
        <div class="tweet-ai-results" style="display: none;">
          <div class="tweet-ai-results-list"></div>
          <div class="tweet-ai-actions">
            <button class="tweet-ai-regenerate-btn">🔄 Regenerate All</button>
          </div>
        </div>
        <div class="tweet-ai-error" style="display: none;">
          <span class="tweet-ai-error-text"></span>
          <button class="tweet-ai-retry-btn">Retry</button>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    return sidebar;
  }

  // Extract tweet text from a tweet element
  function extractTweetText(tweetElement) {
    console.log('[Tweet AI] Extracting tweet text...');
    // Try different selectors for tweet text
    const selectors = [
      '[data-testid="tweetText"]',
      '[lang]',
      '.css-1rynq56'
    ];
    
    for (const selector of selectors) {
      const textElement = tweetElement.querySelector(selector);
      if (textElement) {
        const text = textElement.innerText.trim();
        console.log('[Tweet AI] Found tweet text:', text.substring(0, 50) + '...');
        return text;
      }
    }
    
    console.log('[Tweet AI] Could not find tweet text');
    return null;
  }

  // Find the action bar of a tweet
  function findActionBar(tweetElement) {
    // Look for the action bar with like, retweet, reply buttons
    const actionBar = tweetElement.querySelector('[role="group"]');
    if (actionBar) {
      console.log('[Tweet AI] Found action bar');
    } else {
      console.log('[Tweet AI] Action bar not found');
    }
    return actionBar;
  }

  // Show sidebar and generate comment
  async function toggleAISidebar(tweetText) {
    console.log('[Tweet AI] Toggling comment sidebar');
    
    // Check if sidebar already exists
    let sidebar = document.querySelector('.tweet-ai-sidebar');
    
    const closeSidebar = () => {
      if (sidebar) {
        sidebar.classList.remove('open');
        setTimeout(() => {
          sidebar.remove();
        }, 400); // Wait for transition
      }
    };

    if (!sidebar) {
      sidebar = createAISidebar();
      // Close button handler - add only once
      sidebar.querySelector('.tweet-ai-modal-close').addEventListener('click', closeSidebar);
      
      // Regenerate button handler - add only once
      sidebar.querySelector('.tweet-ai-regenerate-btn').addEventListener('click', () => {
        const currentText = sidebar.dataset.tweetText;
        generateAndShow(currentText);
      });
      
      // Retry button handler - add only once
      sidebar.querySelector('.tweet-ai-retry-btn').addEventListener('click', () => {
        const currentText = sidebar.dataset.tweetText;
        generateAndShow(currentText);
      });
    }
    
    // Check if it's the same tweet
    const isSameTweet = sidebar.dataset.tweetText === tweetText;
    const isOpen = sidebar.classList.contains('open');

    if (isOpen && isSameTweet) {
      closeSidebar();
      return;
    }

    // Update target tweet text
    sidebar.dataset.tweetText = tweetText;

    // Open sidebar if not already open
    if (!isOpen) {
      setTimeout(() => {
        sidebar.classList.add('open');
      }, 10);
    }
    
    const loading = sidebar.querySelector('.tweet-ai-loading');
    const results = sidebar.querySelector('.tweet-ai-results');
    const resultsList = sidebar.querySelector('.tweet-ai-results-list');
    const error = sidebar.querySelector('.tweet-ai-error');
    const errorText = sidebar.querySelector('.tweet-ai-error-text');
    
    // Style display names
    const styleNames = {
      witty: '😏 Witty',
      professional: '👔 Professional',
      supportive: '💪 Supportive',
      humorous: '😂 Humorous',
      sarcastic: '🙄 Sarcastic',
      thoughtful: '🤔 Thoughtful',
    };
    
    // Generate all comments function
    async function generateAndShow(textToProcess) {
      // Ensure we are processing the latest text assigned to the sidebar
      if (!textToProcess) return;
      
      console.log('[Tweet AI] Generating all comments for:', textToProcess.substring(0, 30) + '...');
      loading.style.display = 'flex';
      results.style.display = 'none';
      error.style.display = 'none';
      
      try {
        console.log('[Tweet AI] Sending message to background script');
        const response = await chrome.runtime.sendMessage({
          action: 'generateAllComments',
          tweetText: textToProcess
        });
        
        // If the sidebar switched to a different tweet while waiting, ignore this response
        if (sidebar.dataset.tweetText !== textToProcess) {
          console.log('[Tweet AI] Ignoring stale response');
          return;
        }

        console.log('[Tweet AI] Received response:', response);
        if (response.success && response.comments) {
          console.log('[Tweet AI] Generated comments:', response.comments);
          
          // Clear previous results
          resultsList.innerHTML = '';
          
          // Create a comment card for each style
          Object.entries(response.comments).forEach(([style, comment]) => {
            if (comment) {
              const card = document.createElement('div');
              card.className = 'tweet-ai-comment-card';
              card.innerHTML = `
                <div class="tweet-ai-comment-header">
                  <span class="tweet-ai-comment-style">${styleNames[style] || style}</span>
                </div>
                <textarea class="tweet-ai-comment-textarea">${comment}</textarea>
                <button class="tweet-ai-comment-copy">
                  📋 Copy
                </button>
              `;
              resultsList.appendChild(card);
              
              const textarea = card.querySelector('.tweet-ai-comment-textarea');
              
              // Auto-resize textarea
              const resizeTextarea = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
              };
              
              textarea.addEventListener('input', resizeTextarea);
              
              // Helper to copy text on click
              textarea.addEventListener('click', () => {
                textarea.select();
              });

              // Initial resize
              setTimeout(resizeTextarea, 0);
            }
          });
          
          // Add copy button handlers
          resultsList.querySelectorAll('.tweet-ai-comment-card').forEach(card => {
            const btn = card.querySelector('.tweet-ai-comment-copy');
            const textarea = card.querySelector('.tweet-ai-comment-textarea');
            
            btn.addEventListener('click', async () => {
              try {
                const commentText = textarea.value;
                await navigator.clipboard.writeText(commentText);
                btn.textContent = '✅ Copied!';
                setTimeout(() => {
                  btn.textContent = '📋 Copy';
                }, 2000);
              } catch (err) {
                console.error('Failed to copy:', err);
              }
            });
          });
          
          loading.style.display = 'none';
          results.style.display = 'block';
          
          // Force scrollable area to work by calculating available height
          setTimeout(() => {
            const sidebarHeader = sidebar.querySelector('.tweet-ai-sidebar-header');
            const sidebarBody = sidebar.querySelector('.tweet-ai-sidebar-body');
            const resultsContainer = sidebar.querySelector('.tweet-ai-results');
            const actionsContainer = sidebar.querySelector('.tweet-ai-actions');
            const resultsList = sidebar.querySelector('.tweet-ai-results-list');
            
            if (sidebarHeader && sidebarBody && resultsContainer && resultsList) {
              const headerHeight = sidebarHeader.offsetHeight;
              const sidebarHeight = sidebar.offsetHeight;
              const bodyPadding = parseInt(window.getComputedStyle(sidebarBody).paddingTop) + 
                                 parseInt(window.getComputedStyle(sidebarBody).paddingBottom);
              const actionsHeight = actionsContainer ? actionsContainer.offsetHeight + 24 : 0;
              const availableHeight = sidebarHeight - headerHeight - bodyPadding - actionsHeight;
              
              resultsList.style.maxHeight = availableHeight + 'px';
              resultsList.style.height = 'auto';
              console.log('[Tweet AI] Set scrollable height:', availableHeight);
            }
          }, 100);
        } else {
          console.error('[Tweet AI] Generation failed:', response.error);
          throw new Error(response.error || 'Failed to generate comments');
        }
      } catch (err) {
        console.error('[Tweet AI] Error:', err);
        loading.style.display = 'none';
        error.style.display = 'flex';
        errorText.textContent = err.message || 'Connection error. Is Ollama running?';
      }
    }
    
    // Generate initial comments
    await generateAndShow(tweetText);
  }

  // Process a tweet element and add AI button
  function processTweet(tweetElement) {
    if (processedTweets.has(tweetElement)) {
      return;
    }
    
    console.log('[Tweet AI] Processing tweet element');
    
    const actionBar = findActionBar(tweetElement);
    if (!actionBar) {
      console.log('[Tweet AI] Skipping - no action bar');
      return;
    }
    
    // Check if we already added a button
    if (actionBar.querySelector('.tweet-ai-comment-btn')) {
      console.log('[Tweet AI] Skipping - button already exists');
      return;
    }
    
    const tweetText = extractTweetText(tweetElement);
    if (!tweetText) {
      console.log('[Tweet AI] Skipping - no tweet text found');
      return;
    }
    
    const button = createAIButton();
    
    button.addEventListener('click', (e) => {
      console.log('[Tweet AI] AI button clicked');
      e.preventDefault();
      e.stopPropagation();
      toggleAISidebar(tweetText);
    });
    
    // Add button to action bar
    actionBar.appendChild(button);
    processedTweets.add(tweetElement);
    console.log('[Tweet AI] Button added successfully');
  }

  // Find and process all tweets on the page
  function processAllTweets() {
    // Main tweet container selector
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    console.log('[Tweet AI] Found', tweets.length, 'tweets on page');
    tweets.forEach(processTweet);
  }

  // Set up MutationObserver to watch for new tweets
  function setupObserver() {
    console.log('[Tweet AI] Setting up MutationObserver');
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          // Small delay to let Twitter finish rendering
          setTimeout(processAllTweets, 100);
          break;
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial processing
    console.log('[Tweet AI] Running initial tweet processing');
    processAllTweets();
  }

  // Initialize when DOM is ready
  console.log('[Tweet AI] Document ready state:', document.readyState);
  if (document.readyState === 'loading') {
    console.log('[Tweet AI] Waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }

  // Also process on scroll (for lazy-loaded tweets)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(processAllTweets, 200);
  });

})();
