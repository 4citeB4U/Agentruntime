# MCP Server Troubleshooting Guide

> **Applies to:** VS Code 1.99+, GitHub Copilot Chat, Windows (with Android development on D:\\)

---

## Table of Contents

1. [Where MCP configuration should live](#1-where-mcp-configuration-should-live)
2. [How to open the correct folder as a workspace](#2-how-to-open-the-correct-folder-as-a-workspace)
3. [Common causes of MCP servers not appearing](#3-common-causes-of-mcp-servers-not-appearing)
4. [Remote contexts: WSL, SSH, Dev Containers](#4-remote-contexts-wsl-ssh-dev-containers)
5. [Quick diagnostic checklist](#5-quick-diagnostic-checklist)
6. [Building and starting the Android Dev MCP server](#6-building-and-starting-the-android-dev-mcp-server)
7. [Validating MCP connectivity from within VS Code](#7-validating-mcp-connectivity-from-within-vs-code)
8. [Windows path reference](#8-windows-path-reference)

---

## 1. Where MCP configuration should live

MCP servers can be configured in **three locations** (VS Code 1.99+):

| Location | File | Scope | When to use |
|---|---|---|---|
| **User settings** | `%APPDATA%\Code\User\settings.json` | All workspaces / profiles | Globally shared servers (e.g. Filesystem MCP) |
| **Workspace settings** | `.vscode/settings.json` | This folder only | Enable/disable workspace-level flags |
| **Workspace MCP file** ✅ *recommended* | `.vscode/mcp.json` | This folder only | Define per-project MCP servers; version-controlled |

### Why `.vscode/mcp.json` is the right choice for this repo

- Committed to source control — every team member gets the same server config automatically.
- Isolated per project — different Android projects can use different SDK paths.
- VS Code auto-discovers it when the folder is opened as a workspace root.

### Minimal `.vscode/mcp.json` structure

```jsonc
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "ANDROID_HOME": "D:\\Android\\Sdk"
      }
    }
  }
}
```

> **Important:** VS Code reads `mcp.json` only when `chat.mcp.discovery.enabled` is `true`
> in either user or workspace settings.  This repo's `.vscode/settings.json` already sets it.

---

## 2. How to open the correct folder as a workspace

MCP servers defined in `.vscode/mcp.json` are only loaded when VS Code opens that **exact folder** as the workspace root.

### ✅ Correct way — open the folder

```
File > Open Folder…  →  select D:\Agentruntime
```

or from a terminal:

```powershell
code D:\Agentruntime
```

### ❌ Wrong ways that break MCP discovery

| Mistake | Why it breaks |
|---|---|
| `code D:\Agentruntime\src\App.tsx` (single file) | No workspace root → `.vscode/` is not read |
| Dragging a file onto the VS Code icon | Same as above |
| Opening a parent folder (e.g. `D:\`) | `.vscode/mcp.json` inside `Agentruntime\` is not the active workspace |
| Using a `.code-workspace` that omits this folder | Only listed roots are scanned |

---

## 3. Common causes of MCP servers not appearing

### 3.1 VS Code version < 1.99

MCP support was introduced in **VS Code 1.99**.  Check:

```
Help > About  (or  code --version)
```

Upgrade from <https://code.visualstudio.com/>.

### 3.2 GitHub Copilot / Copilot Chat not installed or signed in

MCP servers surface inside **Copilot Chat**.  You need both extensions:

- `github.copilot`
- `github.copilot-chat`

Check sign-in status: bottom-left corner of VS Code → Accounts icon.

### 3.3 `chat.mcp.discovery.enabled` not set to `true`

Either in User Settings or in `.vscode/settings.json`:

```jsonc
"chat.mcp.discovery.enabled": true,
"github.copilot.chat.mcp.enabled": true
```

This repo's `.vscode/settings.json` sets both automatically.

### 3.4 Extension disabled per-workspace

Extensions can be individually disabled for a workspace.  Check:

```
Extensions panel (Ctrl+Shift+X)  →  search "Copilot"
→ if it shows "Enable (Workspace)", click it
```

### 3.5 Opening a single file instead of a folder

See [section 2](#2-how-to-open-the-correct-folder-as-a-workspace).

### 3.6 Multi-root workspace

If you use a `.code-workspace` file with multiple roots, each root has its own `.vscode/`.
Make sure the Agentruntime folder is listed as one of the `folders` entries:

```jsonc
{
  "folders": [
    { "path": "D:\\Agentruntime" }
  ]
}
```

### 3.7 VS Code Profiles

Profiles have independent extension lists.  If you switched profiles, re-install Copilot extensions for that profile:

```
Ctrl+Shift+P → "Profiles: Show current profile"
```

### 3.8 Server process fails to start

VS Code silently disables a server if its process exits immediately.  Common reasons:

| Symptom | Fix |
|---|---|
| `node: command not found` | Install Node.js LTS (<https://nodejs.org>) |
| `Cannot find module './dist/index.js'` | Build the server: `cd mcp-server && npm install && npm run build` |
| `ENOENT` for adb / gradlew | Set correct `ANDROID_HOME` in `.vscode/mcp.json` |

Check the **MCP Output channel**: `View > Output → select "MCP: android-dev"` from the dropdown.

---

## 4. Remote contexts: WSL, SSH, Dev Containers

### WSL (Windows Subsystem for Linux)

When VS Code is connected to WSL via the **Remote - WSL** extension:

- The `command` in `mcp.json` runs **inside WSL**, not on Windows.
- `node`, `adb`, and Java must be installed **in the WSL distro**.
- Windows paths like `D:\Android\Sdk` must be converted to `/mnt/d/Android/Sdk`.

**Recommendation:** Maintain a separate `mcp-wsl.json` or override env vars:

```jsonc
"env": {
  "ANDROID_HOME": "/mnt/d/Android/Sdk",
  "JAVA_HOME": "/mnt/d/android-studio/jbr"
}
```

### SSH Remote

Same principle: the MCP server command runs on the **remote machine**, not localhost.
Ensure the remote has Node.js + Android SDK installed.

### Dev Containers

The MCP server command runs inside the container.  Add the tools to your `Dockerfile`/`devcontainer.json`.

### Running locally on Windows (this repo's target)

No remote extension needed.  Open VS Code normally on Windows and the MCP server runs as a native Windows process.

---

## 5. Quick diagnostic checklist

Run the PowerShell validation script first:

```powershell
# From the repo root (D:\Agentruntime)
.\scripts\validate-mcp.ps1
```

Then manually verify each item below.

### ☐ Prerequisite checks

- [ ] VS Code version ≥ 1.99  (`code --version`)
- [ ] `github.copilot` extension installed and signed in
- [ ] `github.copilot-chat` extension installed
- [ ] Node.js LTS installed  (`node --version`)
- [ ] Android SDK present at `ANDROID_HOME`  (`adb version`)
- [ ] Java 17 present  (`java -version`)

### ☐ Workspace checks

- [ ] Opened folder **`D:\Agentruntime`** (not a parent folder, not a single file)
- [ ] `.vscode/mcp.json` present in the repo
- [ ] `.vscode/settings.json` has `"chat.mcp.discovery.enabled": true`
- [ ] MCP server built: `mcp-server/dist/index.js` exists

### ☐ In VS Code

- [ ] Extensions panel → Copilot shows **Enabled (Workspace)**
- [ ] `Ctrl+Shift+P` → `MCP: List Servers` → `android-dev` appears
- [ ] Copilot Chat → tools icon (⚙) → `android-dev` tools listed
- [ ] Output panel → `MCP: android-dev` shows `MCP server ready.`

### ☐ Test a tool

In Copilot Chat type:

```
@workspace /mcp adb_devices
```

Expected response lists connected devices or `List of devices attached` (empty if none connected).

---

## 6. Building and starting the Android Dev MCP server

### First-time setup (Windows PowerShell)

```powershell
# 1. Clone / navigate to repo
cd D:\Agentruntime

# 2. Install MCP server dependencies
cd mcp-server
npm install

# 3. Build TypeScript → JavaScript
npm run build

# 4. Verify the output exists
Test-Path dist\index.js   # should print True
```

### Updating the server after code changes

```powershell
cd D:\Agentruntime\mcp-server
npm run build
# VS Code auto-restarts the MCP server process — no reload needed
```

### Environment variables (edit in `.vscode/mcp.json`)

| Variable | Default in mcp.json | Description |
|---|---|---|
| `ANDROID_HOME` | `D:\Android\Sdk` | Android SDK root |
| `ANDROID_SDK_ROOT` | same as above | Legacy alias |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` | JDK / JBR path |
| `ANDROID_PROJECT_DIR` | `${workspaceFolder}` | Android project to build |
| `MCP_READONLY` | `"true"` | `"true"` = refuse file-modifying tools |

---

## 7. Validating MCP connectivity from within VS Code

### Method A — Command Palette

1. `Ctrl+Shift+P` → type `MCP: List Servers`
2. Verify `android-dev` appears with status **Running**.
3. If status is **Stopped** or **Error**, click it to see the error.

### Method B — Copilot Chat tool picker

1. Open Copilot Chat: `Ctrl+Alt+I`
2. Click the **tools icon (⚙)** next to the message box.
3. Expand **android-dev** — you should see all 10 tools listed.

### Method C — Ask Copilot directly

```
List all available MCP tools for Android development.
```

Copilot will enumerate the tools from the server.

### Method D — Output channel

1. `View > Output`
2. Dropdown → select **`MCP: android-dev`**
3. Look for:

   ```
   [android-dev-mcp] Running in READ-ONLY mode.
   [android-dev-mcp] ANDROID_HOME = D:\Android\Sdk
   [android-dev-mcp] MCP server ready.
   ```

---

## 8. Windows path reference

| Item | Typical Windows path |
|---|---|
| Android SDK | `D:\Android\Sdk` |
| platform-tools (adb) | `D:\Android\Sdk\platform-tools\` |
| Android Studio JBR | `C:\Program Files\Android\Android Studio\jbr\` |
| Gradle wrapper | `D:\Agentruntime\gradlew.bat` |
| MCP server source | `D:\Agentruntime\mcp-server\src\index.ts` |
| MCP server build output | `D:\Agentruntime\mcp-server\dist\index.js` |
| VS Code user settings | `%APPDATA%\Code\User\settings.json` |
| VS Code workspace MCP | `D:\Agentruntime\.vscode\mcp.json` |

> **Tip:** In JSON files on Windows, always use **double backslashes** (`\\`) or forward slashes (`/`) in paths.

---

*For issues or improvements, open a GitHub issue at [4citeB4U/Agentruntime](https://github.com/4citeB4U/Agentruntime/issues).*
