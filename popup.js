// Popup script for Tweet AI Commenter

document.addEventListener("DOMContentLoaded", async () => {
  const enableToggle = document.getElementById("enableToggle")
  const styleSelect = document.getElementById("styleSelect")
  const statusBar = document.getElementById("statusBar")
  const statusText = statusBar.querySelector(".status-text")

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    enabled: true,
    commentStyle: "witty",
    apiEndpoint: "http://0.0.0.0:8000",
  })

  enableToggle.checked = settings.enabled
  styleSelect.value = settings.commentStyle

  // Check connection to API
  async function checkConnection() {
    statusBar.className = "status-bar"
    statusText.textContent = "Checking connection..."

    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkConnection",
      })

      if (response.connected) {
        statusBar.classList.add("connected")
        statusText.textContent = `Connected: ${response.provider || "API"}`
      } else {
        statusBar.classList.add("error")
        statusText.textContent = "Not connected. Is the API running?"
      }
    } catch (error) {
      statusBar.classList.add("error")
      statusText.textContent = "Connection error"
    }
  }

  await checkConnection()

  // Save settings on change
  enableToggle.addEventListener("change", () => {
    const enabled = enableToggle.checked
    chrome.storage.sync.set({ enabled })
    document.body.classList.toggle("disabled", !enabled)
  })


  styleSelect.addEventListener("change", () => {
    chrome.storage.sync.set({ commentStyle: styleSelect.value })
  })
})
