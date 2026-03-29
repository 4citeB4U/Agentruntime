# BYO Android Dev MCP Server

> **Windows-only · Read-only build/test/deploy/ADB toolset · GitHub Copilot Chat integration**
> 
> Uses Android Studio JBR (JDK 17) and targets Android SDK on D: drive by default.

---

## Overview

This is a self-hosted [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for
**Android development, engineering, and deployment**.  It exposes a curated toolset to GitHub
Copilot Chat (and any other MCP-compatible agent) so the agent can build, test, inspect, and
deploy Android apps — **without any third-party cloud services**.

### What this server does
- **Builds** Android projects via the Gradle wrapper (`gradlew.bat`)
- **Tests** with JVM unit tests and connected instrumentation tests
- **Deploys** APKs to connected devices via ADB
- **Operates devices** — logcat, screenshots, UI hierarchy, file pull/push
- **Diagnoses** the dev environment (SDK, JDK, ADB, Gradle, project structure)

### What this server explicitly does NOT do ❌
This server is **read-only with respect to repository files**.  The following tools are
intentionally **absent** and will never be added to this server:

| Category | Excluded operations |
|---|---|
| Source editing | Write/create/overwrite Kotlin, Java, XML, Gradle source files |
| Config editing | Edit `AndroidManifest.xml`, `build.gradle`, `settings.gradle`, resource files |
| File deletion | Delete repository files or directories |
| Version control | `git add`, `git commit`, `git push` |
| Secrets | Write or modify `.env`, keystore, or service-account files |
| Arbitrary shell | Execute shell commands that redirect output to repository paths |

File modification must be done through the IDE (Android Studio or VS Code built-in editor /
Copilot inline chat).

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Windows | 10 / 11 | 64-bit recommended |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org/) |
| Android Studio | Latest stable | Provides JBR JDK 17 + SDK |
| Android SDK | API 24+ recommended | Installed via Android Studio SDK Manager |
| ADB | via platform-tools | Part of Android SDK |

---

## Installation on D: Drive (Recommended)

### Quick install (PowerShell)

Open a **PowerShell** terminal (no admin required for D: drive) and run:

```powershell
# Clone the repo somewhere first, e.g.:
git clone https://github.com/4citeB4U/Agentruntime C:\src\Agentruntime

# Then run the installer (defaults to D:\mcp-android-dev)
& "C:\src\Agentruntime\mcp-android-dev\scripts\install-windows.ps1"
```

#### Custom paths example

```powershell
& "C:\src\Agentruntime\mcp-android-dev\scripts\install-windows.ps1" `
    -InstallPath    "D:\tools\mcp-android-dev" `
    -AndroidSdkRoot "D:\android-sdk" `
    -JavaHome       "D:\Android Studio\jbr" `
    -ProjectRoot    "D:\agent-lee-voxel-os\agent-lee-android"
```

The installer will:
1. Check Node.js ≥ 18
2. Copy server source to your chosen install path
3. Run `npm install`
4. Compile TypeScript → `dist/`
5. Create a `.env` pre-filled with your paths
6. Print the VS Code / Copilot Chat config snippet

### Manual install

```powershell
# 1. Copy the mcp-android-dev folder to D:\mcp-android-dev
Copy-Item -Recurse .\mcp-android-dev D:\mcp-android-dev

# 2. Install dependencies
cd D:\mcp-android-dev
npm install

# 3. Build TypeScript
npx tsc

# 4. Create .env
Copy-Item .env.example .env
# Then edit D:\mcp-android-dev\.env (see Configuration section below)
```

---

## Configuration

### Environment variables

All configuration is via environment variables (`.env` file or system/user env vars).

| Variable | Description | Default |
|---|---|---|
| `ANDROID_SDK_ROOT` | Android SDK root directory | `D:\android-sdk` |
| `ANDROID_HOME` | Alias for `ANDROID_SDK_ROOT` | same as above |
| `JAVA_HOME` | Android Studio JBR (JDK 17) home | `C:\Program Files\Android\Android Studio\jbr` |
| `ANDROID_PROJECT_ROOT` | Root of the Android project to build | `D:\agent-lee-voxel-os\agent-lee-android` |
| `ADB_PATH` | Full path to `adb.exe` | `%ANDROID_SDK_ROOT%\platform-tools\adb.exe` |
| `GRADLE_WRAPPER` | Gradle wrapper filename | `gradlew.bat` |
| `BUILD_TIMEOUT_MS` | Gradle build timeout (ms) | `300000` (5 min) |
| `ADB_TIMEOUT_MS` | ADB command timeout (ms) | `30000` (30 s) |
| `MCP_TRANSPORT` | Transport type (`stdio`) | `stdio` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Example `.env` file

