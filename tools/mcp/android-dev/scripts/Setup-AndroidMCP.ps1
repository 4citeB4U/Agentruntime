<#
.SYNOPSIS
    Setup script for the Android Dev MCP server on Windows.

.DESCRIPTION
    1. Detects ANDROID_SDK_ROOT / ANDROID_HOME from environment or common install locations.
    2. Detects JAVA_HOME from Android Studio JBR or a standard JDK installation.
    3. Detects Node.js.
    4. Writes android-mcp.config.json next to this script's parent folder.
    5. Installs npm dependencies and compiles TypeScript.
    6. Prints the VS Code MCP configuration snippet to paste.

.NOTES
    Run from PowerShell (not CMD) as a normal user – no elevation needed.
    If execution policy blocks the script, run:
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#>

$ErrorActionPreference = "Stop"

# ─── Locate this script's parent (tools/mcp/android-dev) ────────────────────

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path   # scripts/
$McpRoot   = Split-Path -Parent $ScriptDir                     # android-dev/

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Android Dev MCP Server – Windows Setup"                        -ForegroundColor Cyan
Write-Host "  MCP root: $McpRoot"                                             -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── 1) Detect Node.js ───────────────────────────────────────────────────────

Write-Host "[ 1/6 ] Checking Node.js..." -ForegroundColor Yellow
try {
    $NodeVersion = & node --version 2>&1
    Write-Host "        ✔ Node.js $NodeVersion found." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "  ✘ Node.js not found on PATH." -ForegroundColor Red
    Write-Host "  Please download and install Node.js LTS from https://nodejs.org"  -ForegroundColor Red
    Write-Host "  Then re-run this script."                                          -ForegroundColor Red
    exit 1
}

# ─── 2) Detect ANDROID_SDK_ROOT ──────────────────────────────────────────────

Write-Host ""
Write-Host "[ 2/6 ] Detecting Android SDK..." -ForegroundColor Yellow

$SdkRoot = $env:ANDROID_SDK_ROOT
if (-not $SdkRoot) { $SdkRoot = $env:ANDROID_HOME }

$CommonSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "D:\Android\Sdk"
)

if (-not $SdkRoot) {
    foreach ($p in $CommonSdkPaths) {
        if (Test-Path $p) {
            $SdkRoot = $p
            Write-Host "        Auto-detected SDK: $SdkRoot" -ForegroundColor Green
            break
        }
    }
}

if ($SdkRoot -and (Test-Path $SdkRoot)) {
    Write-Host "        ✔ Android SDK: $SdkRoot" -ForegroundColor Green
} else {
    Write-Host "        ⚠ Android SDK not found automatically." -ForegroundColor Yellow
    Write-Host "          Enter the full path to your Android SDK (or press Enter to skip):"
    $ManualSdk = Read-Host "          Android SDK path"
    if ($ManualSdk -and (Test-Path $ManualSdk)) {
        $SdkRoot = $ManualSdk
    } else {
        $SdkRoot = ""
        Write-Host "          Skipping SDK path – you can edit android-mcp.config.json later." -ForegroundColor Yellow
    }
}

# ─── 3) Detect JAVA_HOME ─────────────────────────────────────────────────────

Write-Host ""
Write-Host "[ 3/6 ] Detecting Java (Android Studio JBR / JDK 17)..." -ForegroundColor Yellow

$JavaHome = $env:JAVA_HOME

$CommonJavaPaths = @(
    # Android Studio JBR (most likely for Android developers on Windows)
    "$env:ProgramFiles\Android\Android Studio\jbr",
    "C:\Program Files\Android\Android Studio\jbr",
    "D:\Program Files\Android\Android Studio\jbr",
    # JDK 17 standard locations
    "$env:ProgramFiles\Java\jdk-17",
    "$env:ProgramFiles\Eclipse Adoptium\jdk-17*"
)

if (-not $JavaHome) {
    foreach ($p in $CommonJavaPaths) {
        # Support wildcards like jdk-17*
        $Resolved = Resolve-Path $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($Resolved -and (Test-Path (Join-Path $Resolved.Path "bin\java.exe"))) {
            $JavaHome = $Resolved.Path
            Write-Host "        Auto-detected JAVA_HOME: $JavaHome" -ForegroundColor Green
            break
        }
    }
}

