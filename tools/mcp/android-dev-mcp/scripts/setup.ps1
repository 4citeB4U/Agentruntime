<#
.SYNOPSIS
    Setup script for the Android Dev MCP server on Windows.

.DESCRIPTION
    Detects ANDROID_SDK_ROOT, JAVA_HOME (Android Studio JBR), and any
    bundletool JAR, then writes android-dev-mcp.config.json and prints
    the VS Code MCP configuration snippet to paste into settings.json.

.NOTES
    Run from the tools/mcp/android-dev-mcp/ folder:
        powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
    Or with a custom SDK/Java path:
        powershell -ExecutionPolicy Bypass -File scripts\setup.ps1 -AndroidSdkRoot D:\Android\Sdk -JavaHome "D:\Android Studio\jbr"
#>

[CmdletBinding()]
param(
    [string]$AndroidSdkRoot = "",
    [string]$JavaHome = "",
    [string]$BundletoolJar = "",
    [string[]]$AllowedWorkingDirs = @(),
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red }

# ── Step 1: Locate ANDROID_SDK_ROOT ─────────────────────────────────────────
Write-Step "Locating Android SDK"

if (-not $AndroidSdkRoot) {
    $AndroidSdkRoot = $env:ANDROID_SDK_ROOT
    if (-not $AndroidSdkRoot) { $AndroidSdkRoot = $env:ANDROID_HOME }
    if (-not $AndroidSdkRoot) {
        # Try common Android Studio install locations
        $candidates = @(
            "$env:LOCALAPPDATA\Android\Sdk",
            "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
            "D:\Android\Sdk",
            "D:\AndroidSdk"
        )
        foreach ($c in $candidates) {
            if (Test-Path "$c\platform-tools\adb.exe") {
                $AndroidSdkRoot = $c
                break
            }
        }
    }
}

if ($AndroidSdkRoot -and (Test-Path "$AndroidSdkRoot\platform-tools\adb.exe")) {
    Write-Ok "Android SDK: $AndroidSdkRoot"
} else {
    Write-Warn "Could not auto-detect Android SDK. Checked: $AndroidSdkRoot"
    Write-Warn "Set -AndroidSdkRoot parameter or install Android Studio."
    if (-not $AndroidSdkRoot) { $AndroidSdkRoot = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk" }
}

# ── Step 2: Locate JAVA_HOME (prefer Android Studio JBR) ─────────────────────
Write-Step "Locating Java (Android Studio JBR preferred)"

if (-not $JavaHome) {
    $JavaHome = $env:JAVA_HOME
    if (-not $JavaHome) {
        # Search for Android Studio JBR
        $asRoots = @(
            "$env:PROGRAMFILES\Android\Android Studio",
            "C:\Program Files\Android\Android Studio",
            "D:\Android Studio",
            "D:\Android\Android Studio"
        )
        foreach ($asRoot in $asRoots) {
            $jbrPath = "$asRoot\jbr"
            if (Test-Path "$jbrPath\bin\java.exe") {
                $JavaHome = $jbrPath
                break
            }
        }
    }
}

if ($JavaHome -and (Test-Path "$JavaHome\bin\java.exe")) {
    $javaVer = & "$JavaHome\bin\java.exe" -version 2>&1 | Select-Object -First 1
    Write-Ok "Java: $JavaHome  ($javaVer)"
} else {
    Write-Warn "Could not auto-detect Java. Checked: $JavaHome"
    Write-Warn "Set -JavaHome parameter, install Android Studio, or set JAVA_HOME."
    if (-not $JavaHome) { $JavaHome = $env:JAVA_HOME ?? "" }
}

# ── Step 3: Locate bundletool (optional) ─────────────────────────────────────
Write-Step "Looking for bundletool (optional)"

if (-not $BundletoolJar) {
    $candidates = @(
        "$PSScriptRoot\..\bundletool.jar",
        "$PSScriptRoot\bundletool.jar",
        "$env:USERPROFILE\Downloads\bundletool.jar",
        "D:\tools\bundletool.jar"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) {
            $BundletoolJar = (Resolve-Path $c).Path
            break
        }
    }
}

