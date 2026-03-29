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

## Android Dev MCP Server

An offline, Windows-first MCP server that gives VS Code Copilot/agents the ability to build, test, deploy, and inspect Android apps using your local SDK tools — without modifying any source files.

**Location:** [`tools/mcp/android-dev-mcp/`](tools/mcp/android-dev-mcp/)

**Quick start:**
```powershell
cd tools\mcp\android-dev-mcp
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

See the full [Android Dev MCP README](tools/mcp/android-dev-mcp/README.md) for step-by-step setup instructions, VS Code configuration, and troubleshooting.