if ($JavaHome -and (Test-Path (Join-Path $JavaHome "bin\java.exe"))) {
    $JavaVer = & "$JavaHome\bin\java.exe" -version 2>&1 | Select-Object -First 1
    Write-Host "        ✔ JAVA_HOME: $JavaHome ($JavaVer)" -ForegroundColor Green
} else {
    Write-Host "        ⚠ JAVA_HOME not found automatically." -ForegroundColor Yellow
    Write-Host "          Enter the full path to your JDK / Android Studio JBR (or press Enter to skip):"
    $ManualJava = Read-Host "          JAVA_HOME path"
    if ($ManualJava -and (Test-Path $ManualJava)) {
        $JavaHome = $ManualJava
    } else {
        $JavaHome = ""
        Write-Host "          Skipping JAVA_HOME – you can edit android-mcp.config.json later." -ForegroundColor Yellow
    }
}

# ─── 4) Choose project roots ─────────────────────────────────────────────────

Write-Host ""
Write-Host "[ 4/6 ] Configuring project allowlist..." -ForegroundColor Yellow
Write-Host "        Enter the root folder(s) of your Android projects (one per line)."
Write-Host "        These are the ONLY paths the MCP server will operate on."
Write-Host "        Press Enter with no input when done."

$AllowedRoots = @()
while ($true) {
    $RootInput = Read-Host "        Project root (or blank to finish)"
    if ([string]::IsNullOrWhiteSpace($RootInput)) { break }
    $AllowedRoots += $RootInput.Trim()
}

if ($AllowedRoots.Count -eq 0) {
    Write-Host "        ⚠ No project roots entered. The allowlist will be empty (all paths permitted)." -ForegroundColor Yellow
    Write-Host "          You can add them later by editing android-mcp.config.json."
}

# ─── 5) Write config ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "[ 5/6 ] Writing android-mcp.config.json..." -ForegroundColor Yellow

$ConfigPath = Join-Path $McpRoot "android-mcp.config.json"

$ConfigObj = [ordered]@{
    androidSdkRoot      = $SdkRoot
    javaHome            = $JavaHome
    allowedProjectRoots = $AllowedRoots
    defaultTimeoutMs    = 120000
    adbPath             = ""
    gradlewName         = "gradlew.bat"
    bundletoolJar       = ""
}

$ConfigJson = $ConfigObj | ConvertTo-Json -Depth 5
Set-Content -Path $ConfigPath -Value $ConfigJson -Encoding UTF8
Write-Host "        ✔ Config written to: $ConfigPath" -ForegroundColor Green

# ─── 6) Install npm deps and build ───────────────────────────────────────────

Write-Host ""
Write-Host "[ 6/6 ] Installing npm dependencies and building..." -ForegroundColor Yellow
Push-Location $McpRoot
try {
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    Write-Host "        ✔ Build complete." -ForegroundColor Green
} finally {
    Pop-Location
}

# ─── Print VS Code MCP configuration snippet ─────────────────────────────────

$EntryPoint = Join-Path $McpRoot "dist\index.js"
$EntryPoint = $EntryPoint -replace "\\", "\\"   # escape for JSON

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE – paste this into your VS Code settings.json" -ForegroundColor Cyan
Write-Host "  (Ctrl+Shift+P → 'Open User Settings JSON')"                   -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host @"
{
  "mcp": {
    "servers": {
      "android-dev": {
        "type": "stdio",
        "command": "node",
        "args": ["$EntryPoint"],
        "env": {
          "ANDROID_MCP_CONFIG": "$($ConfigPath -replace "\\", "\\")"
        }
      }
    }
  }
}
"@
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now open VS Code, start Copilot Chat, and ask it to"
Write-Host "use the 'android-dev' MCP tools."
Write-Host ""
Write-Host "If you see 'adb not found' errors, check that the platform-tools"
Write-Host "folder is in PATH or set adbPath in android-mcp.config.json."
Write-Host ""
