<#
.SYNOPSIS
    validate-mcp.ps1 — Quick diagnostic for MCP server connectivity in VS Code.

.DESCRIPTION
    Runs a series of checks to verify that your MCP servers (defined in
    .vscode/mcp.json) are likely to work in VS Code Copilot Chat.

    Run from the repository root:
        .\scripts\validate-mcp.ps1

.NOTES
    Requires:  PowerShell 5.1+ (Windows built-in) or PowerShell 7+
    No elevated privileges required.
#>

[CmdletBinding()]
param (
    [string]$WorkspaceRoot = (Get-Location).Path,
    [string]$AndroidHome   = $env:ANDROID_HOME,
    [string]$JavaHome      = $env:JAVA_HOME
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# ── Colour helpers ────────────────────────────────────────────────────────────
function Write-Pass  { param($msg) Write-Host "  [PASS] $msg" -ForegroundColor Green  }
function Write-Fail  { param($msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red    }
function Write-Warn  { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Info  { param($msg) Write-Host "  [INFO] $msg" -ForegroundColor Cyan   }
function Write-Title { param($msg) Write-Host "`n### $msg" -ForegroundColor White     }

$issues = 0

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host "  MCP Server Connectivity Diagnostic — Agentruntime Repo " -ForegroundColor Magenta
Write-Host "=========================================================" -ForegroundColor Magenta

# ── 1. VS Code version ────────────────────────────────────────────────────────
Write-Title "1. VS Code version (must be >= 1.99 for MCP support)"

$codePath = (Get-Command code -ErrorAction SilentlyContinue)?.Source
if ($codePath) {
    $codeVersion = (& code --version 2>&1 | Select-Object -First 1).Trim()
    $major, $minor = $codeVersion -split "\." | Select-Object -First 2
    if ([int]$major -ge 1 -and [int]$minor -ge 99) {
        Write-Pass "VS Code $codeVersion — MCP is supported."
    } else {
        Write-Fail "VS Code $codeVersion found — upgrade to 1.99+ for MCP support."
        $issues++
    }
} else {
    Write-Warn "VS Code 'code' CLI not found in PATH. Open VS Code and run: Shell Command: Install 'code' command in PATH"
}

# ── 2. GitHub Copilot extension ───────────────────────────────────────────────
Write-Title "2. GitHub Copilot extensions installed"

if ($codePath) {
    $extensions = & code --list-extensions 2>&1
    if ($extensions -contains "github.copilot") {
        Write-Pass "github.copilot is installed."
    } else {
        Write-Fail "github.copilot NOT installed. Install from VS Code Extensions marketplace."
        $issues++
    }
    if ($extensions -contains "github.copilot-chat") {
        Write-Pass "github.copilot-chat is installed."
    } else {
        Write-Fail "github.copilot-chat NOT installed. Install from VS Code Extensions marketplace."
        $issues++
    }
}

# ── 3. Workspace opened as folder (not single file) ──────────────────────────
Write-Title "3. Workspace configuration files present"

$mcpJson      = Join-Path $WorkspaceRoot ".vscode\mcp.json"
$settingsJson = Join-Path $WorkspaceRoot ".vscode\settings.json"

if (Test-Path $mcpJson) {
    Write-Pass ".vscode\mcp.json exists — VS Code will auto-discover these servers."
} else {
    Write-Fail ".vscode\mcp.json NOT found. Run: New-Item -ItemType File .vscode\mcp.json"
    $issues++
}

if (Test-Path $settingsJson) {
    $settingsContent = Get-Content $settingsJson -Raw
    if ($settingsContent -match "chat\.mcp\.discovery\.enabled") {
        Write-Pass ".vscode\settings.json has chat.mcp.discovery.enabled."
    } else {
        Write-Warn ".vscode\settings.json exists but chat.mcp.discovery.enabled not found."
    }
} else {
    Write-Warn ".vscode\settings.json not found — workspace settings not configured."
}

# ── 4. Node.js available ──────────────────────────────────────────────────────
Write-Title "4. Node.js (required to run stdio MCP servers)"

$nodePath = (Get-Command node -ErrorAction SilentlyContinue)?.Source
if ($nodePath) {
    $nodeVer = (& node --version 2>&1).Trim()
    Write-Pass "Node.js $nodeVer found at $nodePath"
} else {
    Write-Fail "Node.js NOT found in PATH. Download from https://nodejs.org"
    $issues++
}

$npmPath = (Get-Command npm -ErrorAction SilentlyContinue)?.Source
if ($npmPath) {
    $npmVer = (& npm --version 2>&1).Trim()
    Write-Pass "npm $npmVer found."
} else {
    Write-Fail "npm NOT found. Usually included with Node.js."
    $issues++
}

# ── 5. MCP server built ───────────────────────────────────────────────────────
Write-Title "5. Android Dev MCP server built"

$mcpDist = Join-Path $WorkspaceRoot "mcp-server\dist\index.js"
if (Test-Path $mcpDist) {
    Write-Pass "mcp-server\dist\index.js exists — server is built."
} else {
    Write-Warn "mcp-server\dist\index.js NOT found. Build it with:"
    Write-Info "  cd mcp-server && npm install && npm run build"
}

# ── 6. Android SDK ────────────────────────────────────────────────────────────
Write-Title "6. Android SDK"

if (-not $AndroidHome) {
    $AndroidHome = "D:\Android\Sdk"  # common Windows default on D: drive
}

if (Test-Path $AndroidHome) {
    Write-Pass "ANDROID_HOME = $AndroidHome"
    $adb = Join-Path $AndroidHome "platform-tools\adb.exe"
    if (Test-Path $adb) {
        $adbVer = (& $adb version 2>&1 | Select-Object -First 1).Trim()
        Write-Pass "adb found: $adbVer"
    } else {
        Write-Fail "adb.exe not found at $adb — install platform-tools via Android Studio SDK Manager."
        $issues++
    }
} else {
    Write-Warn "Android SDK not found at '$AndroidHome'."
    Write-Info "Set ANDROID_HOME env var or update .vscode\mcp.json with the correct path."
}

# ── 7. Java (JDK 17 / Android Studio JBR) ────────────────────────────────────
Write-Title "7. Java (JDK 17 or Android Studio JBR)"

$javaExe = if ($JavaHome) { Join-Path $JavaHome "bin\java.exe" } else { "java" }

$javaResult = & $javaExe -version 2>&1
if ($LASTEXITCODE -eq 0 -or $javaResult) {
    $javaVer = ($javaResult | Select-String "version" | Select-Object -First 1).ToString().Trim()
    Write-Pass "Java found: $javaVer"
    if ($javaVer -match '"17\.' -or $javaVer -match '"21\.') {
        Write-Pass "Java version is compatible (17 or 21 recommended for Android)."
    } else {
        Write-Warn "Java version may not be LTS 17. Android Gradle Plugin requires JDK 17+."
    }
} else {
    Write-Fail "java not found in PATH. Install Android Studio (includes JBR) or JDK 17."
    $issues++
}

# ── 8. Common WSL / Remote pitfall ───────────────────────────────────────────
Write-Title "8. WSL / Remote context check"

if ($env:WSLENV -or $env:WSL_DISTRO_NAME) {
    Write-Warn "Running inside WSL. VS Code MCP servers must match your VS Code remote context."
    Write-Info "If VS Code is connected via 'Remote - WSL', the server command runs in WSL."
    Write-Info "Ensure Node.js and adb are installed inside the WSL distro as well."
}

if ($env:SSH_CLIENT -or $env:SSH_CONNECTION) {
    Write-Warn "Running over SSH. Ensure the remote machine has Node.js and adb installed."
}

# ── 9. Multi-root workspace warning ──────────────────────────────────────────
Write-Title "9. Multi-root workspace warning"

$workspaceFiles = Get-ChildItem -Path $WorkspaceRoot -Filter "*.code-workspace" -ErrorAction SilentlyContinue
if ($workspaceFiles.Count -gt 0) {
    Write-Info "Found .code-workspace file(s): $($workspaceFiles.Name -join ', ')"
    Write-Info "In multi-root workspaces, .vscode/mcp.json is read per-folder."
    Write-Info "If servers are missing, ensure you open THIS folder's workspace root."
} else {
    Write-Pass "No .code-workspace files detected — single-root workspace (ideal for MCP)."
}

# ── 10. Summary ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=========================================================" -ForegroundColor Magenta
if ($issues -eq 0) {
    Write-Host "  All checks passed!  Your MCP server setup looks good." -ForegroundColor Green
} else {
    Write-Host "  $issues issue(s) found. Review the [FAIL] items above." -ForegroundColor Red
}
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Next steps after fixing issues:" -ForegroundColor White
Write-Host "  1. Rebuild MCP server:   cd mcp-server && npm install && npm run build" -ForegroundColor Cyan
Write-Host "  2. Open this folder in VS Code (File > Open Folder…)" -ForegroundColor Cyan
Write-Host "  3. Open Copilot Chat (Ctrl+Alt+I) and click the tools icon to see servers." -ForegroundColor Cyan
Write-Host "  4. If servers still missing, run: Ctrl+Shift+P > 'MCP: List Servers'" -ForegroundColor Cyan
Write-Host ""
