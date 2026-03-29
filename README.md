<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agentruntime

This repository contains the AI Studio app source and a Windows-first offline Android Dev MCP server for VS Code + GitHub Copilot Chat.

## Android Dev MCP Server (Windows / VS Code)

The MCP server lives at **`tools/mcp/android-dev-mcp/`**. It gives Copilot Chat tools to build, deploy, test, and debug Android apps without leaving VS Code — fully offline, no cloud required.

### How to pull the latest changes

Open **PowerShell** on your Windows laptop and run:

```powershell
# If you haven't cloned yet:
cd D:\                          # or any folder on D:\
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime

# If you already have a local clone, just pull:
cd D:\Agentruntime              # adjust to your actual path
git pull
```

### Quick setup (one-time)

```powershell
cd tools\mcp\android-dev-mcp
npm install
```

This builds the server automatically (`dist\server.js`).

### Connect to VS Code

Press **Ctrl+Shift+P** in VS Code → **"Preferences: Open User Settings (JSON)"** and add:

```json
{
  "github.copilot.chat.mcp.servers": {
    "android-dev": {
      "command": "node",
      "args": ["D:\\Agentruntime\\tools\\mcp\\android-dev-mcp\\dist\\server.js"],
      "env": {
        "ANDROID_HOME": "D:\\Android\\Sdk",
        "JAVA_HOME": "D:\\Program Files\\Android\\Android Studio\\jbr",
        "ANDROID_PROJECT_ROOT": "D:\\path\\to\\your\\android\\project"
      }
    }
  }
}
```

> Replace the paths with your actual Android SDK and project locations.

**Full setup guide:** [`tools/mcp/android-dev-mcp/README.md`](tools/mcp/android-dev-mcp/README.md)

---

## AI Studio App

View your app in AI Studio: https://ai.studio/apps/7d65f538-1e0e-47d4-a584-a1548323adb0

### Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