```env
# D: drive Android SDK
ANDROID_SDK_ROOT=D:\android-sdk
ANDROID_HOME=D:\android-sdk

# Android Studio JBR (JDK 17) — adjust for your Studio install path
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

# Your Android project
ANDROID_PROJECT_ROOT=D:\agent-lee-voxel-os\agent-lee-android

MCP_TRANSPORT=stdio
LOG_LEVEL=info
```

### Finding your Android Studio JBR path

In Android Studio: **File → Project Structure → SDK Location → JDK Location**

Typical Windows paths:
- `C:\Program Files\Android\Android Studio\jbr` (default Studio install)
- `D:\Android Studio\jbr` (if you installed Studio on D: drive)

### Setting environment variables permanently in PowerShell

```powershell
# Set machine-wide (requires admin for Machine scope; use User scope if needed)
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT',     'D:\android-sdk',                                    'Machine')
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME',         'D:\android-sdk',                                    'Machine')
[System.Environment]::SetEnvironmentVariable('JAVA_HOME',            'C:\Program Files\Android\Android Studio\jbr',        'Machine')

# Set per-user (no admin required)
[System.Environment]::SetEnvironmentVariable('ANDROID_PROJECT_ROOT', 'D:\agent-lee-voxel-os\agent-lee-android', 'User')

# Add platform-tools and JBR bin to PATH (machine-wide)
$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
[System.Environment]::SetEnvironmentVariable('PATH',
    "D:\android-sdk\platform-tools;C:\Program Files\Android\Android Studio\jbr\bin;$currentPath",
    'Machine')
```

### Setting environment variables in a PowerShell session

Add to your `$PROFILE` (`~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`):

```powershell
$env:ANDROID_SDK_ROOT        = 'D:\android-sdk'
$env:ANDROID_HOME            = 'D:\android-sdk'
$env:JAVA_HOME               = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_PROJECT_ROOT    = 'D:\agent-lee-voxel-os\agent-lee-android'
$env:PATH = "D:\android-sdk\platform-tools;C:\Program Files\Android\Android Studio\jbr\bin;$env:PATH"
```

---

## Connecting to GitHub Copilot Chat (VS Code)

