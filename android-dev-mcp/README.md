# Android Dev MCP Server

**Windows-first · Offline · VS Code Copilot Chat · BYO (Bring Your Own)**

A self-hosted MCP (Model Context Protocol) server that gives GitHub Copilot Chat in VS Code the ability to build, deploy, and debug native Android apps—**completely offline, with no cloud API required.**

---

## What This Does

Once set up, you can ask Copilot Chat things like:

- *"Check my Android dev environment"*
- *"Build the debug APK for my project on D:\agent-lee-voxel-os\agent-lee-android"*
- *"List connected devices"*
- *"Install and launch the app on my phone"*
- *"Stream logcat output for 15 seconds, errors only"*

All commands run locally on your PC. Nothing is sent to any cloud service.

---

## Prerequisites

Before running the setup, make sure you have these installed:

| Requirement | Minimum Version | Download |
|---|---|---|
| **Node.js LTS** | v18 or newer | https://nodejs.org/en/download |
| **Android Studio** | Any recent version | https://developer.android.com/studio |

Android Studio automatically installs:
- The **Android SDK** (includes `adb` and `platform-tools`)
- **JBR** (JetBrains Runtime) — a bundled JDK 17 the MCP will use automatically

---

## Step-by-Step Setup (Windows)

### Step 1 — Copy the folder to your D: drive

Copy the `android-dev-mcp` folder to wherever you want to keep it. For example:

```
D:\android-dev-mcp\
```

Open **PowerShell** and navigate to that folder:

```powershell
cd D:\android-dev-mcp
```

---

### Step 2 — Allow the setup script to run

PowerShell's default security policy blocks scripts. Run this once to allow local scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

When prompted, type `Y` and press Enter.

---

### Step 3 — Run the setup script

```powershell
.\setup.ps1
```