if ($BundletoolJar -and (Test-Path $BundletoolJar)) {
    Write-Ok "bundletool: $BundletoolJar"
} else {
    Write-Warn "bundletool.jar not found. AAB verification will be limited."
    Write-Warn "Download from https://github.com/google/bundletool/releases and set -BundletoolJar."
    $BundletoolJar = ""
}

# ── Step 4: Allowed working directories ──────────────────────────────────────
Write-Step "Configuring allowed working directories"

if ($AllowedWorkingDirs.Count -eq 0) {
    # Default: user's home and D:\ if it exists
    $AllowedWorkingDirs = @($env:USERPROFILE)
    if (Test-Path "D:\") {
        $AllowedWorkingDirs += "D:\"
    }
}

foreach ($d in $AllowedWorkingDirs) {
    if (Test-Path $d) {
        Write-Ok "Allowed dir: $d"
    } else {
        Write-Warn "Directory does not exist yet: $d  (will be created when the MCP runs)"
    }
}

# ── Step 5: Write config file ─────────────────────────────────────────────────
Write-Step "Writing android-dev-mcp.config.json"

$scriptDir = $PSScriptRoot
$configPath = Join-Path $scriptDir "..\android-dev-mcp.config.json"
$configPath = [System.IO.Path]::GetFullPath($configPath)

if ((Test-Path $configPath) -and -not $Force) {
    Write-Warn "Config already exists: $configPath"
    Write-Warn "Use -Force to overwrite."
} else {
    $config = [ordered]@{
        allowedWorkingDirs = $AllowedWorkingDirs
        androidSdkRoot     = $AndroidSdkRoot
        javaHome           = $JavaHome
        bundletoolJar      = $BundletoolJar
        maestroEnabled     = $false
    }
    $config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8
    Write-Ok "Config written: $configPath"
}

# ── Step 6: Find server entry point ──────────────────────────────────────────
Write-Step "Locating MCP server entry point"

$serverDir = $scriptDir | Split-Path -Parent
$distIndex = Join-Path $serverDir "dist\index.js"

if (-not (Test-Path $distIndex)) {
    Write-Warn "dist/index.js not found. Building now..."
    Push-Location $serverDir
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "    Installing npm dependencies..." -ForegroundColor Cyan
            npm install --silent
        }
        npm run build
        Write-Ok "Build complete."
    } finally {
        Pop-Location
    }
} else {
    Write-Ok "Server entry point: $distIndex"
}

# ── Step 7: Print VS Code MCP snippet ────────────────────────────────────────
Write-Step "VS Code MCP Configuration Snippet"

$serverPath = Join-Path $serverDir "dist\index.js"
$serverPath = [System.IO.Path]::GetFullPath($serverPath) -replace '\\', '\\\\'

$snippet = @"

  Add this to your VS Code settings.json (Ctrl+Shift+P -> "Open User Settings (JSON)"):

  "mcp": {
    "servers": {
      "android-dev": {
        "type": "stdio",
        "command": "node",
        "args": ["$serverPath"],
        "env": {
          "ANDROID_MCP_CONFIG": "$($configPath -replace '\\', '\\\\')"
        }
      }
    }
  }

  Or add it to your workspace .vscode/mcp.json:

  {
    "servers": {
      "android-dev": {
        "type": "stdio",
        "command": "node",
        "args": ["$serverPath"],
        "env": {
          "ANDROID_MCP_CONFIG": "$($configPath -replace '\\', '\\\\')"
        }
      }
    }
  }

"@

Write-Host $snippet -ForegroundColor White

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host "`n[Setup complete] Android Dev MCP server is ready.`n" -ForegroundColor Green
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Copy the JSON snippet above into VS Code settings or .vscode/mcp.json"
Write-Host "    2. Open a folder/workspace in VS Code (not just a single file)"
Write-Host "    3. Use GitHub Copilot Chat or another MCP client to call the tools"
Write-Host "    4. Verify with: diagnostics.android.health`n"
