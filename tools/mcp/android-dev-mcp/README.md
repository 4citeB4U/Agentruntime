# Android Dev MCP Server

A **Windows-first, offline, bring-your-own-SDK** MCP (Model Context Protocol) server for Android development. It lets VS Code Copilot / GitHub Copilot agents and other MCP clients trigger Android build, test, deploy, and device operations through your locally-installed tools — with no cloud uploads and no source-code modifications.

> **Read-only contract:** This MCP server never modifies your project source files.  
> Allowed: build artifacts, install APKs, run tests, logcat, screenshots, pull/push files.  
> Not allowed: edit `.kt/.java/.xml/.gradle` files, `git commit`, `git push`, any formatting that writes files.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install & Setup (Windows)](#2-install--setup-windows)
3. [Configure VS Code](#3-configure-vs-code)
4. [Available Tools](#4-available-tools)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Prerequisites

| Requirement | Where to get it |
|---|---|
| **Node.js LTS** (v18 or v20+) | <https://nodejs.org/en/download> – choose "Windows Installer (.msi) LTS" |
| **Android Studio** | <https://developer.android.com/studio> – installs Android SDK + JBR |
| **Android SDK Platform Tools** (`adb.exe`) | Included with Android Studio, or install via SDK Manager |
| **VS Code** | <https://code.visualstudio.com/> |
| **GitHub Copilot extension** (or another MCP client) | VS Code Extensions marketplace |
| **bundletool** (optional, for `.aab` verification) | <https://github.com/google/bundletool/releases> |
| **Maestro** (optional, for E2E flows) | <https://maestro.mobile.dev/getting-started/installing-maestro> |

---

## 2. Install & Setup (Windows)

### Step 1 – Clone the repo (or `git pull`)

```powershell
git clone https://github.com/4citeB4U/Agentruntime D:\Agentruntime
```

Or, if you already have it:

```powershell
cd D:\Agentruntime
git pull
```

### Step 2 – Install Node.js LTS

Download the Windows LTS installer from <https://nodejs.org/> and run it. Accept defaults. Verify:

```powershell
node --version   # should print v18.x.x or v20.x.x
npm --version
```

### Step 3 – Run the setup script

Open **PowerShell** (or Windows Terminal) and run:

```powershell
cd D:\Agentruntime\tools\mcp\android-dev-mcp
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

The script will:
- Auto-detect your **Android SDK** path (from `ANDROID_SDK_ROOT`, `ANDROID_HOME`, or common locations like `%LOCALAPPDATA%\Android\Sdk`).
- Auto-detect your **Java / JBR** path (from `JAVA_HOME` or the Android Studio installation).
- Look for `bundletool.jar` in common locations.
- Write `android-dev-mcp.config.json` in the `tools/mcp/android-dev-mcp/` folder.
- Build the TypeScript server (`npm install && npm run build`).
- Print the **VS Code snippet** you need in the next step.

#### If your SDK is on D:\ drive

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 `
    -AndroidSdkRoot "D:\Android\Sdk" `
    -JavaHome "D:\Android Studio\jbr" `
    -AllowedWorkingDirs "D:\MyProjects","D:\Agentruntime"
```

#### If paths contain spaces

PowerShell handles spaces in paths automatically when you quote them — the script does this for you. The generated config.json uses full absolute paths in JSON strings, which handles spaces correctly.

### Step 4 – Verify the setup (optional)

```powershell
cd D:\Agentruntime\tools\mcp\android-dev-mcp
node dist\index.js
```

If it prints `Android Dev MCP server running on stdio.` without errors, you're good. Press `Ctrl+C` to stop it — VS Code will start it automatically.

---

## 3. Configure VS Code

### Option A – User Settings (applies to all workspaces)

1. Open VS Code
2. Press `Ctrl+Shift+P` → type **"Open User Settings (JSON)"** → press `Enter`
3. Add the JSON block printed by `setup.ps1` inside the top-level `{}`:

```jsonc
{
  // ... your other settings ...
  "mcp": {
    "servers": {
      "android-dev": {
        "type": "stdio",
        "command": "node",
        "args": ["D:\\Agentruntime\\tools\\mcp\\android-dev-mcp\\dist\\index.js"],
        "env": {
          "ANDROID_MCP_CONFIG": "D:\\Agentruntime\\tools\\mcp\\android-dev-mcp\\android-dev-mcp.config.json"
        }
      }
    }
  }
}
```

### Option B – Workspace `.vscode/mcp.json` (recommended for team use)

Create or edit `.vscode/mcp.json` in your Android project folder:

```json
{
  "servers": {
    "android-dev": {
      "type": "stdio",
      "command": "node",
      "args": ["D:\\Agentruntime\\tools\\mcp\\android-dev-mcp\\dist\\index.js"],
      "env": {
        "ANDROID_MCP_CONFIG": "D:\\Agentruntime\\tools\\mcp\\android-dev-mcp\\android-dev-mcp.config.json"
      }
    }
  }
}
```

### Verify tools are visible

- Open the **Copilot Chat** panel (`Ctrl+Alt+I`)
- Type `@android-dev` or ask: *"what android tools do you have?"*
- You should see the list of 14 tools (diagnostics, build, device, test, etc.)

---

## 4. Available Tools

| Tool | Description |
|---|---|
| `diagnostics.android.health` | Check adb, emulator, aapt2, java versions |
| `android.project.detect` | Detect Android Gradle project metadata |
| `android.gradle.tasks.list` | List all Gradle tasks |
| `android.gradle.run` | Run a read-only Gradle task (lint, test, etc.) |
| `android.build.apk` | Build APK (assembleDebug / assembleRelease) |
| `android.build.aab` | Build Android App Bundle (bundleRelease) |
| `android.artifact.verify` | Verify APK signature / AAB validity |
| `device.list` | List connected devices (`adb devices -l`) |
| `device.install` | Install APK on device |
| `device.launch` | Launch an activity on device |
| `device.logcat` | Bounded logcat dump (max 5000 lines) |
| `device.screenshot` | Take a screenshot and save locally |
| `device.pull` | Pull a file from device |
| `device.push` | Push a file to device |
| `test.instrumentation.run` | Run instrumentation tests via adb |

---

## 5. Troubleshooting

### MCP tools not visible in VS Code

- **Open a folder/workspace**, not just a single file. MCP servers only activate when a workspace is open (`File > Open Folder`).
- Check the `mcp.json` or user settings JSON for typos — paths use `\\` double-backslash in JSON.
- Open **Output panel** (`Ctrl+Shift+U`) → select **"GitHub Copilot"** to see MCP connection errors.
- If using VS Code Profiles, the user settings JSON you edited must match your **active profile**.

### `adb: unauthorized` / device not recognized

```
adb devices
# shows "unauthorized"
```

Unlock your device, look for the "Allow USB debugging?" popup, and tap **Always allow from this computer**.

If the popup doesn't appear:
```powershell
adb kill-server
adb start-server
adb devices
```

### `gradlew: command not found` / `gradlew.bat not found`

The `android.gradle.*` and `android.build.*` tools require a **Gradle wrapper** in your project. If you get this error, run:

```powershell
cd D:\MyAndroidProject
gradle wrapper
```

Or check that your project was cloned completely (`.gitignore` sometimes excludes `gradlew.bat` by mistake).

### SDK on D:\ drive not detected

Run setup explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 `
    -AndroidSdkRoot "D:\Android\Sdk" `
    -JavaHome "D:\Android Studio\jbr"
```

Or manually edit `android-dev-mcp.config.json` in the MCP folder.

### Spaces in paths

Paths with spaces (e.g. `C:\Program Files\Android`) are fully supported. The config JSON stores them as regular JSON strings. If you set `ANDROID_MCP_CONFIG` in `mcp.json`, wrap it in double quotes if using PowerShell, but in the JSON file itself just use the path as-is.

### `JAVA_HOME` not set / wrong Java version

The setup script looks for the Android Studio JBR at common install locations. If not found, it falls back to your system `JAVA_HOME`. To force a specific Java:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 `
    -JavaHome "C:\Program Files\Android\Android Studio\jbr"
```

Minimum required: **Java 17**. The Android Studio JBR ships with Java 17 or 21.

### Running in VS Code remote context (WSL / SSH / Dev Containers)

The MCP server runs on the **host** (Windows). If you open a remote VS Code session (WSL, SSH, container), the `android-dev` MCP server won't be available in that remote — keep it in a local (non-remote) workspace, or set up a separate MCP server inside the remote if needed.

### MCP config not found error

```
Config file not found at .../android-dev-mcp.config.json. Run scripts/setup.ps1 first.
```

Re-run the setup script, or set the `ANDROID_MCP_CONFIG` environment variable to the full path of your config file.

### Updating the server after a `git pull`

```powershell
cd D:\Agentruntime\tools\mcp\android-dev-mcp
npm install
npm run build
```

VS Code picks up the new build automatically on the next tool call.
