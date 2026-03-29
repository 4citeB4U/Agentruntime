<#
.SYNOPSIS
    Install the BYO Android Dev MCP server onto D:\mcp-android-dev (Windows only).

.DESCRIPTION
    This script:
      1. Checks for Node.js >= 18
      2. Copies/clones the server source to D:\mcp-android-dev (or a path you specify)
      3. Installs npm dependencies
      4. Builds the TypeScript source
      5. Creates a .env file from .env.example if one doesn't exist
      6. Prints the VS Code / Copilot Chat configuration snippet to use

.PARAMETER InstallPath
    Destination directory. Defaults to D:\mcp-android-dev.

.PARAMETER AndroidSdkRoot
    Path to your Android SDK root. Defaults to D:\android-sdk.

.PARAMETER JavaHome
    Path to Android Studio JBR (JDK 17). 
    Defaults to C:\Program Files\Android\Android Studio\jbr.

.PARAMETER ProjectRoot
    Path to your Android project (settings.gradle root).
    Defaults to D:\agent-lee-voxel-os\agent-lee-android.

.EXAMPLE
    # Standard D: drive install with defaults
    .\install-windows.ps1

.EXAMPLE
    # Custom paths
    .\install-windows.ps1 `
        -InstallPath "D:\tools\mcp-android-dev" `
        -AndroidSdkRoot "D:\android-sdk" `
        -JavaHome "D:\Android Studio\jbr" `
        -ProjectRoot "D:\my-android-app"
#>

[CmdletBinding()]
param(
    [string]$InstallPath   = "D:\mcp-android-dev",
    [string]$AndroidSdkRoot = "D:\android-sdk",
    [string]$JavaHome       = "C:\Program Files\Android\Android Studio\jbr",
    [string]$ProjectRoot    = "D:\agent-lee-voxel-os\agent-lee-android"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Helper functions ────────────────────────────────────────────────────────

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "  ▶  $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "  ✔  $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  ⚠  $msg" -ForegroundColor Yellow
}

function Write-Fail([string]$msg) {
    Write-Host "  ✘  $msg" -ForegroundColor Red
}

# ─── Banner ──────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║   BYO Android Dev MCP Server — Windows Installer    ║" -ForegroundColor Magenta
Write-Host "  ║   Read-only build/test/deploy/ADB toolset            ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ─── Step 1: Node.js check ───────────────────────────────────────────────────

Write-Step "Checking Node.js (>= 18 required)"

try {
    $nodeVersion = (node --version 2>&1).ToString().TrimStart("v")
    $nodeMajor   = [int]($nodeVersion.Split(".")[0])
    if ($nodeMajor -lt 18) {
        Write-Fail "Node.js $nodeVersion found but version 18+ is required."
        Write-Host "  Download: https://nodejs.org/en/download/" -ForegroundColor Gray
        exit 1
    }
    Write-OK "Node.js v$nodeVersion found"
} catch {
    Write-Fail "Node.js not found. Install Node.js 18+ from https://nodejs.org/"
    exit 1
}

# ─── Step 2: Resolve source directory (this script's parent) ─────────────────

Write-Step "Resolving source directory"

# The script lives in  <repo>\mcp-android-dev\scripts\
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceRoot = Split-Path -Parent $ScriptDir   # <repo>\mcp-android-dev

Write-OK "Source root: $SourceRoot"

# ─── Step 3: Create install directory ────────────────────────────────────────

Write-Step "Creating install directory: $InstallPath"

if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-OK "Directory created"
} else {
    Write-OK "Directory already exists"
}

# ─── Step 4: Copy source files ───────────────────────────────────────────────

Write-Step "Copying server source to $InstallPath"

$filesToCopy = @(
    "package.json",
    "tsconfig.json",
    ".env.example"
)

foreach ($f in $filesToCopy) {
    $src = Join-Path $SourceRoot $f
    $dst = Join-Path $InstallPath $f
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
    }
}

# Copy src/ directory
$srcDir = Join-Path $SourceRoot "src"
$dstDir = Join-Path $InstallPath "src"
if (Test-Path $srcDir) {
    Copy-Item $srcDir $dstDir -Recurse -Force
    Write-OK "Source files copied"
} else {
    Write-Fail "src/ directory not found in $SourceRoot"
    exit 1
}

# ─── Step 5: npm install ─────────────────────────────────────────────────────

Write-Step "Installing npm dependencies"

