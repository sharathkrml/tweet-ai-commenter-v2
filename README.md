# ✨ Tweet AI Commenter V2

An AI-powered Chrome extension that generates thoughtful, witty, and engaging replies for Twitter/X. Stop staring at a blank reply box and let AI give you a head start with multiple personas.

![Tweet AI Demo](https://via.placeholder.com/800x450.png?text=Tweet+AI+Commenter+Demo) <!-- Replace with actual demo image/gif if available -->

## 🚀 Key Features

- **In-Tweet Integration**: Adds a dedicated "AI" button directly to the Twitter/X action bar.
- **Style Variations**: Generate 6 different styles for every tweet:
  - 😏 **Witty**: Light, smart, and approachable.
  - 👔 **Professional**: Grounded, experience-backed, and calm.
  - 💪 **Supportive**: Empathetic and validating.
  - 😂 **Humorous**: Self-aware, laughing with builders.
  - 🙄 **Sarcastic**: Light sarcasm aimed at systems/ideas.
  - 🤔 **Thoughtful**: Nuanced and curious.
- **Interactive Sidebar**: Preview all styles at once, edit them, and copy with one click.
- **Flexible AI Providers**:
  - **OpenRouter**: Use any modern LLM (Llama 3, Claude, GPT-4, etc.) via OpenRouter.
  - **Generic API**: Connect to your own local backend (Ollama, self-hosted FastAPI).

## 🛠️ Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked** and select the `tweet-ai-commenter-v2` folder.

## ⚙️ Configuration

1. Click the extension icon in your toolbar and select **Settings** (or right-click the icon and choose Options).
2. Choose your preferred AI provider:
   - **OpenRouter**: Enter your API Key and Model ID (default is `meta-llama/llama-3.1-8b-instruct:free`).
   - **Generic API**: Point the extension to your local or hosted API endpoint (default: `http://0.0.0.0:8000`).
3. (Optional) Provide a **Custom System Prompt** to override the default persona.
4. Hit **Save Settings**.

## 💻 Tech Stack

- **Manifest V3**: Modern Chrome extension architecture.
- **Vanilla JavaScript & CSS**: Fast, lightweight, and no heavy dependencies.
- **Fetch API**: For seamless communication with AI backends.

## 📂 Project Structure

- `content.js/css`: Handles UI injection and interaction on Twitter/X.
- `background.js`: Manages API calls and settings.
- `prompts.js`: Contains the persona logic and style guidelines.
- `options.html/js`: The settings dashboard.
- `popup.html/js`: Main extension popup.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the prompts, UI, or backend integrations.

---

Built with ❤️ by [sharathkrml](https://github.com/sharathkrml)
