// Background service worker for Tweet AI Commenter

import { SYSTEM_PROMPT, STYLE_PROMPTS, ALL_STYLES_PROMPT } from "./prompts.js"

console.log("[Tweet AI Background] Service worker started")

// Default settings
const DEFAULT_SETTINGS = {
  apiEndpoint: "http://0.0.0.0:8000",
  openrouterApiKey: "",
  openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
  commentStyle: "witty",
  enabled: true,
}

// Get settings from storage
async function getSettings() {
  console.log("[Tweet AI Background] Getting settings from storage")
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      console.log("[Tweet AI Background] Settings loaded:", settings)
      resolve(settings)
    })
  })
}

// Helper for OpenRouter API call
async function callOpenRouter(prompt, settings) {
  console.log("[Tweet AI Background] Calling OpenRouter API")
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.openrouterApiKey}`,
      "HTTP-Referer": "https://github.com/sharathkrml/tweet-ai-commenter",
      "X-Title": "Tweet AI Commenter",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.openrouterModel || "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("[Tweet AI Background] OpenRouter error:", response.status, errorData);
    throw new Error(`OpenRouter error: ${response.status} ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Generate comment using Generic API or OpenRouter
async function generateComment(tweetText, settings, style = null) {
  const commentStyle = style || settings.commentStyle
  console.log(
    "[Tweet AI Background] Generating comment for tweet:",
    tweetText.substring(0, 50) + "..."
  )
  console.log("[Tweet AI Background] Using style:", commentStyle)

  try {
    let comment = "";
    
    // If OpenRouter key is provided, use it directly
    if (settings.openrouterApiKey) {
      console.log("[Tweet AI Background] Using OpenRouter directly")
      const stylePrompt = settings.customPrompt || STYLE_PROMPTS[commentStyle] || STYLE_PROMPTS.witty;
      const fullPrompt = `${stylePrompt}\n\nTweet to reply to: "${tweetText}"\n\nReturn ONLY the reply text, no extra commentary or quotes.`;
      
      comment = await callOpenRouter(fullPrompt, settings);
    } else {
      // Fallback to generic API
      console.log(
        "[Tweet AI Background] Sending request to:",
        settings.apiEndpoint + "/reply"
      )
      
      const response = await fetch(`${settings.apiEndpoint}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          tweet_text: tweetText
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      comment = data.replies?.[commentStyle] || ""

      if (!comment && data.replies) {
        const availableStyles = Object.keys(data.replies)
        if (availableStyles.length > 0) {
          comment = data.replies[availableStyles[0]]
        }
      }
    }

    comment = comment.trim();

    // Remove quotes
    if (comment.startsWith('"') && comment.endsWith('"')) {
      comment = comment.slice(1, -1)
    }

    // Truncate if too long
    if (comment.length > 280) {
      comment = comment.substring(0, 277) + "..."
    }

    console.log("[Tweet AI Background] Final comment:", comment)
    return { success: true, comment, style: commentStyle }
  } catch (error) {
    console.error("[Tweet AI Background] Error generating comment:", error)
    return { success: false, error: error.message, style: commentStyle }
  }
}

// Generate comments for all styles
async function generateAllComments(tweetText, settings) {
  console.log(
    "[Tweet AI Background] Generating all style comments for tweet:",
    tweetText.substring(0, 50) + "..."
  )

  try {
    let replies = {};

    if (settings.openrouterApiKey) {
      console.log("[Tweet AI Background] Using OpenRouter for all styles")
      const fullPrompt = `${ALL_STYLES_PROMPT}\n\nTweet to reply to: "${tweetText}"`;
      const responseText = await callOpenRouter(fullPrompt, settings);
      
      // Attempt to parse JSON from response
      try {
        // Find JSON block if model added text around it
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
        replies = JSON.parse(jsonStr);
      } catch (e) {
        console.error("[Tweet AI Background] Failed to parse JSON from OpenRouter:", e);
        throw new Error("AI failed to return valid JSON for all styles");
      }
    } else {
      console.log(
        "[Tweet AI Background] Sending request to:",
        settings.apiEndpoint + "/reply"
      )

      const response = await fetch(`${settings.apiEndpoint}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json"
        },
        body: JSON.stringify({
          tweet_text: tweetText
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      replies = data.replies;
    }

    if (!replies) {
      throw new Error("Missing 'replies' field in response")
    }

    const validComments = {}
    const styles = Object.keys(STYLE_PROMPTS)

    styles.forEach((style) => {
      if (replies[style] && typeof replies[style] === "string") {
        let comment = replies[style].trim()
        if (comment.startsWith('"') && comment.endsWith('"')) {
          comment = comment.slice(1, -1)
        }
        if (comment.length > 280) {
          comment = comment.substring(0, 277) + "..."
        }
        validComments[style] = comment
      } else {
        validComments[style] = null
      }
    })

    const successCount = Object.values(validComments).filter(c => c !== null).length
    if (successCount === 0) {
      return { success: false, error: "Failed to generate any comments." }
    }

    return { success: true, comments: validComments }
  } catch (error) {
    console.error("[Tweet AI Background] Error generating all comments:", error)
    return { success: false, error: error.message }
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Tweet AI Background] Received message:", request.action)

  if (request.action === "generateComment") {
    console.log("[Tweet AI Background] Generate comment request received")
    ;(async () => {
      const settings = await getSettings()

      if (!settings.enabled) {
        console.log("[Tweet AI Background] Extension is disabled")
        sendResponse({ success: false, error: "Extension is disabled" })
        return
      }

      const result = await generateComment(request.tweetText, settings)
      sendResponse(result)
    })()

    // Return true to indicate we'll send response asynchronously
    return true
  }

  if (request.action === "generateAllComments") {
    console.log("[Tweet AI Background] Generate all comments request received")
    ;(async () => {
      const settings = await getSettings()

      if (!settings.enabled) {
        console.log("[Tweet AI Background] Extension is disabled")
        sendResponse({ success: false, error: "Extension is disabled" })
        return
      }

      const result = await generateAllComments(request.tweetText, settings)
      sendResponse(result)
    })()

    // Return true to indicate we'll send response asynchronously
    return true
  }

  if (request.action === "getSettings") {
    getSettings().then(sendResponse)
    return true
  }

  if (request.action === "checkConnection") {
    console.log("[Tweet AI Background] Checking API connection")
    ;(async () => {
      const settings = await getSettings()
      
      if (settings.openrouterApiKey) {
        console.log("[Tweet AI Background] Checking OpenRouter connection")
        try {
          const response = await fetch("https://openrouter.ai/api/v1/models", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${settings.openrouterApiKey}`
            }
          });
          
          if (response.ok) {
            sendResponse({ connected: true, provider: "OpenRouter" })
          } else {
            sendResponse({ connected: false, error: "Invalid OpenRouter API Key" })
          }
        } catch (error) {
          sendResponse({ connected: false, error: error.message })
        }
        return;
      }

      console.log(
        "[Tweet AI Background] Checking Generic API endpoint:",
        settings.apiEndpoint
      )
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${settings.apiEndpoint}/reply`, {
          method: "OPTIONS",
          signal: controller.signal
        }).catch(err => {
          return { ok: true, status: 0 } 
        })
        
        clearTimeout(timeoutId)
        console.log("[Tweet AI Background] Connection check completed")
        sendResponse({ connected: true, provider: "Generic API" })
      } catch (error) {
        console.error("[Tweet AI Background] Connection error:", error.message)
        sendResponse({ connected: false, error: error.message })
      }
    })()
    return true
  }
})

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tweet AI Background] Extension installed/updated")
  chrome.storage.sync.get(DEFAULT_SETTINGS, (existing) => {
    const settings = { ...DEFAULT_SETTINGS, ...existing }
    console.log("[Tweet AI Background] Initializing settings:", settings)
    chrome.storage.sync.set(settings)
  })
})
