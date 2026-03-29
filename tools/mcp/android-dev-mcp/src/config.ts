/**
 * Config loading and working-directory allowlist for the Android Dev MCP server.
 *
 * Config file (android-dev-mcp.config.json) is looked up from:
 *   1. ANDROID_MCP_CONFIG env var (explicit path)
 *   2. Directory of this script (tools/mcp/android-dev-mcp/)
 */
import fs from "fs";
import path from "path";
import os from "os";

export interface McpConfig {
  /** Absolute paths that the MCP is allowed to operate in */
  allowedWorkingDirs: string[];
  androidSdkRoot: string;
  javaHome: string;
  /** Absolute path to bundletool JAR (optional) */
  bundletoolJar?: string;
  /** Whether to allow maestro commands (optional) */
  maestroEnabled?: boolean;
}

const CONFIG_FILENAME = "android-dev-mcp.config.json";

function resolveConfigPath(): string {
  if (process.env.ANDROID_MCP_CONFIG) {
    return process.env.ANDROID_MCP_CONFIG;
  }
  return path.join(__dirname, "..", CONFIG_FILENAME);
}

let _config: McpConfig | null = null;

export function loadConfig(): McpConfig {
  if (_config) return _config;

  const cfgPath = resolveConfigPath();
  if (!fs.existsSync(cfgPath)) {
    throw new Error(
      `Config file not found at ${cfgPath}. Run scripts/setup.ps1 first, or set ANDROID_MCP_CONFIG.`
    );
  }

  const raw = fs.readFileSync(cfgPath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<McpConfig>;

  if (!parsed.allowedWorkingDirs || parsed.allowedWorkingDirs.length === 0) {
    throw new Error("Config must specify at least one allowedWorkingDirs entry.");
  }
  if (!parsed.androidSdkRoot) {
    throw new Error("Config must specify androidSdkRoot.");
  }
  if (!parsed.javaHome) {
    throw new Error("Config must specify javaHome.");
  }

  // Normalize all paths with os.platform-aware separator
  _config = {
    allowedWorkingDirs: parsed.allowedWorkingDirs.map((p) => path.resolve(p)),
    androidSdkRoot: path.resolve(parsed.androidSdkRoot),
    javaHome: path.resolve(parsed.javaHome),
    bundletoolJar: parsed.bundletoolJar ? path.resolve(parsed.bundletoolJar) : undefined,
    maestroEnabled: parsed.maestroEnabled ?? false,
  };

  return _config;
}

/**
 * Validates that `dir` is inside one of the allowedWorkingDirs.
 * Throws if the directory is not in the allowlist or does not exist.
 */
export function assertAllowedDir(dir: string, config: McpConfig): string {
  const resolved = path.resolve(dir);

  const allowed = config.allowedWorkingDirs.some((allowedDir) => {
    const normalAllowed = allowedDir.endsWith(path.sep)
      ? allowedDir
      : allowedDir + path.sep;
    const normalResolved = resolved.endsWith(path.sep) ? resolved : resolved + path.sep;
    // Case-insensitive on Windows
    if (os.platform() === "win32") {
      return normalResolved.toLowerCase().startsWith(normalAllowed.toLowerCase());
    }
    return normalResolved.startsWith(normalAllowed);
  });

  if (!allowed) {
    throw new Error(
      `Directory "${resolved}" is not in the allowedWorkingDirs list. ` +
        `Allowed: ${config.allowedWorkingDirs.join(", ")}`
    );
  }

  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  return resolved;
}

/**
 * Resolves a path relative to a working directory and validates it stays within that dir.
 * Prevents path traversal attacks.
 */
export function safeResolvePath(workDir: string, relPath: string): string {
  const resolved = path.resolve(workDir, relPath);
  const normalWork = workDir.endsWith(path.sep) ? workDir : workDir + path.sep;

  // Allow exact match (resolved === workDir) or path inside workDir
  const isInside =
    resolved === workDir ||
    (os.platform() === "win32"
      ? resolved.toLowerCase().startsWith(normalWork.toLowerCase())
      : resolved.startsWith(normalWork));

  if (!isInside) {
    throw new Error(
      `Path "${relPath}" resolves outside the working directory "${workDir}".`
    );
  }
  return resolved;
}
