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

## 🤖 Android Dev MCP — GitHub Copilot Chat Tool

A **BYO (bring-your-own-tools)** MCP server for Android development that runs **fully offline** on your local machine. It gives GitHub Copilot Chat the ability to build, test, sign, deploy, and debug Android apps using your own SDK tools — no external API required.

**→ [mcp/android-dev-mcp/README.md](mcp/android-dev-mcp/README.md)**

### Quick start

```bash
cd mcp/android-dev-mcp
npm install && npm run build
cp android-dev-mcp.config.example.json android-dev-mcp.config.json
# Edit android-dev-mcp.config.json with your SDK/keystore paths
node dist/index.js
```

### What it can do for Copilot Chat

| Prompt | Tool used |
|--------|-----------|
| "Run a health check on my Android dev environment" | `diagnostics.android.health` |
| "Build a debug APK for /path/to/MyApp" | `android.build.apk` |
| "Install the APK on emulator-5554 and launch the app" | `device.install` + `device.launch` |
| "Show me the last 500 logcat lines filtered to MyTag" | `device.logcat` |
| "Run instrumentation tests for com.example.app.test" | `test.instrumentation.run` |
| "Sign the release APK with my keystore" | `android.artifact.sign` |

See the full [MCP README](mcp/android-dev-mcp/README.md) for installation instructions (Windows, macOS, Linux), all available tools, and VS Code wiring.
