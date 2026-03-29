# Android Dev MCP Server

An **offline-first, Windows-compatible** Model Context Protocol (MCP) server for Android development. Use it with **VS Code Copilot Chat** (or any MCP-aware agent) to build, test, deploy, and inspect Android apps—without leaving your editor and without any third-party API keys.

---

## What it does

Exposes the following tools to your AI assistant:

| Tool | Description |
|------|-------------|
| `android_project_detect` | Scan an Android project: modules, flavors, app IDs, signing configs |
| `android_gradle_tasks_list` | List all Gradle tasks (project or module level) |
| `android_gradle_run` | Run any Gradle task (assembleDebug, clean, testDebugUnitTest…) |
| `android_build_apk` | Build an APK for a given module / flavor / build type |
| `android_build_aab` | Build an Android App Bundle (AAB) |
| `android_artifact_verify` | Verify APK/AAB with apksigner, aapt2, bundletool |
| `device_list` | List connected devices & emulators (ADB) |
| `device_install` | Install an APK on a device |
| `device_launch` | Launch an app by package name |
| `device_logcat` | Read recent logcat output |
| `device_screenshot` | Take a screenshot and save locally |
| `device_pull` | Pull a file from the device |
| `device_push` | Push a file to the device |
| `test_instrumentation_run` | Run instrumentation tests (Gradle or ADB) |
| `diagnostics_android_health` | Full SDK / JDK / ADB / toolchain health check |

**Read-only contract:** the server never writes to your source files. It only
invokes build, test, deploy, and device-inspection commands.

---

## Requirements

