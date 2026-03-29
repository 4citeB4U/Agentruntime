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

## Android Dev MCP Server (VS Code + GitHub Copilot)

An offline, read-only Android MCP server lives at:

```
tools/mcp/android-dev-mcp/
```

It lets VS Code and GitHub Copilot build APKs, run tests, stream logs, and control devices — **without modifying your source code**.

### Where to find the MCP files

**On GitHub (in your browser):**

1. Open <https://github.com/4citeB4U/Agentruntime>
2. Click the **`tools`** folder → **`mcp`** → **`android-dev-mcp`**

You should see `src/server.ts`, `package.json`, `tsconfig.json`, and `README.md`.

**Locally after `git clone` or `git pull` (Windows):**

Open PowerShell and run:

```powershell
# Clone (skip if you already have the repo)
git clone https://github.com/4citeB4U/Agentruntime.git D:\projects\Agentruntime

# Or pull latest changes into an existing clone
cd D:\projects\Agentruntime
git pull
```

Then verify the MCP folder exists:

```powershell
dir D:\projects\Agentruntime\tools\mcp\android-dev-mcp
```

You should see files listed (server.ts, package.json, etc.).

### Quick setup (Windows, D: drive)

```powershell
cd D:\projects\Agentruntime\tools\mcp\android-dev-mcp
npm install
npm run build
```

Then in VS Code, press **Ctrl+Shift+P** → **Preferences: Open User Settings (JSON)** and add:

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

Restart VS Code, open your project as a folder (**File → Open Folder…**), and ask Copilot:
> *"Use the Android MCP tool to list connected devices."*

> **Note:** Replace `C:\\Program Files\\Android\\Android Studio\\jbr` with the actual  
> path where Android Studio is installed on your machine. If you installed it on D:,  
> use `D:\\Program Files\\Android\\Android Studio\\jbr` or wherever it lives.  
> Check: **Android Studio → Help → About** for the runtime path.

➡️ Full instructions: [`tools/mcp/android-dev-mcp/README.md`](tools/mcp/android-dev-mcp/README.md)
