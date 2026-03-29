# Android Dev MCP

A **BYO (bring-your-own-tools)** MCP server for Android development that runs **100% locally** (offline-first). It wraps your existing Android CLI tools behind a cohesive tool schema so GitHub Copilot Chat can build, test, sign, deploy, and debug Android apps on your machine — no external API required.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Windows (PowerShell)](#windows-powershell)
  - [macOS](#macos)
  - [Linux](#linux)
- [Configuration](#configuration)
- [Wiring into VS Code (Copilot Chat)](#wiring-into-vs-code-copilot-chat)
- [Available Tools](#available-tools)
- [Example Copilot Chat Prompts](#example-copilot-chat-prompts)
- [Tests](#tests)
- [Security & Safety Rails](#security--safety-rails)
- [Troubleshooting](#troubleshooting)

---

## Features

| Category | Tools |
|---|---|
| Project inspection | `android.project.detect` |
| Gradle | `android.gradle.tasks`, `android.gradle.run`, `android.build.apk`, `android.build.aab` |
| Signing & verification | `android.artifact.sign`, `android.artifact.verify` |
| Device & emulator | `device.list`, `device.install`, `device.launch`, `device.logcat`, `device.screenshot`, `device.pull`, `device.push` |
| Testing | `test.instrumentation.run`, `test.maestro.run` |
| Diagnostics | `diagnostics.android.health` |

- **Offline-first**: zero external network calls, all operations run through local CLIs.
- **Safety rails**: command timeouts, working-directory allowlist, automatic secret redaction in logs.
- **Config-file + env-var driven**: no credentials hardcoded anywhere.
- **Cross-platform**: Windows, macOS, Linux.

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| Android SDK | Any recent | `adb`, `apksigner`, `aapt2` live inside |
| Java (JDK) | 11+ | Required for Gradle and bundletool |
| Git | Any | Only if you clone this repo |

Optional (for extra tools):

- **Maestro** — E2E mobile testing framework
- **fastlane** — release automation

---

## Installation

### Windows (PowerShell)

```powershell
# 1. Clone or download the repo
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime\mcp\android-dev-mcp

# 2. Install dependencies
npm install

# 3. Build the TypeScript source
npm run build

# 4. Copy and edit the config file
Copy-Item android-dev-mcp.config.example.json android-dev-mcp.config.json
notepad android-dev-mcp.config.json   # set androidSdk, keystore, etc.

# 5. Set keystore password env vars (PowerShell session)
$env:KEYSTORE_STORE_PASSWORD = "your-store-pass"
$env:KEYSTORE_KEY_PASSWORD   = "your-key-pass"

# 6. Test the server starts
node dist/index.js
# You should see: [android-dev-mcp] Server started (stdio transport)
# Press Ctrl+C to stop.
```

### macOS

```bash
# 1. Clone the repo (skip if already done)
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime/mcp/android-dev-mcp

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Copy and edit config
cp android-dev-mcp.config.example.json android-dev-mcp.config.json
# Edit android-dev-mcp.config.json with your SDK path, keystore, etc.
# e.g. "androidSdk": "/Users/yourname/Library/Android/sdk"

# 5. Set keystore passwords (add to ~/.zshrc or ~/.bash_profile for persistence)
export KEYSTORE_STORE_PASSWORD="your-store-pass"
export KEYSTORE_KEY_PASSWORD="your-key-pass"

# 6. Test the server starts
node dist/index.js
```

### Linux

```bash
# 1. Clone or download
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime/mcp/android-dev-mcp

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Copy and edit config
cp android-dev-mcp.config.example.json android-dev-mcp.config.json
# Edit android-dev-mcp.config.json — typical SDK path:
# "androidSdk": "/home/yourname/Android/Sdk"

# 5. Set keystore passwords (add to ~/.bashrc for persistence)
export KEYSTORE_STORE_PASSWORD="your-store-pass"
export KEYSTORE_KEY_PASSWORD="your-key-pass"

# 6. Test the server
node dist/index.js
```

---

## Configuration

Create `android-dev-mcp.config.json` next to the `package.json` (or at `~/.android-dev-mcp.config.json` for a user-wide config):

```jsonc
{
  // Required: path to Android SDK root
  "androidSdk": "/home/user/Android/Sdk",

  // Optional: explicit JAVA_HOME (auto-detected from env if not set)
  "javaHome": "/usr/lib/jvm/java-17-openjdk-amd64",

  // Optional overrides — auto-detected from androidSdk if omitted
  "adb": "",
  "apksigner": "",
  "aapt2": "",
  "emulator": "",
  "avdmanager": "",

  // gradlew path — resolved relative to each project dir by default
  "gradlew": "./gradlew",

  // Optional tools
  "bundletool": "/usr/local/bin/bundletool.jar",
  "maestro": "/usr/local/bin/maestro",
  "fastlane": "/usr/local/bin/fastlane",

  // Signing — passwords come from env vars, NEVER hardcode them here
  "keystore": {
    "path": "/home/user/.android/release.keystore",
    "alias": "release",
    "storePasswordEnv": "KEYSTORE_STORE_PASSWORD",
    "keyPasswordEnv": "KEYSTORE_KEY_PASSWORD"
  },

  // Security: restrict commands to these directories (empty = no restriction)
  "workingDirectories": [
    "/home/user/projects"
  ],

  // Timeout for each spawned command in ms (default 5 minutes)
  "commandTimeoutMs": 300000,

  // Cap on logcat lines returned (default 2000)
  "logcatMaxLines": 2000,

  // Always false — hard-coded offline rail
  "allowExternalNetworkCalls": false
}
```

### Environment variable reference

| Variable | Purpose |
|---|---|
| `ANDROID_SDK_ROOT` / `ANDROID_HOME` | Android SDK path (overrides `androidSdk` in config) |
| `JAVA_HOME` | JDK path |
| `KEYSTORE_STORE_PASSWORD` | Keystore store password (name is configurable) |
| `KEYSTORE_KEY_PASSWORD` | Key password (name is configurable) |
| `ANDROID_MCP_CONFIG` | Absolute path to the config JSON file |

---

## Wiring into VS Code (Copilot Chat)

1. Open your VS Code user settings (`Ctrl+,` → open JSON).
2. Add the MCP server entry:

```jsonc
{
  "github.copilot.chat.mcpServers": {
    "android-dev": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/android-dev-mcp/dist/index.js"],
      "env": {
        "ANDROID_SDK_ROOT": "/home/user/Android/Sdk",
        "KEYSTORE_STORE_PASSWORD": "${env:KEYSTORE_STORE_PASSWORD}",
        "KEYSTORE_KEY_PASSWORD": "${env:KEYSTORE_KEY_PASSWORD}"
      }
    }
  }
}
```

3. Reload VS Code and open Copilot Chat — the Android tools will appear under **MCP Tools**.

---

## Available Tools

### `android.project.detect`
Detect and inspect an Android project structure.

```
Input:  { projectDir: "/path/to/MyApp" }
Output: Modules, build variants, Gradle version, SDK path
```

### `android.gradle.tasks`
List Gradle tasks (optionally filter by name).

```
Input:  { projectDir: "/path/to/MyApp", module: "app", filter: "assemble" }
Output: Task list from ./gradlew tasks --all
```

### `android.gradle.run`
Run any Gradle task.

```
Input:  { projectDir: "/path/to/MyApp", task: ":app:assembleDebug" }
Output: Gradle build output
```

### `android.build.apk`
Build an APK for a given module/variant.

```
Input:  { projectDir: "/path/to/MyApp", module: "app", variant: "debug" }
Output: Build output + path to generated APK(s)
```

### `android.build.aab`
Build an Android App Bundle.

```
Input:  { projectDir: "/path/to/MyApp", module: "app", variant: "release" }
Output: Build output + path to generated AAB(s)
```

### `android.artifact.sign`
Sign an APK or AAB with the configured keystore.

```
Input:  { artifactPath: "/path/to/app-release.apk" }
Output: apksigner output
```

### `android.artifact.verify`
Verify an APK or AAB signature.

```
Input:  { artifactPath: "/path/to/app-release.apk", verbose: true }
Output: Certificate info from apksigner
```

### `device.list`
List connected devices and emulators.

```
Input:  {}
Output: adb devices -l output
```

### `device.install`
Install an APK on a device.

```
Input:  { apkPath: "/path/to/app.apk", deviceId: "emulator-5554" }
Output: adb install output
```

### `device.launch`
Launch an app on a device.

```
Input:  { packageName: "com.example.app", activityName: ".MainActivity" }
Output: am start output
```

### `device.logcat`
Capture logcat (bounded by default).

```
Input:  { filter: "MyTag:D *:S", maxLines: 500, dumpAndExit: true }
Output: Filtered logcat lines (capped to maxLines)
```

### `device.screenshot`
Take a screenshot and save locally.

```
Input:  { outputPath: "/tmp/screen.png" }
Output: Path to saved PNG
```

### `device.pull`
Pull a file/directory from device.

```
Input:  { remotePath: "/sdcard/Download/file.txt", localPath: "/tmp/file.txt" }
Output: adb pull output
```

### `device.push`
Push a file/directory to device.

```
Input:  { localPath: "/tmp/data.json", remotePath: "/sdcard/Download/data.json" }
Output: adb push output
```

### `test.instrumentation.run`
Run Android instrumentation tests.

```
Input:  {
  packageName: "com.example.app.test",
  testRunner: "androidx.test.runner.AndroidJUnitRunner",
  testClass: "com.example.app.LoginTest"
}
Output: am instrument output
```

### `test.maestro.run`
Run a Maestro E2E flow (requires Maestro installed).

```
Input:  { flowPath: "/path/to/login.yaml" }
Output: Maestro test output
```

### `diagnostics.android.health`
Full environment health check.

```
Input:  {}
Output: Checklist: SDK, JDK, adb, apksigner, aapt2, bundletool,
        emulator, keystore, offline mode
```

---

## Example Copilot Chat Prompts

```
@android-dev Run a health check on my Android dev environment.
```

```
@android-dev Detect the project structure of /home/user/projects/MyApp.
```

```
@android-dev Build a debug APK for the app module in /home/user/projects/MyApp.
```

```
@android-dev List all connected devices, then install the latest debug APK and launch com.example.myapp.
```

```
@android-dev Run the instrumentation tests for com.example.app.test on emulator-5554.
```

```
@android-dev Sign /home/user/projects/MyApp/app/build/outputs/apk/release/app-release-unsigned.apk.
```

```
@android-dev Take a screenshot from emulator-5554 and save it to /tmp/screenshot.png.
```

```
@android-dev Show me the last 200 logcat lines filtered to "MyTag:D *:S".
```

---

## Tests

```bash
cd mcp/android-dev-mcp
npm install
npm test
```

The test suite validates:
- Working-directory safety rail (allowlist enforcement)
- Gradle task name derivation for APK and AAB builds
- ADB argument building for install, logcat, instrumentation
- Secret redaction logic

---

## Security & Safety Rails

| Rail | Behaviour |
|---|---|
| **Working directory allowlist** | Commands only run inside directories listed in `workingDirectories`. |
| **No shell interpolation** | `shell: false` on every spawned process — no injection risk. |
| **Secret redaction** | Keystore passwords are stripped from all captured stdout/stderr before returning to the MCP client. |
| **Command timeout** | Every command is killed after `commandTimeoutMs` (default 5 min). |
| **External network calls** | Hard-coded to `false`; the config field is ignored even if set to `true`. |

---

## Troubleshooting

**`adb: command not found`**  
Set `"androidSdk"` in your config or add `$ANDROID_HOME/platform-tools` to your `PATH`.

**`apksigner` not auto-detected**  
Ensure `build-tools/<version>/` exists inside your SDK. Or set `"apksigner": "/full/path"` in config.

**`KEYSTORE_STORE_PASSWORD not set`**  
Export the env var before starting the MCP server (see installation section).

**Timeout on `./gradlew` tasks**  
Increase `commandTimeoutMs` in your config (large projects can take > 5 min for first build).

**VS Code doesn't show Android tools in Copilot Chat**  
1. Verify the path in `mcp.json` / VS Code settings is absolute and correct.  
2. Restart VS Code.  
3. Check the Output panel → "Copilot Chat" for MCP startup errors.
