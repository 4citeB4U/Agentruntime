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

---

## MCP (Model Context Protocol) Servers

This repository includes a **BYO Android Dev MCP server** that exposes read-only Android
build/test/deploy tooling to GitHub Copilot Chat in VS Code.

### Quick Start (Windows)

**Prerequisites:** VS Code ≥ 1.99, GitHub Copilot + Copilot Chat extensions, Node.js LTS, Android Studio (JBR / JDK 17), Android SDK.

```powershell
# 1. Open this folder as a workspace (not a single file!)
code D:\Agentruntime

# 2. Build the MCP server
cd D:\Agentruntime\mcp-server
npm install
npm run build

# 3. Run the diagnostic script to verify everything is configured correctly
cd D:\Agentruntime
.\scripts\validate-mcp.ps1

# 4. In VS Code: Ctrl+Shift+P → "MCP: List Servers" → android-dev should appear as Running
```

### Editing your local paths

Open `.vscode/mcp.json` and update the `env` block for the `android-dev` server:

```jsonc
"env": {
  "ANDROID_HOME": "D:\\Android\\Sdk",          // ← your Android SDK path
  "JAVA_HOME":    "C:\\Program Files\\Android\\Android Studio\\jbr",  // ← your JBR path
  "ANDROID_PROJECT_DIR": "${workspaceFolder}"   // ← Android project root
}
```

### Available MCP tools

| Tool | Description |
|---|---|
| `adb_devices` | List connected devices / emulators |
| `adb_logcat` | Dump logcat from a device |
| `adb_install` | Install an APK |
| `adb_screenshot` | Capture a device screenshot |
| `gradle_build` | Build with `gradlew assemble<Variant>` |
| `gradle_test` | Run unit tests |
| `gradle_lint` | Run Android Lint (read-only) |
| `gradle_tasks` | List all Gradle tasks |
| `emulator_list` | List available AVDs |
| `emulator_start` | Start an AVD |
| `sdk_info` | Show installed SDK packages and Java version |

### Troubleshooting

See the detailed guide: **[MCP-TROUBLESHOOTING.md](./MCP-TROUBLESHOOTING.md)**

Topics covered:
- Where MCP configuration should live (user settings vs `.vscode/mcp.json`)
- How to open the correct folder as a workspace
- Common causes (multi-root workspaces, single-file open, profiles, extensions disabled per-workspace)
- Remote contexts: WSL, SSH, Dev Containers
- Quick diagnostic checklist
- Windows path reference

---

# Agentruntime
