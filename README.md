<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7d65f538-1e0e-47d4-a584-a1548323adb0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# Agentruntime
# Agentruntime

---

## 🤖 Android Dev MCP Server

An **offline-first, Windows-compatible** MCP server for Android development—build, test, deploy and inspect Android apps directly from **VS Code Copilot Chat** without any third-party API keys.

📁 **Location:** [`tools/mcp/android-dev/`](tools/mcp/android-dev/)

📖 **Full documentation & Windows setup guide:** [`tools/mcp/android-dev/README.md`](tools/mcp/android-dev/README.md)

### Quick start (Windows)

```powershell
# 1. Install Node.js LTS from https://nodejs.org if not already installed

# 2. Allow script execution (one-time)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 3. Run the setup wizard
cd tools\mcp\android-dev
.\scripts\Setup-AndroidMCP.ps1
```

The setup script detects your Android SDK, Java (Android Studio JBR), builds the server, and prints the exact snippet to paste into your VS Code `settings.json`.