### Option A — `.vscode/mcp.json` (workspace, recommended)

Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "android-dev": {
      "type": "stdio",
      "command": "node",
      "args": ["D:\\mcp-android-dev\\dist\\index.js"],
      "env": {
        "ANDROID_SDK_ROOT":        "D:\\android-sdk",
        "ANDROID_HOME":            "D:\\android-sdk",
        "JAVA_HOME":               "C:\\Program Files\\Android\\Android Studio\\jbr",
        "ANDROID_PROJECT_ROOT":    "D:\\agent-lee-voxel-os\\agent-lee-android"
      }
    }
  }
}
```

### Option B — VS Code User `settings.json`

Open **File → Preferences → Settings → Open Settings (JSON)** and add:

```json
{
  "github.copilot.chat.mcpServers": {
    "android-dev": {
      "command": "node",
      "args": ["D:\\mcp-android-dev\\dist\\index.js"],
      "env": {
        "ANDROID_SDK_ROOT":     "D:\\android-sdk",
        "ANDROID_HOME":         "D:\\android-sdk",
        "JAVA_HOME":            "C:\\Program Files\\Android\\Android Studio\\jbr",
        "ANDROID_PROJECT_ROOT": "D:\\agent-lee-voxel-os\\agent-lee-android"
      }
    }
  }
}
```

> **Note:** Use double backslashes (`\\`) inside JSON strings for Windows paths.

---

## Available Tools

### Build tools (`android_build_*`)

| Tool | Description |
|---|---|
| `android_build_list_tasks` | List all Gradle tasks in the project |
| `android_build_assemble_apk` | Assemble debug or release APK |
| `android_build_bundle_aab` | Build Android App Bundle (AAB) |
| `android_build_lint` | Run Android Lint |
| `android_build_dependencies` | Show Gradle dependency tree |
| `android_build_signing_report` | Show signing key fingerprints |
| `android_build_list_artifacts` | List built APK/AAB files |

### Test tools (`android_test_*`)

| Tool | Description |
|---|---|
| `android_test_unit` | Run JVM unit tests |
| `android_test_instrumentation` | Run connected instrumentation tests |
| `android_test_collect_reports` | List test report files from build output |

### ADB / Device tools (`adb_*`)

| Tool | Description |
|---|---|
| `adb_list_devices` | List connected devices/emulators |
| `adb_device_properties` | Get device system properties (`getprop`) |
| `adb_install_apk` | Install APK via `adb install` |
| `adb_launch_activity` | Launch an activity via `am start` |
| `adb_logcat` | Capture logcat output |
| `adb_screenshot` | Take a device screenshot |
| `adb_pull_file` | Pull a file from the device |
| `adb_push_file` | Push a file to the device |
| `adb_ui_hierarchy` | Dump UI hierarchy (uiautomator) |
| `adb_list_packages` | List installed packages |
| `adb_uninstall_package` | Uninstall a package |
| `adb_device_shell` | Run a read-only diagnostic shell command |
| `adb_start_emulator` | Start an emulator by AVD name |

### Deploy tools (`deploy_*`)

| Tool | Description |
|---|---|
| `deploy_sideload_apk` | Install pre-built APK to device |
| `deploy_fastlane_lane` | Run a fastlane lane |
| `deploy_list_fastlane_lanes` | List available fastlane lanes |
| `deploy_play_publish` | Publish to Google Play (requires service account key) |

### Diagnostics (`android_dev_health`)

| Tool | Description |
|---|---|
| `android_dev_health` | Full dev environment health check (SDK, JDK, ADB, Gradle, project) |

---

## Example Copilot Chat usage

```
@copilot run android_dev_health to check my environment
@copilot build a debug APK for the app module
@copilot list all connected Android devices
@copilot show logcat for my device
@copilot install the debug APK on my device and launch MainActivity
```

---

## Project structure

```
mcp-android-dev/
├── src/
│   ├── index.ts          # MCP server entry point + tool registration
│   ├── config.ts         # Windows path configuration + validation
│   ├── runner.ts         # Safe Windows subprocess runner (cmd /C)
│   └── tools/
│       ├── build.ts      # Gradle build tools
│       ├── test.ts       # Test execution tools
│       ├── deploy.ts     # Deploy/release tools
│       ├── adb.ts        # ADB device operations
│       └── diagnostics.ts # Dev environment health checks
├── scripts/
│   └── install-windows.ps1  # Windows installer script
├── dist/                 # Compiled JS (after npm run build)
├── .env.example          # Environment variable template
├── package.json
├── tsconfig.json
└── README.md             # This file
```

---

## Troubleshooting

### `adb` not found
Ensure Android SDK `platform-tools` is installed:
- Android Studio → SDK Manager → SDK Tools → Android SDK Platform-Tools ✓

### Java version mismatch
Run `android_dev_health` to see what Java version is detected.  Set `JAVA_HOME` to the
JBR inside your Android Studio install:

```powershell
# Find it:
Get-ChildItem "C:\Program Files\Android\Android Studio\jbr" -ErrorAction SilentlyContinue
Get-ChildItem "D:\Android Studio\jbr" -ErrorAction SilentlyContinue
```

### `gradlew.bat` not found
Ensure your Android project has a Gradle wrapper:
```powershell
cd $env:ANDROID_PROJECT_ROOT
.\gradlew.bat --version
```

If missing, regenerate it from Android Studio: **File → Project Structure → Project → Gradle Version**.

### Execution Policy errors (PowerShell)
If the install script is blocked by execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Security notes

- **No repository writes**: this server never writes to or deletes repository source files.
- **No secrets in source**: keep your `.env` file local; it is listed in `.gitignore`.
- **Path validation**: ADB device paths are validated against path traversal (`..` sequences).
- **Shell injection prevention**: all subprocess calls use explicit argument arrays (no shell interpolation of user input).
- **Play Store credentials**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is only required if you use the optional `deploy_play_publish` tool; all other tools work without it.

---

## License

MIT
