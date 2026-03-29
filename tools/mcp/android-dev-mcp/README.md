# Android Dev MCP Server

A **read-only** Model Context Protocol (MCP) server for Android development.  
It wraps `adb`, `gradlew`, `emulator`, `aapt2`, and `apksigner` so that  
VS Code + GitHub Copilot can build, test, deploy, and inspect Android devices  
**without modifying any source-code files**.

---

## Location in this repository

```
tools/
└── mcp/
    └── android-dev-mcp/      ← you are here
        ├── src/
        │   └── server.ts     ← MCP server source
        ├── package.json
        ├── tsconfig.json
        └── README.md
```

---

## Quick start on Windows (HP laptop, D: drive)

### Prerequisites (one-time)

| Tool | Where to get it | Check it works |
|------|----------------|----------------|
| **Node.js 18+** | <https://nodejs.org> (LTS, Windows installer) | `node -v` in PowerShell |
| **Android Studio** | already installed on D: | opens normally |
| **Android SDK** | included with Android Studio | check path in step 2 |

### Step 1 — Clone the repository (if you haven't already)

Open **PowerShell** and run:

```powershell
# Replace D:\projects with wherever you keep repos
cd D:\projects
git clone https://github.com/4citeB4U/Agentruntime.git
cd Agentruntime
```

Or, if you already have it cloned, just pull the latest changes:

```powershell
cd D:\projects\Agentruntime   # adjust path if different
git pull
```

After `git pull` you should see the folder:

```
D:\projects\Agentruntime\tools\mcp\android-dev-mcp\
```

### Step 2 — Find your Android SDK path

1. Open **Android Studio**
2. Go to **File → Settings → Languages & Frameworks → Android SDK**
3. Copy the **"Android SDK Location"** (something like `D:\Android\Sdk`)

### Step 3 — Build the MCP server

```powershell
cd D:\projects\Agentruntime\tools\mcp\android-dev-mcp
npm install
npm run build
```

This creates `dist/server.js`.

### Step 4 — Configure VS Code

Open VS Code, then press **Ctrl+Shift+P** → **Preferences: Open User Settings (JSON)**.

Add the following block (replace the paths with your actual paths):

```jsonc
{
  "mcp": {
    "servers": {
      "android-dev-mcp": {
        "type": "stdio",
        "command": "node",
        "args": [
          "D:\\projects\\Agentruntime\\tools\\mcp\\android-dev-mcp\\dist\\server.js"
        ],
        "env": {
          "ANDROID_SDK_ROOT": "D:\\Android\\Sdk",
          "ANDROID_HOME":     "D:\\Android\\Sdk",
          "JAVA_HOME":        "C:\\Program Files\\Android\\Android Studio\\jbr",
          "ANDROID_REPO_ROOT":"D:\\projects\\my-android-app"
        }
      }
    }
  }
}
```

> **Tip:** `ANDROID_REPO_ROOT` should point to the Android project you want to  
> build — this is separate from the Agentruntime repo itself.
>
> **Finding your JAVA_HOME:** In Android Studio go to **Help → About** and look for  
> "Runtime version". Or browse your Android Studio install folder and find the `jbr\` sub-folder.  
> If you installed Android Studio on D:, it will be something like `D:\Program Files\Android\Android Studio\jbr`.

### Step 5 — Restart VS Code and verify

1. Close and reopen VS Code.
2. Open a folder (**File → Open Folder…**) — MCPs only activate inside a workspace.
3. In Copilot Chat, ask:
   - *"Use the Android MCP tool to list connected devices."*
   - *"Build a debug APK for this repo."*

---

## Available tools

| Tool | What it does |
|------|-------------|
| `adb_list_devices` | List connected devices/emulators |
| `adb_logcat` | Capture logcat output (read-only, no device writes) |
| `adb_screenshot` | Take a screenshot and save it locally |
| `adb_install_apk` | Install a pre-built APK onto a device |
| `adb_shell` | Run safe read-only adb shell commands |
| `gradle_build` | Run a Gradle build task (`assembleDebug`, `bundleRelease`, …) |
| `gradle_test` | Run unit or instrumented tests |
| `gradle_lint` | Run lint analysis (no fixes applied) |
| `emulator_list_avds` | List available AVDs |
| `emulator_start` | Start an emulator AVD |
| `aapt2_dump` | Dump APK manifest/resources |
| `apksigner_verify` | Verify APK signature |

---

## Read-only policy

This server **never** writes to your source code.  
The following are explicitly blocked:

- `git commit`, `git push`, `git reset`, `git clean`
- `sed -i` (in-place file edits)
- Shell redirects that write to files (`echo … > file`)
- `rm -rf`

Any attempt to call these through the MCP tools will return an error.

---

## Troubleshooting

**MCPs don't show up in VS Code**
- Make sure you opened a **folder** (`File → Open Folder…`), not a single file.
- Check you are in the correct VS Code **Profile** (gear icon → Profiles).
- Make sure you're not in a WSL/SSH/Container window (check bottom-left corner).

**`node` or `npm` not found**
- Install Node.js LTS from <https://nodejs.org> and reopen PowerShell.

**`adb` not found**
- Set `ANDROID_SDK_ROOT` in the VS Code settings JSON (step 4 above).

**Build fails with Gradle error**
- Set `ANDROID_REPO_ROOT` to the root of your Android project.
- Make sure `gradlew.bat` exists in that folder.
