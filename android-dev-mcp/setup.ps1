# ============================================================
#  Android Dev MCP — Windows Setup Script
#  Run this from PowerShell (Run as Administrator not required)
#
#  Usage:
#    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
#    .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Android Dev MCP — Windows Setup"              -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verify Node.js LTS ────────────────────────────────────────────────────
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 18) {
        Write-Host "  ERROR: Node.js $nodeVersion is too old. Please install Node LTS (v18+)." -ForegroundColor Red
        Write-Host "  Download: https://nodejs.org/en/download" -ForegroundColor Red
        exit 1
    }
    Write-Host "  OK: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Install Node LTS from https://nodejs.org/en/download" -ForegroundColor Red
    exit 1
}

# ── 2. Verify npm ─────────────────────────────────────────────────────────────
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    Write-Host "  OK: npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm not found. It should come with Node.js." -ForegroundColor Red
    exit 1
}

# ── 3. Detect Android SDK ─────────────────────────────────────────────────────
Write-Host "Detecting Android SDK..." -ForegroundColor Yellow
$sdkRoot = $env:ANDROID_SDK_ROOT
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_HOME }
if (-not $sdkRoot) {
    $defaultSdk = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $defaultSdk) { $sdkRoot = $defaultSdk }
}
if ($sdkRoot -and (Test-Path $sdkRoot)) {
    Write-Host "  OK: Android SDK found at $sdkRoot" -ForegroundColor Green
    [System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
    Write-Host "  Set ANDROID_SDK_ROOT for current user." -ForegroundColor Green
} else {
    Write-Host "  WARNING: Android SDK not found at default location." -ForegroundColor Yellow
    Write-Host "  Please enter the full path to your Android SDK" -ForegroundColor Yellow
    Write-Host "  (e.g. C:\Users\YourName\AppData\Local\Android\Sdk)" -ForegroundColor Yellow
    $sdkRoot = Read-Host "  ANDROID_SDK_ROOT"
    if ($sdkRoot -and (Test-Path $sdkRoot)) {
        [System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
        Write-Host "  Saved ANDROID_SDK_ROOT = $sdkRoot" -ForegroundColor Green
    } else {
        Write-Host "  Path not found. Skipping ANDROID_SDK_ROOT — you can set it later." -ForegroundColor Yellow
    }
}

# ── 4. Detect ADB ─────────────────────────────────────────────────────────────
Write-Host "Checking adb..." -ForegroundColor Yellow
$adbPath = if ($sdkRoot) { "$sdkRoot\platform-tools\adb.exe" } else { "adb" }
$adbFound = $false
if ($sdkRoot -and (Test-Path "$sdkRoot\platform-tools\adb.exe")) {
    $adbFound = $true
    Write-Host "  OK: adb found at $sdkRoot\platform-tools\adb.exe" -ForegroundColor Green
    # Add platform-tools to user PATH if not already present
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $ptPath = "$sdkRoot\platform-tools"
    if ($userPath -notlike "*$ptPath*") {
        [System.Environment]::SetEnvironmentVariable("PATH", "$userPath;$ptPath", "User")
        Write-Host "  Added platform-tools to user PATH." -ForegroundColor Green
    }
} else {
    try {
        adb version | Out-Null
        $adbFound = $true
        Write-Host "  OK: adb is already on PATH" -ForegroundColor Green
    } catch {
        Write-Host "  WARNING: adb not found. Install Android SDK Platform-Tools." -ForegroundColor Yellow
        Write-Host "  In Android Studio: SDK Manager → SDK Tools → Android SDK Platform-Tools" -ForegroundColor Yellow
    }
}

# ── 5. Detect JAVA_HOME (Android Studio JBR first) ───────────────────────────
Write-Host "Detecting Java (Android Studio JBR)..." -ForegroundColor Yellow
$javaHome = $env:JAVA_HOME
$jbrCandidates = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Android\Android Studio\jre",
    "${env:ProgramFiles(x86)}\Android\Android Studio\jbr"
)
if (-not $javaHome) {
    foreach ($candidate in $jbrCandidates) {
        if (Test-Path $candidate) {
            $javaHome = $candidate
            break
        }
    }
}
if ($javaHome -and (Test-Path $javaHome)) {
    Write-Host "  OK: JAVA_HOME = $javaHome" -ForegroundColor Green
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    Write-Host "  Set JAVA_HOME for current user." -ForegroundColor Green
} else {
    Write-Host "  WARNING: JAVA_HOME not found automatically." -ForegroundColor Yellow
    Write-Host "  If Android Studio is installed, find the JBR inside it:" -ForegroundColor Yellow
    Write-Host "    C:\Program Files\Android\Android Studio\jbr" -ForegroundColor Yellow
    Write-Host "  Or enter the path to your JDK 17 installation:" -ForegroundColor Yellow
    $javaHome = Read-Host "  JAVA_HOME (press Enter to skip)"
    if ($javaHome -and (Test-Path $javaHome)) {
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
        Write-Host "  Saved JAVA_HOME = $javaHome" -ForegroundColor Green
    } else {
        Write-Host "  Skipping JAVA_HOME — you can set it later." -ForegroundColor Yellow
    }
}

# ── 6. Install MCP server dependencies ───────────────────────────────────────
Write-Host ""
Write-Host "Installing MCP server npm dependencies..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed." -ForegroundColor Red
    exit 1
}
Write-Host "  OK: dependencies installed." -ForegroundColor Green

# ── 7. Build the TypeScript source ───────────────────────────────────────────
Write-Host "Building MCP server (TypeScript compile)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: TypeScript build failed." -ForegroundColor Red
    exit 1
}
Write-Host "  OK: build succeeded. Output is in ./dist/" -ForegroundColor Green

# ── 8. Print VS Code MCP configuration snippet ───────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add the following to your VS Code settings (settings.json)" -ForegroundColor White
Write-Host "or to your .vscode/mcp.json in each workspace:" -ForegroundColor White
Write-Host ""

$distPath = Join-Path $scriptDir "dist\index.js"
$snippet = @"
{
  "mcp": {
    "servers": {
      "android-dev-mcp": {
        "type": "stdio",
        "command": "node",
        "args": ["$distPath"],
        "env": {
          "ANDROID_SDK_ROOT": "$sdkRoot",
          "JAVA_HOME": "$javaHome"
        }
      }
    }
  }
}
"@
Write-Host $snippet -ForegroundColor Yellow
Write-Host ""
Write-Host "Restart VS Code after adding the configuration." -ForegroundColor Cyan
Write-Host "Then open GitHub Copilot Chat and ask: @android-dev-mcp health_check" -ForegroundColor Cyan
Write-Host ""
