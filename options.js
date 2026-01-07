// Options page script

document.addEventListener("DOMContentLoaded", async () => {
  const openrouterApiKey = document.getElementById("openrouterApiKey")
  const openrouterModel = document.getElementById("openrouterModel")
  const customPrompt = document.getElementById("customPrompt")
  const saveBtn = document.getElementById("saveBtn")
  const resetBtn = document.getElementById("resetBtn")
  const successMessage = document.getElementById("successMessage")

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    apiEndpoint: "http://0.0.0.0:8000",
    openrouterApiKey: "",
    openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
    customPrompt: "",
  })

  apiEndpoint.value = settings.apiEndpoint
  openrouterApiKey.value = settings.openrouterApiKey
  openrouterModel.value = settings.openrouterModel
  customPrompt.value = settings.customPrompt

  // Save settings
  saveBtn.addEventListener("click", async () => {
    await chrome.storage.sync.set({
      apiEndpoint: apiEndpoint.value || "http://0.0.0.0:8000",
      openrouterApiKey: openrouterApiKey.value,
      openrouterModel: openrouterModel.value || "meta-llama/llama-3.1-8b-instruct:free",
      customPrompt: customPrompt.value,
    })

    successMessage.classList.add("show")
    setTimeout(() => {
      successMessage.classList.remove("show")
    }, 3000)
  })

  // Reset to defaults
  resetBtn.addEventListener("click", async () => {
    apiEndpoint.value = "http://0.0.0.0:8000"
    openrouterApiKey.value = ""
    openrouterModel.value = "meta-llama/llama-3.1-8b-instruct:free"
    customPrompt.value = ""

    await chrome.storage.sync.set({
      apiEndpoint: "http://0.0.0.0:8000",
      openrouterApiKey: "",
      openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
      customPrompt: "",
      commentStyle: "witty",
      enabled: true,
    })

    successMessage.textContent = "✅ Settings reset to defaults!"
    successMessage.classList.add("show")
    setTimeout(() => {
      successMessage.classList.remove("show")
      successMessage.textContent = "✅ Settings saved successfully!"
    }, 3000)
  })
})