The script will:
1. Verify Node.js is installed and up to date
2. Auto-detect your Android SDK location
3. Auto-detect your JAVA_HOME (Android Studio's bundled JBR)
4. Ask for your paths if they can't be found automatically
5. Save `ANDROID_SDK_ROOT` and `JAVA_HOME` as Windows user environment variables
6. Install the npm dependencies
7. Compile the TypeScript source
8. Print the exact VS Code MCP configuration snippet for you to paste

---

### Step 4 — Add the MCP server to VS Code

At the end of the setup script, you will see a configuration snippet that looks like this:

```json
{
  "mcp": {
    "servers": {
      "android-dev-mcp": {
        "type": "stdio",
        "command": "node",
        "args": ["D:\\android-dev-mcp\\dist\\index.js"],
        "env": {
          "ANDROID_SDK_ROOT": "C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk",
          "JAVA_HOME": "C:\\Program Files\\Android\\Android Studio\\jbr"
        }
      }
    }
  }
}
```

**Option A — VS Code User Settings (applies to every project)**

1. Open VS Code
2. Press `Ctrl+Shift+P` → type **Open User Settings (JSON)**
3. Paste the `"mcp"` block into the JSON file

**Option B — Workspace `.vscode/mcp.json` (applies to one project only)**

1. Open your Android project folder in VS Code
2. Create or edit `.vscode/mcp.json` in the project root
3. Paste the snippet (the `servers` block, without the outer `"mcp"` wrapper)

---

### Step 5 — Restart VS Code and verify

1. Close and reopen VS Code
2. Open **GitHub Copilot Chat** (`Ctrl+Alt+I`)
3. Type:

```
Run health_check using android-dev-mcp
```

You should see a report like:

```
=== Android Dev MCP — Environment Health Check ===

ANDROID_SDK_ROOT : C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME        : C:\Program Files\Android\Android Studio\jbr
adb path         : C:\...\platform-tools\adb.exe
java path        : C:\...\jbr\bin\java.exe
adb reachable    : ✅ YES
java reachable   : ✅ YES

✅ Environment looks good!
```

---

## Verification Flow

Once the server is running, you can do a full end-to-end verification with your device:

### 1. List connected devices

Plug in your Android phone (USB debugging must be ON).

In Copilot Chat:

```
List my connected Android devices
```

Expected output includes your device's serial number and model name. If it says **unauthorized**, see the troubleshooting section below.

---

### 2. Build a debug APK

```
Build a debug APK for D:\agent-lee-voxel-os\agent-lee-android
```

Copilot Chat will run `gradlew.bat :app:assembleDebug` in your project folder and report the APK path on success.

---

### 3. Install the APK on your device

```
Install the APK at D:\agent-lee-voxel-os\agent-lee-android\app\build\outputs\apk\debug\app-debug.apk
```

---

### 4. Launch the app

```
Launch the app with package com.example.agentlee and activity .MainActivity
```

---

### 5. Stream logcat

```
Stream logcat for 15 seconds with filter *:E
```

This shows only error-level log lines from your device for 15 seconds.

---

## Available Tools (Copilot Chat Commands)

| Tool | What it does |
|---|---|
| `health_check` | Verify adb, java, gradlew are all reachable |
| `list_devices` | List connected Android devices and emulators |
| `build_debug_apk` | Run `gradlew.bat assembleDebug` for a project |
| `install_apk` | Install an APK onto a connected device |
| `launch_app` | Start an installed app via `adb shell am start` |
| `logcat` | Capture and return logcat output for a set duration |

Each tool accepts optional `sdkRoot` and `javaHome` overrides so you can use multiple SDK versions side by side.

---

## Safety (Read-Only Guarantee)

This MCP server **never modifies your source code or git repository**. It only:

- **Reads** from your project (gradlew.bat, APK build outputs)
- **Executes** build and deployment commands that you explicitly request
- **Never** commits, pushes, edits source files, or runs `git` write commands

---

## Configuration Reference

The MCP server reads the following environment variables at startup. The `setup.ps1` script sets them automatically:

| Variable | Purpose | Example value |
|---|---|---|
| `ANDROID_SDK_ROOT` | Root of the Android SDK | `C:\Users\YourName\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | JDK or JBR home for builds | `C:\Program Files\Android\Android Studio\jbr` |

You can also pass `sdkRoot` or `javaHome` as a parameter on any individual tool call to override these values per-request.

---

## Troubleshooting

### Device shows "unauthorized" instead of the device name

**Fix:**
1. Unlock your phone
2. Look for the dialog: *"Allow USB debugging from this computer?"*
3. Tap **Allow** (optionally check "Always allow from this computer")
4. If no dialog appears, run this in PowerShell:
   ```powershell
   adb kill-server
   adb start-server
   ```
   Then unplug and replug your USB cable.

---

### `adb` is not found / "adb not reachable"

**Fix:**
1. Open Android Studio
2. Go to **File → Settings → Appearance & Behavior → System Settings → Android SDK**
3. Under **SDK Tools**, check that **Android SDK Platform-Tools** is installed
4. Note the SDK location shown at the top of that dialog
5. Re-run `setup.ps1` and enter that path when prompted

---

### `gradlew.bat` not found

**Fix:**
- Make sure `projectRoot` points to the **root of the Android project** (the folder that directly contains `gradlew.bat`, `build.gradle`, `settings.gradle`, etc.)
- Example: `D:\agent-lee-voxel-os\agent-lee-android` — **not** a subfolder like `app\`

---

### Build fails with "JAVA_HOME not set" or "could not find java"

**Fix:**
1. Run `health_check` to see what JAVA_HOME was detected
2. If it's wrong, re-run `setup.ps1` and enter the correct path when prompted
3. The Android Studio JBR is normally at:
   ```
   C:\Program Files\Android\Android Studio\jbr
   ```
4. You can also pass it per-call: `javaHome: "C:\\Program Files\\Android\\Android Studio\\jbr"`

---

### Build fails when the project path contains spaces

Windows path spaces can confuse some tools. **Fix:**
- Move your project to a path without spaces. For example:
  - ❌ `D:\my projects\agent lee android\`
  - ✅ `D:\agent-lee-android\`
- If you cannot move it, the MCP server automatically quotes paths in all commands, but some Gradle plugins may still have issues.

---

### `Set-ExecutionPolicy` prompts a security warning

This is normal on a fresh Windows install. The command only affects scripts you explicitly run — it does not reduce Windows Defender or antivirus protection. If your organization policy prevents this, ask your IT admin to allow user-scoped execution policy.

---

## Folder Structure

```
android-dev-mcp/
├── src/
│   ├── index.ts          ← MCP server (all tool handlers)
│   └── sdk-detector.ts   ← Auto-detect Android SDK and JAVA_HOME
├── dist/                 ← Compiled JavaScript (created by npm run build)
├── .vscode/
│   └── mcp.json          ← Sample VS Code MCP configuration
├── package.json
├── tsconfig.json
├── setup.ps1             ← One-shot Windows setup script
└── README.md             ← This file
```

---

## Manual Build (if setup.ps1 doesn't work)

```powershell
cd D:\android-dev-mcp
npm install
npm run build
```

Then add the VS Code MCP configuration manually (see Step 4 above).

---

## Updating the Server

To pull the latest version:

```powershell
cd D:\android-dev-mcp
git pull
npm install
npm run build
```

Restart VS Code after updating.
