// Popup script for Tweet AI Commenter

document.addEventListener("DOMContentLoaded", async () => {
  const enableToggle = document.getElementById("enableToggle")
  const statusBar = document.getElementById("statusBar")
  const statusText = statusBar.querySelector(".status-message")

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    enabled: true,
    apiEndpoint: "http://0.0.0.0:8000",
  })

  enableToggle.checked = settings.enabled

  // Check connection to API
  async function checkConnection() {
    // Reset classes but keep the base class
    statusBar.className = "status-card"
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

})