| Prerequisite | Notes |
|---|---|
| Windows 10/11 | Must run on Windows without WSL |
| [Node.js LTS](https://nodejs.org) ≥ 18 | Download from nodejs.org |
| Android Studio | Includes JBR (Java), SDK, ADB |
| Android SDK | Usually installed by Android Studio |

---

## Step-by-step Windows setup

### Step 1 – Install Node.js LTS

1. Go to <https://nodejs.org> and download the **LTS** installer.
2. Run the installer with default options.
3. Open a new PowerShell window and verify:
   ```powershell
   node --version   # should print v18.x or higher
   npm --version
   ```

### Step 2 – Set environment variables (if not already set)

Android Studio usually sets these automatically. Verify in PowerShell:

```powershell
echo $env:ANDROID_SDK_ROOT
echo $env:JAVA_HOME
```

If they are blank, set them permanently:

```powershell
# Replace paths with your actual locations
[System.Environment]::SetEnvironmentVariable(
    "ANDROID_SDK_ROOT",
    "C:\Users\YourName\AppData\Local\Android\Sdk",
    "User"
)
[System.Environment]::SetEnvironmentVariable(
    "JAVA_HOME",
    "C:\Program Files\Android\Android Studio\jbr",
    "User"
)
```

Then add ADB to your PATH:

```powershell
$oldPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
[System.Environment]::SetEnvironmentVariable(
    "PATH",
    "$oldPath;$env:ANDROID_SDK_ROOT\platform-tools",
    "User"
)
```

Restart PowerShell and confirm:

```powershell
adb version    # should print Android Debug Bridge version …
java -version  # should print java version "17…" or similar
```

### Step 3 – Run the setup script

```powershell
# Allow script execution for your user (one-time)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Navigate to the MCP server folder
cd D:\path\to\Agentruntime\tools\mcp\android-dev

# Run the setup script
.\scripts\Setup-AndroidMCP.ps1
```

The script will:
- Detect `ANDROID_SDK_ROOT` and `JAVA_HOME` automatically.
- Ask you for your Android project root folder(s) (the allowlist).
- Write `android-mcp.config.json`.
- Run `npm install` and `npm run build`.
- Print the **exact VS Code settings snippet** to paste (see Step 4).

### Step 4 – Configure VS Code

1. Open VS Code.
2. Press **Ctrl+Shift+P** → type **"Open User Settings (JSON)"** → Enter.
3. Paste the snippet printed by the setup script. It looks like:

```jsonc
{
  "mcp": {
    "servers": {
      "android-dev": {
        "type": "stdio",
        "command": "node",
        "args": ["D:\\path\\to\\tools\\mcp\\android-dev\\dist\\index.js"],
        "env": {
          "ANDROID_MCP_CONFIG": "D:\\path\\to\\tools\\mcp\\android-dev\\android-mcp.config.json"
        }
      }
    }
  }
}
```

4. Save the file and **restart VS Code**.

### Step 5 – Use it in Copilot Chat

1. Open **GitHub Copilot Chat** (Ctrl+Alt+I or the chat icon in the sidebar).
2. Switch to **Agent mode** (the dropdown at the top of the chat pane → "Agent").
3. Ask Copilot something like:

   > "Run diagnostics on my Android dev environment"
   > "Build a debug APK for my project at D:\MyApp"
   > "List connected devices and install the debug APK"
   > "Show me the last 100 logcat lines filtered to 'MyTag'"

Copilot will automatically invoke the MCP tools as needed.

---

## Configuration reference (`android-mcp.config.json`)

```jsonc
{
  // Root of your Android SDK installation
  "androidSdkRoot": "C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk",

  // JAVA_HOME – Android Studio JBR recommended
  "javaHome": "C:\\Program Files\\Android\\Android Studio\\jbr",

  // Allowlist of project roots. The server refuses to operate outside these.
  // Leave empty ([]) to allow all paths (less secure).
  "allowedProjectRoots": [
    "D:\\my-android-app",
    "D:\\another-project"
  ],

  // Maximum milliseconds any CLI command may run (default 120 000 = 2 min)
  "defaultTimeoutMs": 120000,

  // Override the full path to adb.exe (auto-detected from androidSdkRoot)
  "adbPath": "",

  // Gradle wrapper name (gradlew.bat on Windows)
  "gradlewName": "gradlew.bat",

  // Full path to bundletool JAR (for AAB validation)
  // Download from https://github.com/google/bundletool/releases
  "bundletoolJar": ""
}
```

---

## Troubleshooting

### "adb not found" or "adb is not recognized"

**Cause:** `platform-tools` is not on your PATH, or `androidSdkRoot` is wrong.

**Fix:**
1. Open `android-mcp.config.json` and check `androidSdkRoot`.
2. Confirm `adb.exe` exists at `<androidSdkRoot>\platform-tools\adb.exe`.
3. Or set the full path directly: `"adbPath": "C:\\...\\platform-tools\\adb.exe"`.

### "gradlew.bat not found" / "The system cannot find the file specified"

**Cause:** `projectPath` does not point to the root of an Android project, or
the Gradle wrapper was not committed to the repo.

**Fix:**
1. Make sure you pass the project's root directory (where `gradlew.bat` lives).
2. If `gradlew.bat` is missing, regenerate it:
   ```powershell
   gradle wrapper --gradle-version 8.7
   ```

### JAVA_HOME errors ("Unable to locate a Java Runtime")

**Cause:** `JAVA_HOME` is not set, or it points to the wrong folder.

**Fix:**
1. Open Android Studio → **File → Project Structure → SDK Location**.
2. Copy the **JDK location** shown there.
3. Set it in `android-mcp.config.json` as `javaHome`.

### "device unauthorized" / "no devices/emulators found"

**Cause:** USB debugging is disabled, or the device hasn't trusted the computer.

**Fix:**
1. On your Android phone: **Settings → Developer options → USB debugging** (enable).
2. Reconnect the USB cable.
3. Accept the "Allow USB debugging?" prompt on the phone.
4. Run `adb devices` – the device should show as `device` (not `unauthorized`).

### SDK Manager / missing platforms or build-tools

Run `diagnostics_android_health` first – it tells you exactly what is missing.

To install missing components:
1. Open Android Studio → **Tools → SDK Manager**.
2. Under **SDK Platforms**: install the API level your app targets.
3. Under **SDK Tools**: install **Android SDK Build-Tools**, **Android Emulator**, **Android SDK Platform-Tools**.

### Copilot Chat doesn't show MCP tools

1. Make sure VS Code is version **1.99** or later (MCP support).
2. Confirm the `"mcp"` block is in your **User** `settings.json` (not workspace).
3. Restart VS Code completely.
4. In Copilot Chat, switch to **Agent mode** (not Ask / Edit mode).

---

## Project structure

```
tools/mcp/android-dev/
├── android-mcp.config.json.example   ← copy and rename to android-mcp.config.json
├── package.json
├── tsconfig.json
├── scripts/
│   └── Setup-AndroidMCP.ps1          ← Windows one-click setup
└── src/
    ├── index.ts                       ← MCP server entry point
    ├── config.ts                      ← config loading + path allowlist
    ├── runner.ts                      ← safe CLI runner (no shell, timeouts)
    └── tools/
        ├── project.ts                 ← android_project_detect
        ├── gradle.ts                  ← android_gradle_tasks_list / android_gradle_run
        ├── build.ts                   ← android_build_apk / android_build_aab
        ├── artifact.ts                ← android_artifact_verify
        ├── device.ts                  ← device_list/install/launch/logcat/screenshot/pull/push
        ├── test.ts                    ← test_instrumentation_run
        └── diagnostics.ts             ← diagnostics_android_health
```

---

## Security notes

- **No shell expansion:** all commands are launched with `shell: false` via Node's
  `child_process.spawn`. Arguments are passed as an array, so shell metacharacters
  are never interpreted.
- **Path allowlist:** the `allowedProjectRoots` list limits which directories the
  server will operate on.
- **Denied executables:** `git`, `rm`, `del`, `cmd`, `powershell`, `python`, `node`
  and similar write/shell commands are blocked at the runner level.
- **Source-modifying Gradle tasks:** tasks like `spotlessApply`, `ktlintFormat`,
  `publishToMavenLocal` are denied by name.
- **Timeouts:** every CLI invocation is killed after `defaultTimeoutMs` milliseconds.

---

## License

MIT
