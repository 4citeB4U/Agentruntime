# Android Dev MCP Server

A **Windows-first, offline** MCP (Model Context Protocol) server that gives GitHub Copilot Chat tools to build, deploy, test, and debug Android apps — without leaving VS Code.

## Tools available

| Tool | What it does |
|---|---|
| `list_devices` | List connected ADB devices/emulators |
| `get_device_info` | Get model, Android version, API level, ABI |
| `build_debug_apk` | `gradlew.bat assembleDebug` → returns APK path |
| `build_release_aab` | `gradlew.bat bundleRelease` → returns AAB path |
| `install_apk` | Install APK on device via ADB |
| `run_app` | Launch app's main activity |
| `stop_app` | Force-stop the app |
| `get_logcat` | Capture recent logcat (optionally filtered by package/tag) |
| `run_instrumented_tests` | Run `connectedAndroidTest` on device |
| `run_unit_tests` | Run `testDebugUnitTest` (JVM, no device needed) |
| `take_screenshot` | Capture device screen → PNG file |
| `pull_file` | Pull file/folder from device to local machine |
| `get_android_sdk_info` | Debug SDK/ADB/JAVA_HOME detection |

## Prerequisites

- **Node.js 18+** — [download](https://nodejs.org/)
- **Android Studio** (provides ADB, Gradle, SDK) — you already have this ✓
- A **USB-connected Android phone** with USB debugging enabled, or a running emulator

## Setup (Windows, one-time)

### Step 1 — Clone the repo (if you haven't)

Open **PowerShell** and run:

```powershell
cd D:\                          # or wherever you keep projects
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime
```

### Step 2 — Install and build the MCP server

```powershell
cd tools\mcp\android-dev-mcp
npm install
npm run build
```

This creates `dist\server.js`.

### Step 3 — Find your Android paths

**Android SDK location** (open Android Studio → Settings → Android SDK):
- Usually `D:\Android\Sdk` or `C:\Users\YourName\AppData\Local\Android\Sdk`

**Java/JBR location** (Android Studio → Help → About → "Runtime version"):
- Usually `D:\Program Files\Android\Android Studio\jbr`

### Step 4 — Add the MCP server to VS Code

Open VS Code, press **Ctrl+Shift+P**, type **"Preferences: Open User Settings (JSON)"**, and add:

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

> **Replace** the paths above with your actual paths from Step 3.  
> **Replace** `ANDROID_PROJECT_ROOT` with the folder that contains your `gradlew.bat`.

### Step 5 — Verify it works

In VS Code Copilot Chat, ask:

```
Use the Android MCP tool to list connected devices.
```

If it shows your device, you're all set! Try:

```
Build a debug APK for my project at D:\MyAndroidApp
Install it on my phone and launch the main activity.
Start logcat and show me the last 100 lines for com.example.myapp.
```

## Troubleshooting

### "ADB not found"
Run `get_android_sdk_info` in Copilot Chat to see what paths are detected. Set `ANDROID_HOME` in the MCP env config to your actual SDK path.

### "Gradle wrapper not found"
Make sure `ANDROID_PROJECT_ROOT` points to the folder containing `gradlew.bat` (the Android project root).

### MCPs not showing up in VS Code
- Make sure you opened a **folder** in VS Code (File → Open Folder), not a single file.
- Settings go in **User Settings** (Ctrl+Shift+P → "Open User Settings (JSON)") so they apply globally.
- Restart VS Code after editing settings.

### Phone not detected
- Enable **USB Debugging** on your phone: Settings → Developer Options → USB Debugging.
- Trust the computer when prompted on your phone.
- Run `adb devices` in PowerShell to verify ADB sees your device.

## Environment variables reference

| Variable | Default (Windows) | Description |
|---|---|---|
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` | Android SDK root |
| `ANDROID_SDK_ROOT` | Same as `ANDROID_HOME` | Alias for `ANDROID_HOME` |
| `JAVA_HOME` | (system) | JDK/JBR path |
| `ADB_PATH` | Auto-detected from `ANDROID_HOME` | Full path to `adb.exe` |
| `ANDROID_PROJECT_ROOT` | Current directory | Your Android project root |