Push-Location $InstallPath
try {
    npm install --prefer-offline 2>&1 | Tee-Object -Variable npmOut | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm install failed. Output:`n$npmOut"
        exit 1
    }
    Write-OK "npm dependencies installed"
} finally {
    Pop-Location
}

# ─── Step 6: TypeScript build ────────────────────────────────────────────────

Write-Step "Compiling TypeScript"

Push-Location $InstallPath
try {
    npx tsc 2>&1 | Tee-Object -Variable tscOut | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "TypeScript compilation failed. Output:`n$tscOut"
        exit 1
    }
    Write-OK "TypeScript compiled → dist/"
} finally {
    Pop-Location
}

# ─── Step 7: Create .env from template ───────────────────────────────────────

Write-Step "Creating .env configuration"

$EnvDst = Join-Path $InstallPath ".env"

if (Test-Path $EnvDst) {
    Write-Warn ".env already exists — skipping (edit manually to update paths)"
} else {
    $envTemplate = @"
# Auto-generated by install-windows.ps1
# Edit this file to match your environment.

ANDROID_SDK_ROOT=$AndroidSdkRoot
ANDROID_HOME=$AndroidSdkRoot
JAVA_HOME=$JavaHome
ANDROID_PROJECT_ROOT=$ProjectRoot
MCP_TRANSPORT=stdio
LOG_LEVEL=info
"@
    $envTemplate | Set-Content -Path $EnvDst -Encoding UTF8
    Write-OK ".env created at $EnvDst"
}

# ─── Step 8: Validate paths ──────────────────────────────────────────────────

Write-Step "Validating configured paths"

$pathChecks = @{
    "Android SDK Root"   = $AndroidSdkRoot
    "Java Home (JBR)"    = $JavaHome
    "Android Project"    = $ProjectRoot
    "adb.exe"            = (Join-Path $AndroidSdkRoot "platform-tools\adb.exe")
}

foreach ($label in $pathChecks.Keys) {
    $p = $pathChecks[$label]
    if (Test-Path $p) {
        Write-OK "$label : $p"
    } else {
        Write-Warn "$label NOT FOUND: $p  (update .env after SDK/Studio install)"
    }
}

# ─── Step 9: Print VS Code / Copilot Chat config snippet ─────────────────────

$EntryPoint = Join-Path $InstallPath "dist\index.js"

Write-Host ""
Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   VS Code / GitHub Copilot Chat — MCP Configuration Snippet" -ForegroundColor Magenta
Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Add the following to your VS Code settings.json or" -ForegroundColor White
Write-Host "  .vscode/mcp.json in your workspace:" -ForegroundColor White
Write-Host ""
Write-Host @"
  {
    "mcpServers": {
      "android-dev": {
        "command": "node",
        "args": ["$($EntryPoint.Replace('\','\\'))"],
        "env": {
          "ANDROID_SDK_ROOT": "$($AndroidSdkRoot.Replace('\','\\'))",
          "ANDROID_HOME":     "$($AndroidSdkRoot.Replace('\','\\'))",
          "JAVA_HOME":        "$($JavaHome.Replace('\','\\'))",
          "ANDROID_PROJECT_ROOT": "$($ProjectRoot.Replace('\','\\'))"
        }
      }
    }
  }
"@ -ForegroundColor Yellow
Write-Host ""
Write-Host "  ─── PowerShell environment setup (run in each new shell) ──" -ForegroundColor Magenta
Write-Host ""
Write-Host @"
  `$env:ANDROID_SDK_ROOT        = '$AndroidSdkRoot'
  `$env:ANDROID_HOME            = '$AndroidSdkRoot'
  `$env:JAVA_HOME               = '$JavaHome'
  `$env:ANDROID_PROJECT_ROOT    = '$ProjectRoot'
  `$env:PATH = "$($AndroidSdkRoot)\platform-tools;$($JavaHome)\bin;`$env:PATH"
"@ -ForegroundColor Yellow
Write-Host ""
Write-Host "  ─── Or add permanently via System Environment Variables ────" -ForegroundColor Magenta
Write-Host ""
Write-Host @"
  [System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT',     '$AndroidSdkRoot',  'Machine')
  [System.Environment]::SetEnvironmentVariable('ANDROID_HOME',         '$AndroidSdkRoot',  'Machine')
  [System.Environment]::SetEnvironmentVariable('JAVA_HOME',            '$JavaHome',        'Machine')
  [System.Environment]::SetEnvironmentVariable('ANDROID_PROJECT_ROOT', '$ProjectRoot',     'User')
"@ -ForegroundColor Yellow
Write-Host ""

# ─── Done ────────────────────────────────────────────────────────────────────

Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   Installation complete!                             ║" -ForegroundColor Green
Write-Host "  ║   Server entry point: $EntryPoint" -ForegroundColor Green
Write-Host "  ║   Edit $EnvDst to adjust paths.     ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
